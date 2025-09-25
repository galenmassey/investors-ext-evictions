// Content script for NC Court Portal Training Extension - V1.5 ENHANCED
// Merges V3.1's superior entity detection with V1.5's smart features
console.log('Case Training Page Reader v1.5 ENHANCED - Best of Both Worlds');

// ========== ENTITY DETECTION PATTERNS (FROM V3.1) ==========
const entitySuffixes = [
    'llc', 'l.l.c.', 'l.l.c', 'l.c.', 'lc', 'limited liability company', 'limited liability co.', 'limited company',
    'ltd', 'ltd.', 'l.t.d.', 'ltd co',
    'inc', 'inc.', 'incorporated', 'corp', 'corp.', 'corporation', 'co.', 'company', 'limited',
    'p.a.', 'pa', 'p.c.', 'pc', 'p.l.l.c.', 'pllc', 'chtd', 'chartered', 'prof. co.', 'prof. corp.', 'prof. l.l.c.', 'prof. llc', 's.c.',
    'l.p.', 'lp', 'l.l.p.', 'llp', 'l.l.l.p.', 'lllp', 'p.l.l.p.', 'pllp', 'partners', 'partnership', 'general partnership', 'limited partnership',
    'trust', 'family trust', 'living trust', 'estate trust', 'legacy trust', 'heritage trust', 'revocable trust', 'irrevocable trust',
    'foundation trust', 'asset trust', 'property trust', 'trustee', 'trustor',
    'dba', 'd/b/a', 'd.b.a.', 'series', 'unit'  // V3.1 additions
];

const entityKeywords = [
    'realty', 'real estate', 'properties', 'property management', 'estates', 'estate management', 'land co', 'property co',
    'real estate co', 'realty co', 'development', 'developers', 'holdings', 'investment co', 'property group', 'realty group',
    'real estate group', 'property services', 'realty services', 'property solutions', 'asset management',
    'management', 'mgmt', 'property mgmt', 'asset mgmt', 'portfolio', 'investment management', 'rental management', 'lease management',
    'property managers', 'residential management', 'commercial management',
    'investments', 'investment', 'capital', 'capital partners', 'ventures', 'fund', 'funds', 'equity', 'equity partners',
    'financial', 'holdings co', 'investment partners', 'asset partners', 'real estate investment', 'property investment', 'advisors',
    'foundation', 'charitable foundation', 'foundation inc', 'institute', 'institute inc', 'organization', 'association',
    'society', 'council', 'board', 'commission', 'authority', 'agency', 'center',
    'enterprises', 'enterprise', 'group', 'services', 'solutions', 'systems', 'technologies', 'consulting', 'consultants',
    'associates', 'specialists', 'professionals', 'experts', 'team', 'collective', 'alliance', 'network', 'syndicate', 'consortium',
    'national', 'international', 'global', 'regional', 'metro', 'urban', 'statewide',
    // V3.1 additions from training data
    'apartments', 'apts', 'village', 'crossing', 'creek', 'gardens', 'park apartments', 'place apartments',
    'residences', 'housing', 'owner llc', 'borrower', 'rental', 'leasco',
    'county obo', 'city of', 'county of', 'state of', 'housing authority'
];

// V3.1: Specific business names that look like individuals
const specificBusinessNames = [
    'westgate village', 'innisbrook village', 'legacy crossing', 'forest gardens',
    'brier creek', 'featherstone village', 'meriwether place',
    'aaron\'s', 'aarons', 'farmers home furniture', 'schewels home',
    'time investment', 'lion\'s share', 'century finance', 'first horizon',
    'wells fargo', 'ginkgo', 'axiom', 'bell fund', 'sreit', 'fpii',
    'yamasa', 'bmf v', 'prcp', 'noah llc', 'hughes enterprises'
];

