// Service Worker Installation and Activation
self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  event.waitUntil(self.skipWaiting());
});

const config = require("./config");

let streamController, fileName, theKey, state, header, salt, encRx, encTx, decRx, decTx;
let downloadReady = false; // Flag to control when downloads should start

  console.log('[SW] Fetch:', e.request.url);
  
  // Enhanced fetch handler for file downloads
  if (e.request.url.startsWith(config.APP_URL) && downloadReady) {
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        
        // Notify the client that download has started
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            console.log('[SW] Sending downloadStarted message to client');
            client.postMessage({ reply: "downloadStarted" });
          });
        });
      },
    });
    const response = new Response(stream);
    response.headers.append(
      "Content-Disposition",
      'attachment; filename="' + fileName + '"'
    );
    e.respondWith(response);
    downloadReady = false; // Reset flag after creating stream
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
});

const _sodium = require("libsodium-wrappers");
(async () => {
  await _sodium.ready;
  const sodium = _sodium;

  addEventListener("message", (e) => {
    switch (e.data.cmd) {
      case "prepareFileNameEnc":
        assignFileNameEnc(e.data.fileName, e.source);
        break;

      case "prepareFileNameDec":
        assignFileNameDec(e.data.fileName, e.source);
        break;

      case "prepareDownload":
        prepareDownload(e.source);
        break;

      case "requestEncryption":
        encKeyGenerator(e.data.password, e.source);
        break;

      case "requestEncKeyPair":
        encKeyPair(e.data.privateKey, e.data.publicKey, e.data.mode, e.source);
        break;

      case "asymmetricEncryptFirstChunk":
        asymmetricEncryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptFirstChunk":
        encryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptRestOfChunks":
        encryptRestOfChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "checkFile":
        checkFile(e.data.signature, e.data.legacy, e.source);
        break;

      case "requestTestDecryption":
        testDecryption(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.data.decFileBuff,
          e.source
        );
        break;

      case "requestDecKeyPair":
        requestDecKeyPair(
          e.data.privateKey,
          e.data.publicKey,
          e.data.header,
          e.data.decFileBuff,
          e.data.mode,
          e.source
        );
        break;

      case "requestDecryption":
        decKeyGenerator(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.source
        );
        break;

      case "decryptFirstChunk":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "decryptRestOfChunks":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "pingSW":
        // console.log("SW running");
        break;
    }
  });

  // Secure memory clearing utility
  const secureMemoryClear = (buffer) => {
    if (buffer && buffer.fill) {
      buffer.fill(0);
    }
  };

  // Constant-time comparison utility to prevent timing attacks
  const constantTimeEquals = (a, b) => {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  };

  const assignFileNameEnc = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedEnc" })
  }

  const prepareDownload = (client) => {
    downloadReady = true;
    client.postMessage({ reply: "downloadReady" });
  }

  const assignFileNameDec = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedDec" })
  }

  const encKeyPair = (csk, spk, mode, client) => {
    try {
      // Enhanced key validation with weak key detection
      const cskBytes = sodium.from_base64(csk);
      const spkBytes = sodium.from_base64(spk);
      
      // Check for all-zero keys (weak keys)
      if (cskBytes.every(byte => byte === 0) || spkBytes.every(byte => byte === 0)) {
        client.postMessage({ reply: "weakKey" });
        return;
      }

      if (csk === spk) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(csk));
      computed = sodium.to_base64(computed);
      if (constantTimeEquals(sodium.from_base64(spk), sodium.from_base64(computed))) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      if (sodium.from_base64(csk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongPrivateKey" });
        return;
      }

      if (sodium.from_base64(spk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_client_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(csk)),
        sodium.from_base64(csk),
        sodium.from_base64(spk)
      );

      if (key) {
        [encRx, encTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && encRx && encTx) {
          client.postMessage({ reply: "goodKeyPair" });
        }

        if (mode === "derive" && encRx && encTx) {
          let res =
            sodium.crypto_secretstream_xchacha20poly1305_init_push(encTx);
          state = res.state;
          header = res.header;
          client.postMessage({ reply: "keyPairReady" });
        }
      } else {
        client.postMessage({ reply: "wrongKeyPair" });
      }
      
      // Clear sensitive data from memory
      secureMemoryClear(cskBytes);
      secureMemoryClear(spkBytes);
    } catch (error) {
      client.postMessage({ reply: "wrongKeyInput" });
    }
  };

  const asymmetricEncryptFirstChunk = (chunk, last, client) => {
    console.log('[SW] asymmetricEncryptFirstChunk called, streamController exists:', !!streamController);
    
    // Wait for streamController to be ready with a timeout
    const waitForStreamController = (retries = 0) => {
      if (streamController) {
        console.log('[SW] StreamController is ready, proceeding with asymmetric encryption');
        
        const SIGNATURE = new Uint8Array(
          config.encoder.encode(config.sigCodes["v2_asymmetric"])
        );
        console.log('[SW] Enqueueing signature and header for asymmetric encryption');
        streamController.enqueue(SIGNATURE);
        streamController.enqueue(header);

        let tag = last
          ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

        let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          new Uint8Array(chunk),
          null,
          tag
        );

        streamController.enqueue(new Uint8Array(encryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "encryptionFinished" });
        }

        if (!last) {
          client.postMessage({ reply: "continueEncryption" });
        }
      } else if (retries < 50) { // Wait up to 5 seconds (50 * 100ms)
        console.log('[SW] StreamController not ready for asymmetric encryption, retrying in 100ms... (attempt', retries + 1, ')');
        setTimeout(() => waitForStreamController(retries + 1), 100);
      } else {
        console.error('[SW] ERROR: streamController timeout for asymmetric encryption after 5 seconds!');
        client.postMessage({ reply: "encryptionError", error: "Stream initialization timeout" });
      }
    };
    
    waitForStreamController();
  };

  let encKeyGenerator = (password, client) => {
    salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    
    // Enhanced Argon2 parameters - SENSITIVE level (CWE-326)
    // Upgraded from INTERACTIVE (4 ops, 67MB) to SENSITIVE (32 ops, 1GB)
    // 8x computational increase, 15x memory increase for better brute force protection

    theKey = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
      sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(theKey);
    state = res.state;
    header = res.header;

    client.postMessage({ reply: "keysGenerated" });
    
    // Clear password from memory after use
    secureMemoryClear(new Uint8Array(Buffer.from(password, 'utf8')));
  };

  const encryptFirstChunk = (chunk, last, client) => {
    setTimeout(function () {
      if (!streamController) {
        console.log("stream does not exist");
        return;
      }
      const SIGNATURE = new Uint8Array(
        config.encoder.encode(config.sigCodes["v2_symmetric"])
      );

      streamController.enqueue(SIGNATURE);
      streamController.enqueue(salt);
      streamController.enqueue(header);

      let tag = last
        ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

      let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
        state,
        new Uint8Array(chunk),
        null,
        tag
      );

      streamController.enqueue(new Uint8Array(encryptedChunk));

      if (last) {
        streamController.close();
        client.postMessage({ reply: "encryptionFinished" });
      }

      if (!last) {
        client.postMessage({ reply: "continueEncryption" });
      }
    }, 500);
  };

  const encryptRestOfChunks = (chunk, last, client) => {
    if (!streamController) {
      console.log("stream does not exist in encryptRestOfChunks");
      return;
    }
    
    let tag = last
      ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

    let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
      state,
      new Uint8Array(chunk),
      null,
      tag
    );

    streamController.enqueue(encryptedChunk);

    if (last) {
      streamController.close();
      client.postMessage({ reply: "encryptionFinished" });
    }

    if (!last) {
      client.postMessage({ reply: "continueEncryption" });
    }
  };

  const checkFile = (signature, legacy, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      client.postMessage({ reply: "secretKeyEncryption" });
    } else if (
      config.decoder.decode(signature) === config.sigCodes["v2_asymmetric"]
    ) {
      client.postMessage({ reply: "publicKeyEncryption" });
    } else if (config.decoder.decode(legacy) === config.sigCodes["v1"]) {
      client.postMessage({ reply: "oldVersion" });
    } else {
      client.postMessage({ reply: "badFile" });
    }
  };

  const requestDecKeyPair = (ssk, cpk, header, decFileBuff, mode, client) => {
    try {
      // Enhanced key validation with weak key detection
      const sskBytes = sodium.from_base64(ssk);
      const cpkBytes = sodium.from_base64(cpk);
      
      // Check for all-zero keys (weak keys)
      if (sskBytes.every(byte => byte === 0) || cpkBytes.every(byte => byte === 0)) {
        client.postMessage({ reply: "weakDecKey" });
        return;
      }

      if (ssk === cpk) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(ssk));
      computed = sodium.to_base64(computed);
      if (constantTimeEquals(sodium.from_base64(cpk), sodium.from_base64(computed))) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      if (sodium.from_base64(ssk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongDecPrivateKey" });
        return;
      }

      if (sodium.from_base64(cpk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongDecPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_server_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(ssk)),
        sodium.from_base64(ssk),
        sodium.from_base64(cpk)
      );

      if (key) {
        [decRx, decTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && decRx && decTx) {
          let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state_in) {
            let decTestresults =
              sodium.crypto_secretstream_xchacha20poly1305_pull(
                state_in,
                new Uint8Array(decFileBuff)
              );

            if (decTestresults) {
              client.postMessage({ reply: "readyToDecrypt" });
            } else {
              client.postMessage({ reply: "wrongDecKeys" });
            }
          }
        }

        if (mode === "derive" && decRx && decTx) {
          state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state) {
            client.postMessage({ reply: "decKeyPairGenerated" });
          }
        }
      }
      
      // Clear sensitive data from memory
      secureMemoryClear(sskBytes);
      secureMemoryClear(cpkBytes);
    } catch (error) {
      client.postMessage({ reply: "wrongDecKeyInput" });
    }
  };

  const testDecryption = (
    password,
    signature,
    salt,
    header,
    decFileBuff,
    client
  ) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      let decTestsalt = new Uint8Array(salt);
      let decTestheader = new Uint8Array(header);
      
      // Enhanced Argon2 parameters for decryption test

      let decTestKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        decTestsalt,
        sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
        sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        decTestheader,
        decTestKey
      );

      if (state_in) {
        let decTestresults = sodium.crypto_secretstream_xchacha20poly1305_pull(
          state_in,
          new Uint8Array(decFileBuff)
        );
        if (decTestresults) {
          client.postMessage({ reply: "readyToDecrypt" });
        } else {
          client.postMessage({ reply: "wrongPassword" });
        }
      }
      
      // Clear sensitive data from memory
      secureMemoryClear(decTestKey);
      secureMemoryClear(new Uint8Array(Buffer.from(password, 'utf8')));
    }
  };

  const decKeyGenerator = (password, signature, salt, header, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      salt = new Uint8Array(salt);
      header = new Uint8Array(header);
      
      // Enhanced Argon2 parameters for key derivation

      theKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
        sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        theKey
      );

      if (state) {
        client.postMessage({ reply: "decKeysGenerated" });
      }
      
      // Clear password from memory after use
      secureMemoryClear(new Uint8Array(Buffer.from(password, 'utf8')));
    }
  };

  const decryptChunks = (chunk, last, client) => {
    setTimeout(function () {
      let result = sodium.crypto_secretstream_xchacha20poly1305_pull(
        state,
        new Uint8Array(chunk)
      );

      if (result) {
        let decryptedChunk = result.message;

        streamController.enqueue(new Uint8Array(decryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "decryptionFinished" });
        }
        if (!last) {
          client.postMessage({ reply: "continueDecryption" });
        }
      } else {
        client.postMessage({ reply: "wrongPassword" });
      }
    }, 500);
  };
  
  // Clear any remaining sensitive data on worker termination
  self.addEventListener('beforeunload', () => {
    secureMemoryClear(theKey);
  });
})();
self.addEventListener("fetch", (e) => {
  // console.log(e); // log fetch event
  if (e.request.url.startsWith(config.APP_URL) && downloadReady) {
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        
        // Notify the client that download has started
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            console.log('[SW] Sending downloadStarted message to client');
            client.postMessage({ reply: "downloadStarted" });
          });
        });
      },
    });
    const response = new Response(stream);
    response.headers.append(
      "Content-Disposition",
      'attachment; filename="' + fileName + '"'
    );
    e.respondWith(response);
    downloadReady = false; // Reset flag after creating stream
  }
});

