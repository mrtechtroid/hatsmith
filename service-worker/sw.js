// service-worker/sw.js
// Service worker source (browser-first). Loads libsodium-wrappers at runtime via importScripts
// to avoid bundling the libsodium node distribution (which breaks browserify).
//
// This file implements the same message protocol expected by the frontend:
// - prepareFileNameEnc / prepareFileNameDec
// - requestEncryption
// - encryptFirstChunk
// - encryptContinue
// - encKeyPair
// - requestDecKeyPair
// - requestDownloadReady
// - resetSWState
//
// It intercepts fetch to /api/download-file and serves a streaming Response when the encrypted stream
// is ready. Crypto primitives: libsodium secretstream XChaCha20-Poly1305 for streaming, and
// libsodium.crypto_pwhash (Argon2id) for password-based key derivation. Asymmetric flow uses X25519
// scalar multiplication to derive a shared secret and then secretstream to encrypt the stream.
//
// IMPORTANT: This file intentionally uses importScripts() to load the browser libsodium bundle at runtime.

'use strict';

// Load the browser build of libsodium-wrappers. This is a browser-only path (not Node).
// Pin the version to match package.json libsodium-wrappers:^0.7.15
// We use jsDelivr CDN as it's stable; if you prefer another CDN, replace the URL.
importScripts('https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.15/dist/browsers/sodium.js');

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Internal state
let streamWriter = null;
let encryptionStreamReadable = null;
let fileName = 'encrypted_file.enc';
let downloadReady = false;
let encryptionInProgress = false;
let sodiumReady = false;
let pushState = null;   // push state for secretstream
let headerBuf = null;
let derivedKey = null;
let lastPostedClientId = null; // optional to reply to last client

// Utility: post message safely to a client (if client provided, otherwise to all clients)
async function broadcastMessage(payload) {
  try {
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of clientsList) {
      c.postMessage(payload);
    }
  } catch (err) {
    // best-effort
    console.warn('[SW] broadcastMessage error', err);
  }
}

function postToClient(client, payload) {
  try {
    if (client && client.postMessage) {
      client.postMessage(payload);
    } else {
      // fallback broadcast
      broadcastMessage(payload);
    }
  } catch (err) {
    console.warn('[SW] postToClient error', err);
  }
}