const entityRegexPatterns = [
    /\b(llc|l\.l\.c\.|l\.l\.c|l\.c\.|lc)\b/i,
    /\b(inc|inc\.|incorporated|corp|corp\.|corporation|co\.|company)\b/i,
    /\b(p\.a\.|pa|p\.c\.|pc|p\.l\.l\.c\.|pllc|chtd|chartered)\b/i,
    /\b(l\.p\.|lp|l\.l\.p\.|llp|l\.l\.l\.p\.|lllp|p\.l\.l\.p\.|pllp)\b/i,
    /\b(partners|partnership)\b/i,
    /\b(trust|trustee|trustor)\b/i,
    /\b(ltd|ltd\.|l\.t\.d\.)\b/i,
    /\bdba\b/i, /\bd\/b\/a\b/i,
    /\bagent for owner\b/i,
    /\bc\/o\b/i,
    /series\s+\d+/i,  // V3.1: "Series 1" type entities
    /unit\s+\d+/i     // Numbered units
];

// ========== HELPER FUNCTIONS ==========

// V3.1 Enhanced entity detection
function isEntityName(name) {
    const lowerName = name.toLowerCase().trim();
    
    // Check specific business names first
    for (let businessName of specificBusinessNames) {
        if (lowerName.includes(businessName)) {
            return { isEntity: true, reason: `Known business: ${businessName}` };
        }
    }
    
    // V3.1: Handle DBA patterns
    if (lowerName.includes(' dba ') || lowerName.includes(' d/b/a ')) {
        return { isEntity: true, reason: 'DBA (doing business as) pattern' };
    }
    
    // V3.1: Check for numbered entities
    if (/\b\d{3,}\b/.test(name) && !name.includes('highway') && !name.includes('route')) {
        return { isEntity: true, reason: 'Numbered entity pattern' };
    }
    
    // Check suffixes with improved word boundaries
    for (let suffix of entitySuffixes) {
        const suffixPattern = new RegExp(`\\b${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|,|\\s+dba|\\s+d/b/a)`, 'i');
        if (suffixPattern.test(lowerName)) {
            return { isEntity: true, reason: `Entity suffix detected: ${suffix}` };
        }
    }
    
    // Check keywords
    for (let keyword of entityKeywords) {
        if (lowerName.includes(keyword)) {
            return { isEntity: true, reason: `Entity keyword detected: ${keyword}` };
        }
    }
    
    // Check regex patterns
    for (let pattern of entityRegexPatterns) {
        if (pattern.test(name)) {
            return { isEntity: true, reason: `Entity pattern match` };
        }
    }
    
    // V3.1: Mobile home park special case
    if (lowerName.includes('mobile home park') || lowerName.includes('trailer park')) {
        // Check if it's possessive (individual's) vs business
        if (lowerName.includes("'s") || lowerName.includes("s'")) {
            const beforePossessive = lowerName.split(/['']/)[0].trim();
            if (!isEntityName(beforePossessive).isEntity) {
                return { isEntity: false, reason: '' };  // Individual's mobile home park
            }
        }
        return { isEntity: true, reason: 'Mobile home park business' };
    }
    
    return { isEntity: false, reason: '' };
}

// V1.5 ENHANCED: Better address extraction (Grok's suggestion)
function extractAddressFromParty(partyText) {
    // Improved regex to handle various formats
    const addressRegex = /^(.*?)(?:,\s*(.*))?$/;
    const match = partyText.match(addressRegex);
    
    if (match && match[2]) {
        // Clean up the address part
        return match[2].trim();
    }
    
    // Alternative: Look for patterns like numbers followed by street names
    const streetPattern = /\d+\s+[A-Za-z\s]+(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Ct|Court|Pl|Place|Cir|Circle)/i;
    const streetMatch = partyText.match(streetPattern);
    if (streetMatch) {
        return streetMatch[0];
    }
    
    return '';
}

// V1.5: Check if addresses match (roommate situation)
function areAddressesMatching(address1, address2) {
    if (!address1 || !address2) return false;
    
    // Normalize addresses for comparison
    const normalize = (addr) => {
        return addr.toLowerCase()
            .replace(/[,.\s]+/g, ' ')
            .replace(/\bapt\b/g, 'apartment')
            .replace(/\bste\b/g, 'suite')
            .replace(/\bunit\b/g, 'unit')
            .trim();
    };
    
    const norm1 = normalize(address1);
    const norm2 = normalize(address2);
    
    // Log for debugging (as Grok suggested)
    if (norm1 && norm2 && norm1 !== norm2) {
        console.log('Address comparison:', { addr1: norm1, addr2: norm2, match: false });
    }
    
    return norm1 === norm2 && norm1.length > 10;  // Minimum length to avoid false matches
}

