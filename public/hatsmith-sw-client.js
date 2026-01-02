// public/hatsmith-sw-client.js
// Registers the service worker and adds a delegated click listener that triggers the download
// flow when the user clicks a button labeled "ENCRYPT FILE" (case-insensitive).
// This file intentionally does not rely on any app runtime internals — it uses DOM events only,
// so you can drop it into public/ and include it once in the app (see pages/_document.js below).

(function () {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) {
    console.warn('[Hatsmith SW Client] Service workers not supported by this browser.');
    return;
  }

  // Service worker script path (bundled to public/service-worker.js by browserify)
  const SW_SCRIPT = '/service-worker.js';
  const DOWNLOAD_URL = '/api/download-file';

  async function registerServiceWorker() {
    try {
      const reg = await navigator.serviceWorker.register(SW_SCRIPT, { scope: '/' });
      // Wait for the service worker to be ready (controlled).
      await navigator.serviceWorker.ready;
      console.log('[Hatsmith SW Client] Service worker registered and ready:', reg);
      return reg;
    } catch (err) {
      console.error('[Hatsmith SW Client] SW registration failed:', err);
      return null;
    }
  }

  // Post a best-effort message to the active service worker (if present).
  function postMessageToSW(message) {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
        return true;
      }
      // If no controller (first load), post to the active registration if available
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.active) {
          try { reg.active.postMessage(message); } catch (e) {}
        }
      }).catch(() => {});
      return false;
    } catch (e) {
      return false;
    }
  }

  // Create and click an anchor to initiate a navigation-style GET to the DOWNLOAD_URL.
  // This allows Service Worker to intercept the request and serve a streaming Response
  // with Content-Disposition: attachment, which triggers native browser download UI.
  function startDownloadNavigation() {
    try {
      const a = document.createElement('a');
      a.href = DOWNLOAD_URL;
      // Leave off 'download' attribute: the server/swc-set Content-Disposition should determine filename.
      // But adding download can be used as a fallback:
      // a.setAttribute('download', '');
      a.style.display = 'none';
      document.body.appendChild(a);
      // Chrome may require the element to be in the document to actually navigate/download.
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (e) {}
      }, 1500);
    } catch (err) {
      console.error('[Hatsmith SW Client] startDownloadNavigation failed:', err);
    }
  }

  // Detect clicks on an "ENCRYPT FILE" button or element with that text.
  // This is delegated so it works even if the button is rendered later.
  function installEncryptClickListener() {
    document.addEventListener('click', async function (ev) {
      try {
        // Find the clicked element or its ancestor that likely represents the button
        let target = ev.target;
        // Walk up to some reasonable ancestor depth to find matching text or attributes
        for (let depth = 0; depth < 6 && target; depth++, target = target.parentElement) {
          if (!target) break;

          // Heuristics: exact text matching, or element with data-action, or role=button
          const txt = (target.textContent || '').trim().toUpperCase();

          // If the element explicitly has data-action="encrypt-file" use it
          if (target.getAttribute && target.getAttribute('data-action') === 'encrypt-file') {
            // trigger download flow
            await navigator.serviceWorker.ready; // ensure SW ready
            // best-effort notify SW of upcoming download
            postMessageToSW({ cmd: 'prepareFileNameEnc' });
            startDownloadNavigation();
            return;
          }

          // If role attribute set to button and contains the token "ENCRYPT" + "FILE"
          const role = target.getAttribute && target.getAttribute('role');
          if (role === 'button' && txt.includes('ENCRYPT') && txt.includes('FILE')) {
            await navigator.serviceWorker.ready;
            postMessageToSW({ cmd: 'prepareFileNameEnc' });
            startDownloadNavigation();
            return;
          }

          // If the element is a button or input and its text equals "ENCRYPT FILE"
          const tag = (target.tagName || '').toUpperCase();
          if ((tag === 'BUTTON' || (tag === 'INPUT' && (target.type === 'button' || target.type === 'submit')))
              && txt === 'ENCRYPT FILE') {
            await navigator.serviceWorker.ready;
            postMessageToSW({ cmd: 'prepareFileNameEnc' });
            startDownloadNavigation();
            return;
          }

          // If the element contains "ENCRYPT FILE" text anywhere, treat it as the button
          if (txt === 'ENCRYPT FILE' || txt === 'ENCRYPT FILE »' || txt === 'ENCRYPT FILE ›') {
            await navigator.serviceWorker.ready;
            postMessageToSW({ cmd: 'prepareFileNameEnc' });
            startDownloadNavigation();
            return;
          }

          // Also check for a fairly common variant where the button contains "ENCRYPT" only
          if ((txt.includes('ENCRYPT') && txt.includes('FILE')) || txt === 'ENCRYPT') {
            // To avoid false positives, ensure ancestor looks like a button or has data-action
            if (tag === 'BUTTON' || role === 'button' || (target.getAttribute && target.getAttribute('data-action'))) {
              await navigator.serviceWorker.ready;
              postMessageToSW({ cmd: 'prepareFileNameEnc' });
              startDownloadNavigation();
              return;
            }
          }
        }
      } catch (err) {
        // swallow errors — non-critical
        console.warn('[Hatsmith SW Client] click listener error', err);
      }
    }, true /* capture to catch events early */);
  }

  // Bootstrapping
  (async function boot() {
    try {
      const reg = await registerServiceWorker();
      if (!reg) return;
      // If a SW is active, attempt to send a "hello" for logging (non-fatal)
      postMessageToSW({ cmd: 'clientHello' });
      installEncryptClickListener();
      console.log('[Hatsmith SW Client] Initialized (listening for ENCRYPT FILE clicks).');
    } catch (err) {
      console.error('[Hatsmith SW Client] boot error', err);
    }
  })();

})();