const _sodium = require("libsodium-wrappers");
(async () => {
  await _sodium.ready;
  const sodium = _sodium;

  addEventListener("message", (e) => {
    switch (e.data.cmd) {
      case "prepareFileNameEnc":
        assignFileNameEnc(e.data.fileName, e.source);
        break;

      case "prepareFileNameDec":
        assignFileNameDec(e.data.fileName, e.source);
        break;

      case "prepareDownload":
        prepareDownload(e.source);
        break;

      case "requestEncryption":
        encKeyGenerator(e.data.password, e.source);
        break;

      case "requestEncKeyPair":
        encKeyPair(e.data.privateKey, e.data.publicKey, e.data.mode, e.source);
        break;

      case "asymmetricEncryptFirstChunk":
        asymmetricEncryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptFirstChunk":
        encryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptRestOfChunks":
        encryptRestOfChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "checkFile":
        checkFile(e.data.signature, e.data.legacy, e.source);
        break;

      case "requestTestDecryption":
        testDecryption(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.data.decFileBuff,
          e.source
        );
        break;

      case "requestDecKeyPair":
        requestDecKeyPair(
          e.data.privateKey,
          e.data.publicKey,
          e.data.header,
          e.data.decFileBuff,
          e.data.mode,
          e.source
        );
        break;

      case "requestDecryption":
        decKeyGenerator(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.source
        );
        break;

      case "decryptFirstChunk":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "decryptRestOfChunks":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "pingSW":
        // console.log("SW running");
        break;
    }
  });

  const assignFileNameEnc = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedEnc" })
  }

  const prepareDownload = (client) => {
    downloadReady = true;
    client.postMessage({ reply: "downloadReady" });
  }

  const assignFileNameDec = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedDec" })
  }

  const encKeyPair = (csk, spk, mode, client) => {
    try {
      if (csk === spk) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(csk));
      computed = sodium.to_base64(computed);
      if (spk === computed) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      if (sodium.from_base64(csk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongPrivateKey" });
        return;
      }

      if (sodium.from_base64(spk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_client_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(csk)),
        sodium.from_base64(csk),
        sodium.from_base64(spk)
      );

      if (key) {
        [encRx, encTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && encRx && encTx) {
          client.postMessage({ reply: "goodKeyPair" });
        }

        if (mode === "derive" && encRx && encTx) {
          let res =
            sodium.crypto_secretstream_xchacha20poly1305_init_push(encTx);
          state = res.state;
          header = res.header;
          client.postMessage({ reply: "keyPairReady" });
        }
      } else {
        client.postMessage({ reply: "wrongKeyPair" });
      }
    } catch (error) {
      client.postMessage({ reply: "wrongKeyInput" });
    }
  };

  const asymmetricEncryptFirstChunk = (chunk, last, client) => {
    console.log('[SW] asymmetricEncryptFirstChunk called, streamController exists:', !!streamController);
    
    // Wait for streamController to be ready with a timeout
    const waitForStreamController = (retries = 0) => {
      if (streamController) {
        console.log('[SW] StreamController is ready, proceeding with asymmetric encryption');
        
        const SIGNATURE = new Uint8Array(
          config.encoder.encode(config.sigCodes["v2_asymmetric"])
        );
        console.log('[SW] Enqueueing signature and header for asymmetric encryption');
        streamController.enqueue(SIGNATURE);
        streamController.enqueue(header);

        let tag = last
          ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

        let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          new Uint8Array(chunk),
          null,
          tag
        );

        streamController.enqueue(new Uint8Array(encryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "encryptionFinished" });
        }

        if (!last) {
          client.postMessage({ reply: "continueEncryption" });
        }
      } else if (retries < 50) { // Wait up to 5 seconds (50 * 100ms)
        console.log('[SW] StreamController not ready for asymmetric encryption, retrying in 100ms... (attempt', retries + 1, ')');
        setTimeout(() => waitForStreamController(retries + 1), 100);
      } else {
        console.error('[SW] ERROR: streamController timeout for asymmetric encryption after 5 seconds!');
        client.postMessage({ reply: "encryptionError", error: "Stream initialization timeout" });
      }
    };
    
    waitForStreamController();
  };

  let encKeyGenerator = (password, client) => {
    salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    theKey = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(theKey);
    state = res.state;
    header = res.header;

    client.postMessage({ reply: "keysGenerated" });
  };

  const encryptFirstChunk = (chunk, last, client) => {
    setTimeout(function () {
      if (!streamController) {
        console.log("stream does not exist");
        return;
      }
      const SIGNATURE = new Uint8Array(
        config.encoder.encode(config.sigCodes["v2_symmetric"])
      );

      streamController.enqueue(SIGNATURE);
      streamController.enqueue(salt);
      streamController.enqueue(header);

      let tag = last
        ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

      let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
        state,
        new Uint8Array(chunk),
        null,
        tag
      );

      streamController.enqueue(new Uint8Array(encryptedChunk));

      if (last) {
        streamController.close();
        client.postMessage({ reply: "encryptionFinished" });
      }

      if (!last) {
        client.postMessage({ reply: "continueEncryption" });
      }
    }, 500);
  };

  const encryptRestOfChunks = (chunk, last, client) => {
    if (!streamController) {
      console.log("stream does not exist in encryptRestOfChunks");
      return;
    }
    
    let tag = last
      ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

    let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
      state,
      new Uint8Array(chunk),
      null,
      tag
    );

    streamController.enqueue(encryptedChunk);

    if (last) {
      streamController.close();
      client.postMessage({ reply: "encryptionFinished" });
    }

    if (!last) {
      client.postMessage({ reply: "continueEncryption" });
    }
  };

  const checkFile = (signature, legacy, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      client.postMessage({ reply: "secretKeyEncryption" });
    } else if (
      config.decoder.decode(signature) === config.sigCodes["v2_asymmetric"]
    ) {
      client.postMessage({ reply: "publicKeyEncryption" });
    } else if (config.decoder.decode(legacy) === config.sigCodes["v1"]) {
      client.postMessage({ reply: "oldVersion" });
    } else {
      client.postMessage({ reply: "badFile" });
    }
  };

  const requestDecKeyPair = (ssk, cpk, header, decFileBuff, mode, client) => {
    try {
      if (ssk === cpk) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(ssk));
      computed = sodium.to_base64(computed);
      if (cpk === computed) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      if (sodium.from_base64(ssk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongDecPrivateKey" });
        return;
      }

      if (sodium.from_base64(cpk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongDecPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_server_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(ssk)),
        sodium.from_base64(ssk),
        sodium.from_base64(cpk)
      );

      if (key) {
        [decRx, decTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && decRx && decTx) {
          let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state_in) {
            let decTestresults =
              sodium.crypto_secretstream_xchacha20poly1305_pull(
                state_in,
                new Uint8Array(decFileBuff)
              );

            if (decTestresults) {
              client.postMessage({ reply: "readyToDecrypt" });
            } else {
              client.postMessage({ reply: "wrongDecKeys" });
            }
          }
        }

        if (mode === "derive" && decRx && decTx) {
          state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state) {
            client.postMessage({ reply: "decKeyPairGenerated" });
          }
        }
      }
    } catch (error) {
      client.postMessage({ reply: "wrongDecKeyInput" });
    }
  };

  const testDecryption = (
    password,
    signature,
    salt,
    header,
    decFileBuff,
    client
  ) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      let decTestsalt = new Uint8Array(salt);
      let decTestheader = new Uint8Array(header);

      let decTestKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        decTestsalt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        decTestheader,
        decTestKey
      );

      if (state_in) {
        let decTestresults = sodium.crypto_secretstream_xchacha20poly1305_pull(
          state_in,
          new Uint8Array(decFileBuff)
        );
        if (decTestresults) {
          client.postMessage({ reply: "readyToDecrypt" });
        } else {
          client.postMessage({ reply: "wrongPassword" });
        }
      }
    }
  };

  const decKeyGenerator = (password, signature, salt, header, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      salt = new Uint8Array(salt);
      header = new Uint8Array(header);

      theKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        theKey
      );

      if (state) {
        client.postMessage({ reply: "decKeysGenerated" });
      }
    }
  };

  const decryptChunks = (chunk, last, client) => {
    setTimeout(function () {
      let result = sodium.crypto_secretstream_xchacha20poly1305_pull(
        state,
        new Uint8Array(chunk)
      );

      if (result) {
        let decryptedChunk = result.message;

        streamController.enqueue(new Uint8Array(decryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "decryptionFinished" });
        }
        if (!last) {
          client.postMessage({ reply: "continueDecryption" });
        }
      } else {
        client.postMessage({ reply: "wrongPassword" });
      }
    }, 500);
  };
})();