// V3.1: Handle multi-defendant cases
function extractPartiesFromStyle(style) {
    const vsIndex = style.toLowerCase().indexOf(' vs ');
    if (vsIndex === -1) {
        return { plaintiffs: [style], defendants: [] };
    }
    
    const plaintiffPart = style.substring(0, vsIndex).trim();
    const defendantPart = style.substring(vsIndex + 4).trim();
    
    // Split on common separators for multiple parties
    const splitParties = (text) => {
        return text.split(/[,&]|(?:\band\b)/i)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    };
    
    return {
        plaintiffs: splitParties(plaintiffPart),
        defendants: splitParties(defendantPart)
    };
}

// ========== SESSION STATISTICS TRACKING ==========
let sessionStats = {
    totalCases: 0,
    qualified: 0,
    skipped: 0,
    savedRequests: 0
};

function updateSessionStats(cases) {
    sessionStats.totalCases = cases.length;
    sessionStats.qualified = cases.filter(c => c.decision === 'qualified').length;
    sessionStats.skipped = cases.filter(c => c.decision === 'skipped').length;
    sessionStats.savedRequests = sessionStats.skipped;  // Each skip saves a detail request
    
    // Save to storage for popup access
    chrome.storage.local.set({ sessionStats }, function() {
        console.log('Session stats updated:', sessionStats);
    });
    
    // Notify popup to update
    chrome.runtime.sendMessage({ action: 'updateStats' });
}

// ========== CASE EXTRACTION FROM PAGE ==========

function extractCasesFromPage() {
    const cases = [];
    
    const caseRows = document.querySelectorAll('#CasesGrid tbody tr, .k-grid-content tbody tr, tbody tr');
    
    caseRows.forEach((row, index) => {
        const caseLink = row.querySelector('a.caseLink');
        
        if (caseLink) {
            const caseNumber = caseLink.textContent.trim();
            const dataUrl = caseLink.getAttribute('data-url');
            const detailUrl = dataUrl ? `https://portal-nc.tylertech.cloud${dataUrl}` : '';
            
            const cells = row.querySelectorAll('td');
            
            let styleDefendant = '';
            let status = '';
            let location = '';
            let caseType = '';
            let filingDate = '';
            let plaintiffInfo = '';
            let defendantInfo = '';
            
            if (cells.length >= 7) {
                styleDefendant = cells[2]?.textContent?.trim() || '';
                filingDate = cells[3]?.textContent?.trim() || '';
                caseType = cells[4]?.textContent?.trim() || '';
                status = cells[5]?.textContent?.trim() || '';
                location = cells[6]?.textContent?.trim() || '';
                
                if (cells.length > 7) {
                    plaintiffInfo = cells[7]?.textContent?.trim() || '';
                    defendantInfo = cells[8]?.textContent?.trim() || '';
                }
            }
            
            // Enhanced address extraction
            const plaintiffAddress = extractAddressFromParty(plaintiffInfo);
            const defendantAddress = extractAddressFromParty(defendantInfo);
            
            // Apply AI logic
            const decision = analyzeCase({
                caseNumber,
                styleDefendant,
                caseType,
                status,
                location,
                plaintiffAddress,
                defendantAddress
            });
            
            cases.push({
                id: `case-${index}`,
                caseNumber,
                caseType,
                styleDefendant,
                status,
                location,
                filingDate,
                detailUrl,
                plaintiffInfo,
                defendantInfo,
                plaintiffAddress,
                defendantAddress,
                decision: decision.qualified ? 'qualified' : 'skipped',
                reason: decision.reason,
                shouldOpenDetail: decision.qualified
            });
        }
    });
    
    console.log(`Found ${cases.length} cases on page`);
    
    // Update session statistics
    updateSessionStats(cases);
    
    const toOpen = cases.filter(c => c.shouldOpenDetail).length;
    const toSkip = cases.length - toOpen;
    console.log(`[V1.5 ENHANCED] Detail Strategy: Open ${toOpen} qualified, skip ${toSkip} disqualified`);
    
    return cases;
}

