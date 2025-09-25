// Popup script for Investors Evictions Extension V1.5

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update stats from storage
    updateStats();
    
    // Check if we're on a court portal page
    checkActiveStatus();
    
    // Set up button handlers
    setupButtonHandlers();
});

// Update statistics from storage
function updateStats() {
    chrome.storage.local.get(['sessionStats'], function(result) {
        const stats = result.sessionStats || {
            totalCases: 0,
            qualified: 0,
            skipped: 0,
            savedRequests: 0
        };
        
        document.getElementById('sessionCases').textContent = stats.totalCases;
        document.getElementById('qualifiedCount').textContent = stats.qualified;
        document.getElementById('skippedCount').textContent = stats.skipped;
        document.getElementById('savedRequests').textContent = stats.savedRequests;
    });
}

// Check if extension is active on current tab
function checkActiveStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const isCourtPortal = currentTab.url && currentTab.url.includes('portal-nc.tylertech.cloud');
        
        const statusEl = document.getElementById('status');
        if (isCourtPortal) {
            statusEl.className = 'status active';
            statusEl.textContent = '✓ Active on NC Court Portal';
        } else {
            statusEl.className = 'status inactive';
            statusEl.textContent = 'Not on NC Court Portal';
        }
        
        // Enable/disable relevant buttons
        document.getElementById('toggleUI').disabled = !isCourtPortal;
        document.getElementById('exportData').disabled = !isCourtPortal;
    });
}

// Set up button click handlers
function setupButtonHandlers() {
    // Toggle UI button
    document.getElementById('toggleUI').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleUI'}, function(response) {
                if (response && response.status === 'success') {
                    window.close();
                }
            });
        });
    });
    
    // Export data button
    document.getElementById('exportData').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'exportData'}, function(response) {
                if (response && response.status === 'success') {
                    window.close();
                }
            });
        });
    });
    
    // Clear session button
    document.getElementById('clearSession').addEventListener('click', function() {
        if (confirm('Clear all session data? This cannot be undone.')) {
            chrome.storage.local.clear(function() {
                updateStats();
                alert('Session data cleared');
            });
        }
    });
    
    // Settings button
    document.getElementById('openSettings').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
    
    // Documentation button
    document.getElementById('viewDocs').addEventListener('click', function() {
        chrome.tabs.create({
            url: 'https://github.com/galenmassey/investors-ext-evictions'
        });
    });
}

// Listen for updates from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateStats') {
        updateStats();
    }
});