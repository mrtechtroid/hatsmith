// public/service-worker.js
// Production-ready service worker for Hatsmith.
// - Loads libsodium-wrappers at runtime via importScripts (browser build).
// - Implements robust streaming interception for /api/download-file:
//   ALWAYS responds with a streaming Response when the request is made,
//   and the encryption logic writes to the stream when ready.
// - Preserves libsodium secretstream XChaCha20-Poly1305 and Argon2id usage.
// - Message protocol preserved: prepareFileNameEnc, requestEncryption,
//   encryptFirstChunk, encryptContinue, encKeyPair, requestDecKeyPair, resetSWState,
//   requestDownloadReady, clientHello.
//
// This file is safe to serve from /public (no bundling required).
'use strict';

// Load libsodium browser build; pinned to match package.json libsodium-wrappers version.
importScripts('https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.15/dist/browsers/sodium.js');

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Streaming & crypto state
let activeStreamReadable = null; // Readable side passed to fetch response
let activeStreamWriter = null;   // Writable writer used by SW to write encrypted bytes
let fetchResponded = false;      // true if respondWith was called for the current download
let responseStarted = false;
let fileName = 'encrypted_file.enc';
let derivedKey = null;
let pushState = null;
let headerBuf = null;
let encryptionInProgress = false;
let sodiumReady = false;
let lastClient = null;

// Utility: post message to specified client or broadcast to all clients as fallback
async function postToClient(client, payload) {
  try {
    if (client && client.postMessage) {
      client.postMessage(payload);
      return;
    }
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of clientsList) {
      try { c.postMessage(payload); } catch (e) {}
    }
  } catch (e) {
    console.warn('[SW] postToClient error', e);
  }
}