// ========== AI CASE QUALIFICATION LOGIC ==========

function analyzeCase(caseData) {
    const style = (caseData.styleDefendant || '').toLowerCase();
    const caseType = (caseData.caseType || '').toLowerCase();
    
    // V3.1: Extract and check multiple parties
    const parties = extractPartiesFromStyle(style);
    
    // V1.5: Check roommate situation first
    if (caseData.plaintiffAddress && caseData.defendantAddress) {
        if (areAddressesMatching(caseData.plaintiffAddress, caseData.defendantAddress)) {
            return {
                qualified: false,
                reason: 'Roommate situation - same mailing address'
            };
        }
    }
    
    // V3.1: Check all plaintiffs for entities
    for (let plaintiff of parties.plaintiffs) {
        const plaintiffCheck = isEntityName(plaintiff);
        if (plaintiffCheck.isEntity) {
            return {
                qualified: false,
                reason: `Plaintiff entity detected - ${plaintiffCheck.reason}`
            };
        }
    }
    
    // V3.1: Check all defendants for entities (some cases have entity defendants)
    for (let defendant of parties.defendants) {
        const defendantCheck = isEntityName(defendant);
        if (defendantCheck.isEntity) {
            return {
                qualified: false,
                reason: `Defendant entity detected - ${defendantCheck.reason}`
            };
        }
    }
    
    // Skip non-eviction cases
    if (caseType.includes('not summary ejectment')) {
        return {
            qualified: false,
            reason: 'Not an eviction case - explicitly excluded'
        };
    }
    
    // Process eviction cases
    if (caseType.includes('summary ejectment')) {
        // Get primary plaintiff for additional checks
        const primaryPlaintiff = parties.plaintiffs[0] || '';
        
        // V3.1: Clean name suffixes before checking
        const cleanedPlaintiff = primaryPlaintiff
            .replace(/\b(jr|sr|iii|iv|ii)\b\.?$/i, '')
            .trim();
        
        // Additional specific filters
        if (cleanedPlaintiff.includes('realty') || 
            cleanedPlaintiff.includes(' at ') ||
            cleanedPlaintiff.includes('lifestyle') ||
            cleanedPlaintiff.endsWith(' lp')) {
            return {
                qualified: false,
                reason: 'Property management pattern detected'
            };
        }
        
        // Name validation
        const isValidPersonName = /^[a-zA-Z\s'-]+$/i.test(cleanedPlaintiff) && 
                                  !/\d/.test(cleanedPlaintiff);
        
        if (!isValidPersonName) {
            return {
                qualified: false,
                reason: 'Invalid person name format'
            };
        }
        
        // Check for individual person pattern
        const words = cleanedPlaintiff.split(' ');
        const hasPersonName = words.length >= 2 && 
                              words.length <= 4 && 
                              !cleanedPlaintiff.includes('llc') && 
                              !cleanedPlaintiff.includes('inc') && 
                              !cleanedPlaintiff.includes('corp');
        
        if (hasPersonName) {
            return {
                qualified: true,
                reason: 'Individual landlord - potential opportunity'
            };
        }
    }
    
    // Bank/financial cases
    if (caseType.includes('general civil') && 
        (style.includes('bank') || 
         style.includes('financial') || 
         style.includes('capital one') ||
         style.includes('citibank') ||
         style.includes('wells fargo'))) {
        return {
            qualified: false,
            reason: 'Bank/financial debt collection - not a property lead'
        };
    }
    
    // Divorce/domestic cases
    if (caseType.includes('divorce') || caseType.includes('domestic')) {
        return {
            qualified: false,
            reason: 'Divorce/domestic case - not a property lead'
        };
    }
    
    // Foreclosure cases (from training data)
    if (caseType.includes('foreclosure')) {
        return {
            qualified: false,
            reason: 'Foreclosure case - different workflow'
        };
    }
    
    return {
        qualified: false,
        reason: 'Not an eviction case or doesn\'t match criteria'
    };
}

// ========== USER INTERFACE ==========

let userFeedback = {};

function createTrainingUI(cases) {
    const existingUI = document.getElementById('case-training-overlay');
    if (existingUI) existingUI.remove();
    
    const qualified = cases.filter(c => c.decision === 'qualified');
    const skipped = cases.filter(c => c.decision === 'skipped');
    const detailPagesCount = cases.filter(c => c.shouldOpenDetail).length;
    
    const uiHTML = `
        <div id="case-training-overlay" style="
            position: fixed;
            top: 10px;
            right: 10px;
            width: 550px;
            max-height: 90vh;
            background: white;
            border: 2px solid #2563eb;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        ">
            <div style="
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; font-size: 16px;">📋 NC Court Training v1.5 ENHANCED</h3>
                <button onclick="document.getElementById('case-training-overlay').remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">✕ Close</button>
            </div>
            
            <div style="
                padding: 12px;
                background: #f5f5f5;
                border-bottom: 1px solid #e5e7eb;
            ">
                <div style="
                    display: flex;
                    gap: 20px;
                    font-size: 13px;
                    margin-bottom: 8px;
                ">
                    <span>Total: <strong>${cases.length}</strong></span>
                    <span style="color: #22c55e;">Qualified: <strong>${qualified.length}</strong></span>
                    <span style="color: #ef4444;">Skipped: <strong>${skipped.length}</strong></span>
                    <span id="reviewed-count">Reviewed: <strong>0</strong></span>
                </div>
                <div style="
                    padding: 8px;
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #92400e;
                ">
                    <strong>⚡ V1.5 ENHANCED:</strong> Smart navigation + V3.1 entity detection.
                    Will open ${detailPagesCount} detail page${detailPagesCount !== 1 ? 's' : ''}, 
                    skip ${cases.length - detailPagesCount} (${Math.round((cases.length - detailPagesCount) / cases.length * 100)}% reduction).
                </div>
            </div>
            
            <div style="
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                background: #fafbfc;
            ">
                ${cases.length === 0 ? '<p>No cases found on this page. Make sure you\'re on a results page.</p>' : ''}
                
                ${qualified.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <h4 style="
                            margin: 0 0 8px 0;
                            font-size: 14px;
                            color: #111827;
                            padding: 6px;
                            background: #d1fae5;
                            border-radius: 4px;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                        " class="case-section-header">✅ Qualified Cases (${qualified.length}) - Detail Pages Will Open</h4>
                        ${qualified.map(c => renderCase(c)).join('')}
                    </div>
                ` : ''}
                
                ${skipped.length > 0 ? `
                    <div>
                        <h4 style="
                            margin: 0 0 8px 0;
                            font-size: 14px;
                            color: #111827;
                            padding: 6px;
                            background: #fee2e2;
                            border-radius: 4px;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                        " class="case-section-header">❌ Skipped Cases (${skipped.length}) - No Detail Page Access</h4>
                        ${skipped.map(c => renderCase(c)).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div style="
                padding: 12px;
                background: white;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 8px;
            ">
                <button id="export-btn" style="
                    flex: 1;
                    padding: 10px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">📊 Export Data</button>
                <button id="open-qualified-btn" style="
                    flex: 1;
                    padding: 10px;
                    background: #22c55e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    ${qualified.length === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                " ${qualified.length === 0 ? 'disabled' : ''}>📄 Open Qualified</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', uiHTML);
    
    // Store cases globally
    window.trainingCases = cases;
    window.userFeedback = userFeedback;
    
    // Load saved feedback from storage
    chrome.storage.local.get(['userFeedback'], function(result) {
        if (result.userFeedback) {
            window.userFeedback = result.userFeedback;
            updateReviewCount();
        }
    });
    
    // Add event listeners
    document.getElementById('export-btn')?.addEventListener('click', exportTrainingData);
    document.getElementById('open-qualified-btn')?.addEventListener('click', openQualifiedCases);
}

function renderCase(caseData) {
    const feedback = userFeedback[caseData.id] || {};
    
    const detailIndicator = caseData.shouldOpenDetail ? 
        '<span style="background: #fbbf24; color: #78350f; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 8px;">📄 DETAIL</span>' : 
        '<span style="background: #e5e7eb; color: #6b7280; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 8px;">⏭️ SKIP</span>';
    
    return `
        <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 8px;
        " data-case-id="${caseData.id}">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 6px;
            ">
                <div style="display: flex; align-items: center;">
                    <a href="${caseData.detailUrl}" target="_blank" style="
                        color: #2563eb;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 14px;
                    " onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                        ${caseData.caseNumber}
                    </a>
                    ${detailIndicator}
                </div>
                <span style="
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    background: ${caseData.decision === 'qualified' ? '#d1fae5' : '#fee2e2'};
                    color: ${caseData.decision === 'qualified' ? '#065f46' : '#991b1b'};
                ">${caseData.decision.toUpperCase()}</span>
            </div>
            
            <div style="
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 6px;
                line-height: 1.4;
            ">
                <strong>Parties:</strong> ${caseData.styleDefendant}<br>
                ${caseData.plaintiffAddress || caseData.defendantAddress ? `
                    <div class="address-info" style="
                        margin-top: 4px;
                        padding: 4px;
                        background: #f9fafb;
                        border-radius: 3px;
                        border-left: 2px solid #2563eb;
                    ">
                        ${caseData.plaintiffAddress ? `<strong>P:</strong> ${caseData.plaintiffAddress}<br>` : ''}
                        ${caseData.defendantAddress ? `<strong>D:</strong> ${caseData.defendantAddress}` : ''}
                    </div>
                ` : ''}
                <strong>Type:</strong> ${caseData.caseType}<br>
                <strong>Court:</strong> ${caseData.location}<br>
                <strong>Filed:</strong> ${caseData.filingDate} • <strong>Status:</strong> ${caseData.status}
            </div>
            
            <div style="
                font-size: 11px;
                background: #f9fafb;
                padding: 6px;
                border-radius: 4px;
                margin-bottom: 8px;
                color: #4b5563;
            ">
                <strong>AI:</strong> ${caseData.reason}
            </div>
            
            <div style="
                display: flex;
                gap: 20px;
                margin-bottom: 8px;
            ">
                <label style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    color: #15803d;
                ">
                    <input type="checkbox" 
                           id="right-${caseData.id}"
                           ${feedback.assessment === 'correct' ? 'checked' : ''}
                           onchange="handleCheckbox('${caseData.id}', 'correct', this.checked)" 
                           style="
                               width: 18px;
                               height: 18px;
                               cursor: pointer;
                           "
                           aria-label="Mark as correct"/>
                    ✓ RIGHT
                </label>
                <label style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    color: #b91c1c;
                ">
                    <input type="checkbox" 
                           id="wrong-${caseData.id}"
                           ${feedback.assessment === 'incorrect' ? 'checked' : ''}
                           onchange="handleCheckbox('${caseData.id}', 'incorrect', this.checked)" 
                           style="
                               width: 18px;
                               height: 18px;
                               cursor: pointer;
                           "
                           aria-label="Mark as incorrect"/>
                    ✗ WRONG
                </label>
            </div>
            
            <textarea placeholder="Training notes..." style="
                width: 100%;
                min-height: 30px;
                margin-top: 6px;
                padding: 6px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-size: 11px;
                font-family: inherit;
                resize: vertical;
                box-sizing: border-box;
            " onchange="saveNotes('${caseData.id}', this.value)"
               aria-label="Training notes for case ${caseData.caseNumber}">${feedback.notes || ''}</textarea>
        </div>
    `;
}

// ========== EVENT HANDLERS ==========

function handleCheckbox(caseId, assessment, isChecked) {
    console.log(`Checkbox changed: case ${caseId}, assessment ${assessment}, checked ${isChecked}`);
    
    if (isChecked) {
        const oppositeType = assessment === 'correct' ? 'wrong' : 'right';
        const oppositeCheckbox = document.getElementById(`${oppositeType}-${caseId}`);
        if (oppositeCheckbox) {
            oppositeCheckbox.checked = false;
        }
        
        if (!window.userFeedback[caseId]) {
            window.userFeedback[caseId] = {};
        }
        window.userFeedback[caseId].assessment = assessment;
        window.userFeedback[caseId].timestamp = new Date().toISOString();
    } else {
        if (window.userFeedback[caseId]) {
            delete window.userFeedback[caseId].assessment;
        }
    }
    
    // Save to storage
    chrome.storage.local.set({ userFeedback: window.userFeedback });
    updateReviewCount();
}

function saveNotes(caseId, notes) {
    console.log(`Saving notes for case ${caseId}`);
    if (!window.userFeedback[caseId]) {
        window.userFeedback[caseId] = {};
    }
    window.userFeedback[caseId].notes = notes;
    
    // Save to storage
    chrome.storage.local.set({ userFeedback: window.userFeedback });
}

function updateReviewCount() {
    const reviewed = Object.keys(window.userFeedback).filter(id => window.userFeedback[id].assessment).length;
    const reviewedElement = document.getElementById('reviewed-count');
    if (reviewedElement) {
        reviewedElement.innerHTML = `Reviewed: <strong>${reviewed}</strong>`;
    }
}

function exportTrainingData() {
    console.log('Starting export...');
    
    if (!window.trainingCases || window.trainingCases.length === 0) {
        alert('No cases to export!');
        return;
    }
    
    const exportData = window.trainingCases.map(caseData => {
        const feedback = window.userFeedback[caseData.id] || {};
        return {
            caseNumber: caseData.caseNumber,
            caseType: caseData.caseType,
            plaintiffVsDefendant: caseData.styleDefendant,
            court: caseData.location,
            filingDate: caseData.filingDate,
            status: caseData.status,
            plaintiffAddress: caseData.plaintiffAddress || '',
            defendantAddress: caseData.defendantAddress || '',
            aiDecision: caseData.decision,
            aiReason: caseData.reason,
            shouldOpenDetail: caseData.shouldOpenDetail,
            userAssessment: feedback.assessment || 'not_reviewed',
            userNotes: feedback.notes || '',
            detailUrl: caseData.detailUrl,
            reviewTimestamp: feedback.timestamp || null
        };
    });
    
    const dataStr = JSON.stringify(exportData, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-data-v1.5-enhanced-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('Training data exported!\n\nV1.5 ENHANCED Features:\n• V3.1 entity detection merged\n• Smart detail navigation\n• Roommate detection\n• Multi-party handling\n• Chrome storage persistence');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            alert('Training data downloaded!');
        });
    } else {
        alert('Training data downloaded!');
    }
}

function openQualifiedCases() {
    const qualified = window.trainingCases.filter(c => c.shouldOpenDetail);
    if (qualified.length === 0) {
        alert('No qualified cases to open');
        return;
    }
    
    if (confirm(`Open ${qualified.length} qualified case detail page${qualified.length !== 1 ? 's' : ''}?`)) {
        qualified.forEach((caseData, index) => {
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    action: 'openTab',
                    url: caseData.detailUrl
                });
            }, index * 500);  // Stagger opening to avoid overwhelming browser
        });
    }
}

// Global function attachments
window.handleCheckbox = handleCheckbox;
window.saveNotes = saveNotes;
window.exportTrainingData = exportTrainingData;

// ========== MESSAGE LISTENER FOR POPUP ==========

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleUI') {
        const ui = document.getElementById('case-training-overlay');
        if (ui) {
            ui.remove();
        } else {
            const cases = extractCasesFromPage();
            if (cases.length > 0) {
                createTrainingUI(cases);
            }
        }
        sendResponse({ status: 'success' });
    } else if (request.action === 'exportData') {
        exportTrainingData();
        sendResponse({ status: 'success' });
    }
    return true;
});

// ========== INITIALIZATION ==========

function initializeExtension() {
    const hasResults = document.querySelector('a.caseLink') !== null;
    
    if (hasResults) {
        console.log('Results page detected - extracting cases...');
        setTimeout(() => {
            const cases = extractCasesFromPage();
            if (cases.length > 0) {
                createTrainingUI(cases);
                console.log(`[V1.5 ENHANCED] UI created with ${cases.length} cases`);
            }
        }, 1000);
    } else {
        console.log('Not a results page - extension standing by');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
    const hasCaseLinks = document.querySelector('a.caseLink');
    const hasUI = document.getElementById('case-training-overlay');
    
    if (hasCaseLinks && !hasUI) {
        console.log('New results detected - initializing...');
        initializeExtension();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('V1.5 ENHANCED loaded - Best of V3.1 entity detection + V1.5 smart features');