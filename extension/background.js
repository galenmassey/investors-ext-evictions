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