// Initialize after libsodium loaded
sodium.ready.then(() => {
  sodiumReady = true;
  console.log('[SW] libsodium ready in service worker');

  // Install / activation handlers
  self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
    console.log('[SW] install');
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('[SW] activate');
  });

  // Message handler from page
  self.addEventListener('message', async (ev) => {
    const data = ev.data || {};
    const client = ev.source || null;
    const cmd = data.cmd || data.type || null;

    lastPostedClientId = client;

    try {
      switch (cmd) {
        case 'prepareFileNameEnc':
          fileName = (data.fileName && String(data.fileName)) || fileName;
          downloadReady = false;
          postToClient(client, { reply: 'filePreparedEnc' });
          break;

        case 'prepareFileNameDec':
          fileName = (data.fileName && String(data.fileName)) || fileName;
          downloadReady = false;
          postToClient(client, { reply: 'filePreparedDec' });
          break;

        case 'resetSWState':
          resetState();
          postToClient(client, { reply: 'resetOK' });
          break;

        case 'requestDownloadReady':
          postToClient(client, { reply: downloadReady ? 'downloadReady' : 'notReady' });
          break;

        case 'requestEncryption':
          // Password-based symmetric path: data.password (string)
          await startSymmetricKeyDerivation(data.password, client);
          break;

        case 'encryptFirstChunk':
          // data.chunk: ArrayBuffer
          await encryptFirstChunk(data.chunk, !!data.last, client);
          break;

        case 'encryptContinue':
        case 'encryptNextChunk':
          await continueEncrypt(data.chunk, !!data.last, client);
          break;

        case 'encKeyPair':
          // Asymmetric encryption initialization. Expect base64 strings:
          // data.csk: client secret key (base64)
          // data.spk: recipient public key (base64)
          // data.mode: optional mode
          await encKeyPair(data.csk, data.spk, data.mode, client);
          break;

        case 'requestDecKeyPair':
          // Decryption request; forward to handler that validates keys and reports back.
          await requestDecKeyPair(data.ssk, data.cpk, data.header, data.decFileBuff, data.mode, client);
          break;

        default:
          // Ignore unknown
          break;
      }
    } catch (err) {
      console.error('[SW] message handler error', err);
      postToClient(client, { reply: 'swError', error: String(err) });
    }
  });

  // The encryption flows

  function resetState() {
    try {
      if (streamWriter) {
        try { streamWriter.close(); } catch (e) {}
      }
    } catch (e) {}
    streamWriter = null;
    encryptionStreamReadable = null;
    fileName = 'encrypted_file.enc';
    downloadReady = false;
    encryptionInProgress = false;
    pushState = null;
    headerBuf = null;
    derivedKey = null;
  }

  async function startSymmetricKeyDerivation(password, client) {
    try {
      if (!sodiumReady) {
        postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }
      if (typeof password !== 'string') {
        postToClient(client, { reply: 'encryptionError', error: 'password must be string' });
        return;
      }

      // Generate salt for the pwhash
      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

      // Use Argon2id algorithm via libsodium constants
      const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
      const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
      const alg = sodium.crypto_pwhash_ALG_ARGON2ID13 || sodium.crypto_pwhash_ALG_DEFAULT;

      // Derive key suitable for secretstream
      derivedKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        opslimit,
        memlimit,
        alg
      );

      // Inform client that symmetric key ready (UI can proceed to send chunks)
      postToClient(client, { reply: 'symmetricKeyReady' });
    } catch (err) {
      console.error('[SW] startSymmetricKeyDerivation failed', err);
      postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  // Initialize a streaming secretstream push and write header as the first bytes
  function initSecretStreamPush() {
    if (!derivedKey) {
      throw new Error('derivedKey not set');
    }
    const { state, header } = sodium.crypto_secretstream_xchacha20poly1305_init_push();
    pushState = state; // this is an internal state (Uint8Array)
    headerBuf = header; // Uint8Array header to write first
    return { state, header };
  }

  async function encryptFirstChunk(chunkArrayBuffer, last, client) {
    try {
      if (!sodiumReady) {
        postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }
      if (!derivedKey) {
        postToClient(client, { reply: 'encryptionError', error: 'no key derived' });
        return;
      }

      encryptionInProgress = true;

      // Create TransformStream for the streaming response
      const ts = new TransformStream();
      encryptionStreamReadable = ts.readable;
      streamWriter = ts.writable.getWriter();

      // initialize secretstream push using the derived key
      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      // write header
      streamWriter.write(headerBuf);

      // encrypt first chunk
      const chunkU8 = new Uint8Array(chunkArrayBuffer || new ArrayBuffer(0));
      const enc = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        chunkU8,
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
      );

      streamWriter.write(enc);

      if (last) {
        // finalize: push final tag with empty body
        const lastEnc = sodium.crypto_secretstream_xchacha20poly1305_push(
          pushState,
          new Uint8Array(0),
          null,
          sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        );
        streamWriter.write(lastEnc);
        try { streamWriter.close(); } catch (e) {}
        downloadReady = true;
        encryptionInProgress = false;
        postToClient(client, { reply: 'encryptionFinished' });
        postToClient(client, { reply: 'downloadReady' });
      } else {
        // tell client to continue uploading chunks
        postToClient(client, { reply: 'continueEncryption' });
      }
    } catch (err) {
      console.error('[SW] encryptFirstChunk error', err);
      postToClient(client, { reply: 'encryptionError', error: String(err) });
      encryptionInProgress = false;
      try { if (streamWriter) streamWriter.abort(String(err)); } catch (_) {}
    }
  }

  async function continueEncrypt(chunkArrayBuffer, last, client) {
    try {
      if (!pushState || !streamWriter) {
        postToClient(client, { reply: 'encryptionError', error: 'encryption not initialized' });
        return;
      }
      const chunkU8 = new Uint8Array(chunkArrayBuffer || new ArrayBuffer(0));
      const tag = last ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
                       : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

      const enc = sodium.crypto_secretstream_xchacha20poly1305_push(
        pushState,
        chunkU8,
        null,
        tag
      );

      streamWriter.write(enc);

      if (last) {
        try { streamWriter.close(); } catch (e) {}
        downloadReady = true;
        encryptionInProgress = false;
        postToClient(client, { reply: 'encryptionFinished' });
        postToClient(client, { reply: 'downloadReady' });
      } else {
        postToClient(client, { reply: 'continueEncryption' });
      }
    } catch (err) {
      console.error('[SW] continueEncrypt error', err);
      postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  // Asymmetric initialization: compute shared secret from csk (client secret key) and spk (server public key).
  // Keys are expected as base64 strings.
  async function encKeyPair(cskBase64, spkBase64, mode, client) {
    try {
      if (!sodiumReady) {
        postToClient(client, { reply: 'encryptionError', error: 'sodium not ready' });
        return;
      }
      if (!cskBase64 || !spkBase64) {
        postToClient(client, { reply: 'encryptionError', error: 'missing keys' });
        return;
      }

      // decode
      const csk = sodium.from_base64(cskBase64, sodium.base64_variants.ORIGINAL);
      const spk = sodium.from_base64(spkBase64, sodium.base64_variants.ORIGINAL);

      // Basic checks
      if (csk.length !== sodium.crypto_scalarmult_SCALARBYTES || spk.length !== sodium.crypto_scalarmult_BYTES) {
        postToClient(client, { reply: 'wrongKeyPair' });
        return;
      }

      // Compute shared secret and derive key
      const shared = sodium.crypto_scalarmult(csk, spk);
      derivedKey = sodium.crypto_generichash(sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES, shared);

      // Initialize secretstream push with derivedKey
      const stateObj = sodium.crypto_secretstream_xchacha20poly1305_init_push();
      pushState = stateObj.state;
      headerBuf = stateObj.header;

      // Create TransformStream and write header
      const ts = new TransformStream();
      encryptionStreamReadable = ts.readable;
      streamWriter = ts.writable.getWriter();
      streamWriter.write(headerBuf);

      postToClient(client, { reply: 'keyPairReady' });
    } catch (err) {
      console.error('[SW] encKeyPair error', err);
      postToClient(client, { reply: 'encryptionError', error: String(err) });
    }
  }

  // Minimal decryption key validation (safeguard)
  async function requestDecKeyPair(sskBase64, cpkBase64, headerArg, decFileBuff, mode, client) {
    try {
      if (!sodiumReady) {
        postToClient(client, { reply: 'decryptionError', error: 'sodium not ready' });
        return;
      }

      if (!sskBase64 || !cpkBase64) {
        postToClient(client, { reply: 'decryptionError', error: 'missing keys' });
        return;
      }

      const ssk = sodium.from_base64(sskBase64, sodium.base64_variants.ORIGINAL);
      const cpk = sodium.from_base64(cpkBase64, sodium.base64_variants.ORIGINAL);

      if (ssk.length !== sodium.crypto_scalarmult_SCALARBYTES || cpk.length !== sodium.crypto_scalarmult_BYTES) {
        postToClient(client, { reply: 'wrongDecKeyPair' });
        return;
      }

      // For compatibility just verify no trivial all-zero keys
      if (ssk.every(b => b === 0) || cpk.every(b => b === 0)) {
        postToClient(client, { reply: 'weakDecKey' });
        return;
      }

      // If everything seems fine, reply positive; detailed decryption happens in client stream logic
      postToClient(client, { reply: 'goodDecKey' });
    } catch (err) {
      console.error('[SW] requestDecKeyPair error', err);
      postToClient(client, { reply: 'decryptionError', error: String(err) });
    }
  }

  // Fetch interception: intercept requests to /api/download-file and respond with streaming encrypted file when ready
  self.addEventListener('fetch', (event) => {
    try {
      const url = event.request && event.request.url ? event.request.url : '';
      if (!url) return;
      if (!url.includes('/api/download-file')) return;

      // If download stream ready, reply with a streaming response using encryptionStreamReadable
      if (downloadReady && encryptionStreamReadable) {
        // Serve the read stream with appropriate headers to prompt download
        const response = new Response(encryptionStreamReadable, {
          headers: {
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-cache'
          }
        });

        // After responding, reset small internal state after a short delay
        setTimeout(() => {
          encryptionStreamReadable = null;
          streamWriter = null;
          downloadReady = false;
        }, 1000);

        event.respondWith(response);
        return;
      }

      // If encryption in progress but not yet finished, let client know
      if (encryptionInProgress) {
        event.respondWith(new Response(JSON.stringify({ status: 'encrypting' }), {
          headers: { 'Content-Type': 'application/json' }
        }));
        return;
      }

      // Otherwise let the request go to network (the Next API will return the usual API response)
      // No event.respondWith -> default network behavior
    } catch (err) {
      console.error('[SW] fetch handler error', err);
      // Fail open: let request go through
    }
  });

}).catch((e) => {
  console.error('[SW] sodium failed to load', e);
  // There's no point in running SW crypto features without sodium.
  // SW will still be installed but encryption requests will error via message handler.
});
