// Background script for NC Court Training Extension V1.5

import { withLastError } from './lib/guards.js';

// Safe tab open
async function safeOpenTab(createProps) {
  // Promisify tabs.create (MV3 supports promise form in most channels; fallback if not)
  const p = new Promise((resolve, reject) => {
    try {
      chrome.tabs.create(createProps, (tab) => {
        const err = chrome.runtime.lastError;
        if (err) reject(err); else resolve(tab);
      });
    } catch (e) { reject(e); }
  });
  const res = await withLastError(p);
  if (!res.ok) console.warn('[Investors][Evictions] tabs.create failed:', res.error);
  return res;
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'openTab') {
        // Open a new tab with the specified URL - using safe wrapper
        safeOpenTab({ url: request.url, active: false }).then(res => {
            sendResponse({ status: res.ok ? 'success' : 'failed', error: res.error });
        });
        return true; // Keep channel open for async response
    }
    return true;
});

// === [INVESTORS guard] prevent duplicate listener registration ===
(() => {
  const G = globalThis;
  G.__INV_LISTENERS__ = G.__INV_LISTENERS__ || {};

  // Example: protect onMessage registration
  if (!G.__INV_LISTENERS__.onMessage) {
    const safeHandler = (msg, sender, sendResponse) => {
      try {
        // NOOP wrapper — keep your existing onMessage logic above.
        // If you don't have one yet, you can move it here later.
        // Always guard async sendResponse usage:
        const done = (payload) => {
          try { sendResponse(payload); } catch (e) { /* ignore */ }
        };
        // If no logic here, just ignore:
        done({ ok: true, echo: !!msg });
      } catch (e) {
        try { sendResponse({ ok: false, error: e?.message || String(e) }); } catch {}
      }
      // Return true only if you will respond asynchronously.
      return false;
    };

    // Only add if there are no listeners or we want to ensure our handler is present exactly once
    if (!chrome.runtime.onMessage.hasListeners?.()) {
      chrome.runtime.onMessage.addListener(safeHandler);
    }
    G.__INV_LISTENERS__.onMessage = true;
    console.log("[Investors] background onMessage listener set");
  }
})();