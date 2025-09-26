// Background script for NC Court Training Extension V1.5

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'openTab') {
        // Open a new tab with the specified URL
        chrome.tabs.create({ url: request.url, active: false });
        sendResponse({ status: 'success' });
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