// Wait for libsodium to be ready
sodium.ready.then(() => {
  sodiumReady = true;
  console.log('[SW] libsodium ready');

  self.addEventListener('install', (ev) => {
    ev.waitUntil(self.skipWaiting());
    console.log('[SW] install');
  });

  self.addEventListener('activate', (ev) => {
    ev.waitUntil(self.clients.claim());
    console.log('[SW] activate');
  });

  // Message handler from page
  self.addEventListener('message', async (ev) => {
    const data = ev.data || {};
    const client = ev.source || null;
    lastClient = client;
    const cmd = data.cmd || data.type || null;

    try {
      switch (cmd) {
        case 'clientHello':
          // diagnostic ping
          await postToClient(client, { reply: 'hello' });
          break;

        case 'prepareFileNameEnc':
          fileName = (data.fileName && String(data.fileName)) || fileName;
          resetStreamState();
          await postToClient(client, { reply: 'filePreparedEnc' });
          break;

        case 'prepareFileNameDec':
          fileName = (data.fileName && String(data.fileName)) || fileName;
          resetStreamState();
          await postToClient(client, { reply: 'filePreparedDec' });
          break;

        case 'resetSWState':
          resetEverything();
          await postToClient(client, { reply: 'resetOK' });
          break;

        case 'requestDownloadReady':
          await postToClient(client, { reply: (responseStarted ? 'downloadReady' : 'notReady') });
          break;

        case 'requestEncryption':
          await startSymmetricKeyDerivation(data.password, client);
          break;

        case 'encryptFirstChunk':
          await encryptFirstChunk(data.chunk, !!data.last, client);
          break;

        case 'encryptContinue':
        case 'encryptNextChunk':
          await continueEncrypt(data.chunk, !!data.last, client);
          break;

        case 'encKeyPair':
          await encKeyPair(data.csk, data.spk, data.mode, client);
          break;

        case 'requestDecKeyPair':
          await requestDecKeyPair(data.ssk, data.cpk, data.header, data.decFileBuff, data.mode, client);
          break;

        default:
          // ignore unknown messages
          break;
      }
    } catch (err) {
      console.error('[SW] message handler unexpected error', err);
      await postToClient(client, { reply: 'swError', error: String(err) });
    }
  });

  // Ensure a streaming Response exists for the /api/download-file fetch.
  // If none exists yet, create a TransformStream and immediately respond so the page's fetch/navigation
  // stays pending and will receive bytes when the encryption logic writes them.
  async function ensureResponseForFetch(event) {
    if (fetchResponded && activeStreamReadable) {
      return true;
    }

    const ts = new TransformStream();
    activeStreamReadable = ts.readable;
    activeStreamWriter = ts.writable.getWriter();

    const headers = {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-cache'
    };

    try {
      event.respondWith(new Response(activeStreamReadable, { headers }));
      fetchResponded = true;
      responseStarted = true;
      console.log('[SW] fetch responded with streaming Response');
      return true;
    } catch (err) {
      console.error('[SW] respondWith failed', err);
      try { activeStreamWriter.close(); } catch (e) {}
      activeStreamReadable = null;
      activeStreamWriter = null;
      fetchResponded = false;
      responseStarted = false;
      return false;
    }
  }

  // Fetch handler - only intercept download endpoint
  self.addEventListener('fetch', (event) => {
    try {
      const req = event.request;
      if (!req || !req.url) return;
      if (!req.url.includes('/api/download-file')) return;

      // Ensure streaming response is in place so the page will receive bytes when encryption writes them.
      ensureResponseForFetch(event).catch((err) => {
        console.error('[SW] ensureResponseForFetch error', err);
      });
    } catch (err) {
      console.error('[SW] fetch handler error', err);
      // Fail open: let request go through
    }
  });

  // Helper: reset stream writer/reader
  function resetStreamState() {
    try {
      if (activeStreamWriter) {
        try { activeStreamWriter.close(); } catch (e) {}
      }
    } catch (e) {}
    activeStreamReadable = null;
    activeStreamWriter = null;
    fetchResponded = false;
    responseStarted = false;
  }

  function resetEverything() {
    resetStreamState();
    fileName = 'encrypted_file.enc';
    derivedKey = null;
    pushState = null;
    headerBuf = null;
    encryptionInProgress = false;
  }

  // Password-based key derivation (Argon2id via libsodium pwhash)
  async function startSymmetricKeyDerivation(password, client) {
    try {
      if (!sodiumReady) {
        await postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }
      if (typeof password !== 'string') {
        await postToClient(client, { reply: 'encryptionError', error: 'password must be a string' });
        return;
      }

      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
      const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
      const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
      const alg = sodium.crypto_pwhash_ALG_ARGON2ID13 || sodium.crypto_pwhash_ALG_DEFAULT;

      derivedKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        opslimit,
        memlimit,
        alg
      );

      await postToClient(client, { reply: 'symmetricKeyReady' });
    } catch (err) {
      console.error('[SW] startSymmetricKeyDerivation failed', err);
      await postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  // Initialize and write header, then encrypt first chunk and optionally finalize
  async function encryptFirstChunk(chunkArrayBuffer, last, client) {
    try {
      if (!sodiumReady) {
        await postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }

      if (!derivedKey) {
        await postToClient(client, { reply: 'encryptionError', error: 'no key derived' });
        return;
      }

      // Ensure a stream exists so the page's fetch will receive bytes even if it was called earlier.
      if (!activeStreamReadable || !activeStreamWriter) {
        const ts = new TransformStream();
        activeStreamReadable = ts.readable;
        activeStreamWriter = ts.writable.getWriter();
        responseStarted = true;
        fetchResponded = false;
      }

      encryptionInProgress = true;

      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      await activeStreamWriter.write(headerBuf);

      const chunkU8 = new Uint8Array(chunkArrayBuffer || new ArrayBuffer(0));
      const enc = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        chunkU8,
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
      );

      await activeStreamWriter.write(enc);

      if (last) {
        const lastEnc = sodium.crypto_secretstream_xchacha20poly1305_push(
          pushState,
          new Uint8Array(0),
          null,
          sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        );
        await activeStreamWriter.write(lastEnc);
        try { await activeStreamWriter.close(); } catch (e) {}
        encryptionInProgress = false;
        await postToClient(client, { reply: 'encryptionFinished' });
      } else {
        await postToClient(client, { reply: 'continueEncryption' });
      }
    } catch (err) {
      console.error('[SW] encryptFirstChunk error', err);
      try { await activeStreamWriter.abort(String(err)); } catch (e) {}
      encryptionInProgress = false;
      await postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  async function continueEncrypt(chunkArrayBuffer, last, client) {
    try {
      if (!pushState || !activeStreamWriter) {
        await postToClient(client, { reply: 'encryptionError', error: 'encryption not initialized' });
        return;
      }

      const chunkU8 = new Uint8Array(chunkArrayBuffer || new ArrayBuffer(0));
      const tag = last ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
                       : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

      const enc = sodium.crypto_secretstream_xchacha20poly1305_push(pushState, chunkU8, null, tag);

      await activeStreamWriter.write(enc);

      if (last) {
        try { await activeStreamWriter.close(); } catch (e) {}
        encryptionInProgress = false;
        await postToClient(client, { reply: 'encryptionFinished' });
      } else {
        await postToClient(client, { reply: 'continueEncryption' });
      }
    } catch (err) {
      console.error('[SW] continueEncrypt error', err);
      try { await activeStreamWriter.abort(String(err)); } catch (e) {}
      await postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  // Asymmetric encryption initialization: compute shared secret and derive key
  async function encKeyPair(cskBase64, spkBase64, mode, client) {
    try {
      if (!sodiumReady) {
        await postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }
      if (!cskBase64 || !spkBase64) {
        await postToClient(client, { reply: 'encryptionError', error: 'missing keys' });
        return;
      }

      const csk = sodium.from_base64(cskBase64, sodium.base64_variants.ORIGINAL);
      const spk = sodium.from_base64(spkBase64, sodium.base64_variants.ORIGINAL);

      if (csk.length !== sodium.crypto_scalarmult_SCALARBYTES || spk.length !== sodium.crypto_scalarmult_BYTES) {
        await postToClient(client, { reply: 'wrongKeyPair' });
        return;
      }

      const shared = sodium.crypto_scalarmult(csk, spk);
      derivedKey = sodium.crypto_generichash(sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES, shared);

      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      if (!activeStreamReadable || !activeStreamWriter) {
        const ts = new TransformStream();
        activeStreamReadable = ts.readable;
        activeStreamWriter = ts.writable.getWriter();
        responseStarted = true;
        fetchResponded = false;
      }

      await activeStreamWriter.write(headerBuf);

      await postToClient(client, { reply: 'keyPairReady' });
    } catch (err) {
      console.error('[SW] encKeyPair error', err);
      await postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  async function requestDecKeyPair(sskBase64, cpkBase64, headerArg, decFileBuff, mode, client) {
    try {
      if (!sodiumReady) {
        await postToClient(client, { reply: 'decryptionError', error: 'sodium not ready' });
        return;
      }

      if (!sskBase64 || !cpkBase64) {
        await postToClient(client, { reply: 'decryptionError', error: 'missing keys' });
        return;
      }

      const ssk = sodium.from_base64(sskBase64, sodium.base64_variants.ORIGINAL);
      const cpk = sodium.from_base64(cpkBase64, sodium.base64_variants.ORIGINAL);

      if (ssk.length !== sodium.crypto_scalarmult_SCALARBYTES || cpk.length !== sodium.crypto_scalarmult_BYTES) {
        await postToClient(client, { reply: 'wrongDecKeyPair' });
        return;
      }

      if (ssk.every(b => b === 0) || cpk.every(b => b === 0)) {
        await postToClient(client, { reply: 'weakDecKey' });
        return;
      }

      await postToClient(client, { reply: 'goodDecKey' });
    } catch (err) {
      console.error('[SW] requestDecKeyPair error', err);
      await postToClient(client, { reply: 'decryptionError', error: String(err) });
    }
  }

}).catch((e) => {
  console.error('[SW] sodium failed to initialize', e);
  // Service worker is still installable but crypto features will error via messages.
});
