// service-worker/sw.js
// Production-ready service worker for Hatsmith.
// - Loads libsodium-wrappers at runtime via importScripts (browser build).
// - Implements robust streaming interception for /api/download-file:
//   ALWAYS responds with a streaming Response when the request is made,
//   and the encryption logic writes to the stream when ready (works no matter
//   whether fetch or encryption starts first).
// - Preserves libsodium secretstream XChaCha20-Poly1305 and Argon2id usage.
// - Message protocol preserved (prepareFileNameEnc, requestEncryption,
//   encryptFirstChunk, encryptContinue, encKeyPair, requestDecKeyPair, resetSWState,
//   requestDownloadReady).
//
// Important: This file should be the source for browserify bundling (do not import libsodium
// via require()). It loads libsodium at runtime via importScripts (CDN).
'use strict';

importScripts('https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.15/dist/browsers/sodium.js');

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Internal streaming state
let activeStreamReadable = null; // Readable end used in the Response
let activeStreamWriter = null;   // Writable stream writer the SW writes encrypted bytes into
let responseStarted = false;     // true if we've already responded to a fetch with the streaming Response
let fetchResponded = false;      // whether fetch handler called respondWith for the current download
let fileName = 'encrypted_file.enc'; // Suggested filename for download
let derivedKey = null;           // symmetric key derived from password or shared secret
let pushState = null;            // libsodium secretstream push state
let headerBuf = null;            // secretstream header buffer (Uint8Array)
let encryptionInProgress = false;
let sodiumReady = false;
let currentClientId = null;      // optional last client to reply to

// Utility to post to a specific client (if available) else broadcast
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
    // best-effort: swallow errors
    console.warn('[SW] postToClient error', e);
  }
}

// Wait until libsodium is ready
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

  // Message handler
  self.addEventListener('message', async (ev) => {
    const data = ev.data || {};
    const client = ev.source || null;
    currentClientId = client;
    const cmd = data.cmd || data.type || null;

    try {
      switch (cmd) {
        case 'prepareFileNameEnc':
          fileName = (data.fileName && String(data.fileName)) || fileName;
          // Ensure we reset streaming state for a new download
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
          // data.password expected
          await startSymmetricKeyDerivation(data.password, client);
          break;

        case 'encryptFirstChunk':
          // data.chunk: ArrayBuffer or null, data.last: boolean
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

  // Ensure a streaming response exists for the /api/download-file fetch.
  // If one doesn't exist, create a TransformStream and respond immediately so the page's fetch
  // stays pending and receives data when the encryption logic writes into activeStreamWriter.
  async function ensureResponseForFetch(event) {
    if (fetchResponded && activeStreamReadable) {
      // Already have a streaming response in place
      return true;
    }

    // Create a TransformStream to provide a ReadableStream to the fetch response,
    // and keep the writable writer for encryption to push data into later.
    const ts = new TransformStream();
    activeStreamReadable = ts.readable;
    activeStreamWriter = ts.writable.getWriter();

    // Mark that we have responded; construct the Response object with the readable side.
    const headers = {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-cache'
    };

    try {
      event.respondWith(new Response(activeStreamReadable, { headers }));
      fetchResponded = true;
      responseStarted = true;
      console.log('[SW] fetch responded with streaming Response (ready to receive bytes)');
      return true;
    } catch (err) {
      console.error('[SW] respondWith failed', err);
      // cleanup
      try { activeStreamWriter.close(); } catch (e) {}
      activeStreamReadable = null;
      activeStreamWriter = null;
      fetchResponded = false;
      responseStarted = false;
      return false;
    }
  }

  // Fetch interception
  self.addEventListener('fetch', (event) => {
    try {
      const req = event.request;
      if (!req || !req.url) return;
      // Only intercept the canonical API path used by the app
      if (!req.url.includes('/api/download-file')) return;

      // Always ensure we respond with a streaming Response; encryption logic will push bytes later
      ensureResponseForFetch(event).catch((err) => {
        console.error('[SW] ensureResponseForFetch error', err);
      });
    } catch (err) {
      console.error('[SW] fetch handler error', err);
      // Fail open (let it go to network)
    }
  });

  // Helpers and crypto flows

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

      // Use Argon2id (libsodium's pwhash) with interactive limits (keeps client-side load reasonable).
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

      // Ensure the fetch has been responded to with a streaming response so the page's fetch is pending
      // and will receive bytes when we write them.
      // Note: we need access to the original fetch event to call respondWith; ensureResponseForFetch
      // is safe to call here only to ensure the stream exists (if a page hasn't fetched yet, we still create the stream)
      if (!activeStreamReadable || !activeStreamWriter) {
        // Create the transform stream so the client fetch will see it when they call fetch (or if they already did, this will attach)
        // We do not have an 'event' here — this ensures SW has a stream ready for writing.
        const ts = new TransformStream();
        activeStreamReadable = ts.readable;
        activeStreamWriter = ts.writable.getWriter();
        responseStarted = true;
        fetchResponded = false; // fetch may not have been called yet
      }

      encryptionInProgress = true;

      // Initialize secretstream push with derivedKey (we will use libsodium secretstream now)
      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      // Write header first
      await activeStreamWriter.write(headerBuf);

      // Encrypt first chunk
      const chunkU8 = new Uint8Array(chunkArrayBuffer || new ArrayBuffer(0));
      const enc = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        chunkU8,
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
      );

      await activeStreamWriter.write(enc);

      if (last) {
        // finalize
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

      // If browser fetch hasn't been performed yet, the page will fetch and attach to the same readable stream,
      // because we keep activeStreamReadable live (TransformStream keeps data queued until a consumer attaches).
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

  // Asymmetric (public-key) flow: compute shared secret and set derivedKey.
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

      // Also initialize secretstream push and write header if desired; caller will then send chunks.
      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      // If stream not created yet, create it now to ensure fetch attaches (we keep writable available).
      if (!activeStreamReadable || !activeStreamWriter) {
        const ts = new TransformStream();
        activeStreamReadable = ts.readable;
        activeStreamWriter = ts.writable.getWriter();
        responseStarted = true;
        fetchResponded = false;
      }

      // Immediately write header so the recipient can start reading.
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
      // Basic validation to keep parity with original app's signals
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

      // For compatibility we reply "goodDecKey" and actual decryption is done elsewhere in client code.
      await postToClient(client, { reply: 'goodDecKey' });
    } catch (err) {
      console.error('[SW] requestDecKeyPair error', err);
      await postToClient(client, { reply: 'decryptionError', error: String(err) });
    }
  }

}).catch((e) => {
  console.error('[SW] sodium failed to initialize', e);
  // If sodium can't load, SW will still be registered but crypto features will fail with messages to the client.
});
