// Content script for NC Court Portal Training Extension - V1.5 with Smart Detail Navigation
console.log('Case Training Page Reader v1.5 - Smart Detail Page Navigation');

// ========== ENTITY DETECTION PATTERNS ==========
// Comprehensive entity exclusion patterns - strict LLC filtering
const entitySuffixes = [
    'llc', 'l.l.c.', 'l.l.c', 'l.c.', 'lc', 'limited liability company', 'limited liability co.', 'limited company',
    'ltd', 'ltd.', 'l.t.d.', 'ltd co',
    'inc', 'inc.', 'inc', 'incorporated', 'corp', 'corp.', 'corp', 'corporation', 'co.', 'company', 'limited', 'ltd.',
    'p.a.', 'pa', 'p.c.', 'pc', 'p.l.l.c.', 'pllc', 'chtd', 'chartered', 'prof. co.', 'prof. corp.', 'prof. l.l.c.', 'prof. llc', 's.c.',
    'l.p.', 'lp', 'l.l.p.', 'llp', 'l.l.l.p.', 'lllp', 'p.l.l.p.', 'pllp', 'partners', 'partnership', 'general partnership',
    'trust', 'family trust', 'living trust', 'estate trust', 'legacy trust', 'heritage trust', 'revocable trust', 'irrevocable trust',
    'foundation trust', 'asset trust', 'property trust', 'trustee', 'trustor'
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
    'national', 'international', 'global', 'regional', 'local', 'metro', 'urban', 'city', 'county', 'state', 'statewide'
];

const entityRegexPatterns = [
    /\b(llc|l\.l\.c\.|l\.l\.c|l\.c\.|lc)\b/i,
    /\b(inc|inc\.|incorporated|corp|corp\.|corporation|co\.|company)\b/i,
    /\b(p\.a\.|pa|p\.c\.|pc|p\.l\.l\.c\.|pllc|chtd|chartered)\b/i,
    /\b(l\.p\.|lp|l\.l\.p\.|llp|l\.l\.l\.p\.|lllp|p\.l\.l\.p\.|pllp)\b/i,
    /\b(partners|partnership|general partnership)\b/i,
    /\b(trust|trustee|trustor)\b/i,
    /\b(ltd|ltd\.|l\.t\.d\.)\b/i
];

// ========== HELPER FUNCTIONS ==========

// Check if a name matches entity patterns
function isEntityName(name) {
    const lowerName = name.toLowerCase().trim();
    
    // Check suffixes
    for (let suffix of entitySuffixes) {
        if (lowerName.endsWith(' ' + suffix) || lowerName === suffix) {
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
    
    return { isEntity: false, reason: '' };
}

// NEW V1.5: Extract address from party information (for roommate detection)
function extractAddressFromParty(partyText) {
    // Party text typically looks like:
    // "John Smith" or "John Smith, 123 Main St, City, NC 28XXX"
    // We need to extract the address portion if it exists
    
    // For now, we'll extract everything after the first comma as the address
    const parts = partyText.split(',');
    if (parts.length > 1) {
        // Join all parts after the name (first part) and clean it up
        return parts.slice(1).join(',').trim();
    }
    return '';
}

// NEW V1.5: Check if addresses match (roommate situation)
function areAddressesMatching(address1, address2) {
    // Normalize addresses for comparison
    const normalize = (addr) => addr.toLowerCase().replace(/[,.\s]+/g, ' ').trim();
    
    if (!address1 || !address2) return false;
    
    const norm1 = normalize(address1);
    const norm2 = normalize(address2);
    
    // Check if addresses are identical
    return norm1 === norm2 && norm1.length > 0;
}

// ========== CASE EXTRACTION FROM PAGE ==========

function extractCasesFromPage() {
    const cases = [];
    
    // Get all table rows from the results grid
    const caseRows = document.querySelectorAll('#CasesGrid tbody tr, .k-grid-content tbody tr, tbody tr');
    
    caseRows.forEach((row, index) => {
        const caseLink = row.querySelector('a.caseLink');
        
        if (caseLink) {
            const caseNumber = caseLink.textContent.trim();
            const dataUrl = caseLink.getAttribute('data-url');
            const detailUrl = dataUrl ? `https://portal-nc.tylertech.cloud${dataUrl}` : '';
            
            const cells = row.querySelectorAll('td');
            
            // Standard cell layout:
            // Cell 0: Empty (checkbox)
            // Cell 1: Case Number
            // Cell 2: Style/Defendant (Plaintiff VS Defendant)
            // Cell 3: Filing Date
            // Cell 4: Case Type
            // Cell 5: Status
            // Cell 6: Location (Court name)
            // Cell 7-9: Party info (varies)
            
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
                
                // Try to extract party info from additional cells (if available)
                if (cells.length > 7) {
                    plaintiffInfo = cells[7]?.textContent?.trim() || '';
                    defendantInfo = cells[8]?.textContent?.trim() || '';
                }
            }
            
            // V1.5: Extract addresses for roommate detection
            const plaintiffAddress = extractAddressFromParty(plaintiffInfo);
            const defendantAddress = extractAddressFromParty(defendantInfo);
            
            // Apply AI logic to determine qualified vs skipped
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
                // V1.5: Track if we should open detail page
                shouldOpenDetail: decision.qualified
            });
        }
    });
    
    console.log(`Found ${cases.length} cases on page`);
    
    // V1.5: Log detail page strategy
    const toOpen = cases.filter(c => c.shouldOpenDetail).length;
    const toSkip = cases.length - toOpen;
    console.log(`Detail Page Strategy: Will open ${toOpen} qualified cases, skip ${toSkip} disqualified cases`);
    
    return cases;
}

// ========== AI CASE QUALIFICATION LOGIC ==========

function analyzeCase(caseData) {
    const style = (caseData.styleDefendant || '').toLowerCase();
    const caseType = (caseData.caseType || '').toLowerCase();
    
    // Extract plaintiff and defendant from "Plaintiff VS Defendant" format
    const vsIndex = style.indexOf(' vs ');
    const plaintiff = vsIndex > -1 ? style.substring(0, vsIndex).trim() : style;
    const defendant = vsIndex > -1 ? style.substring(vsIndex + 4).trim() : '';
    
    // V1.5: NEW CHECK - Roommate situation (same mailing address)
    if (caseData.plaintiffAddress && caseData.defendantAddress) {
        if (areAddressesMatching(caseData.plaintiffAddress, caseData.defendantAddress)) {
            return {
                qualified: false,
                reason: 'Roommate situation - same mailing address'
            };
        }
    }
    
    // Entity check for plaintiff
    const plaintiffEntityCheck = isEntityName(plaintiff);
    if (plaintiffEntityCheck.isEntity) {
        return {
            qualified: false,
            reason: `Plaintiff entity detected - ${plaintiffEntityCheck.reason}`
        };
    }
    
    // Entity check for defendant
    const defendantEntityCheck = isEntityName(defendant);
    if (defendantEntityCheck.isEntity) {
        return {
            qualified: false,
            reason: `Defendant entity detected - ${defendantEntityCheck.reason}`
        };
    }
    
    // Skip if explicitly NOT Summary Ejectment
    if (caseType.includes('not summary ejectment')) {
        return {
            qualified: false,
            reason: 'Not an eviction case - explicitly excluded'
        };
    }
    
    // Only process eviction cases (Summary Ejectment)
    if (caseType.includes('summary ejectment')) {
        // Additional specific company filters
        if (plaintiff.includes('realty')) {
            return {
                qualified: false,
                reason: 'Realty company - excluded'
            };
        }
        
        if (plaintiff.includes(' at ') || 
            plaintiff.includes('somerstone') ||
            plaintiff.includes('treybrooke') ||
            plaintiff.includes('village') ||
            plaintiff.includes('pointe') ||
            plaintiff.includes('campus')) {
            return {
                qualified: false,
                reason: 'Property management company - excluded'
            };
        }
        
        if (plaintiff.includes('property management') || 
            plaintiff.includes('apartments') || 
            plaintiff.includes('apts') ||
            plaintiff.includes(' llp') ||
            plaintiff.includes('management group') ||
            plaintiff.includes('properties llp') ||
            plaintiff.includes('properties llc') ||
            plaintiff.includes('noah llc') ||
            plaintiff.includes('noah, llc') ||
            plaintiff.includes('hospitality') ||
            plaintiff.includes('prcp-')) {
            return {
                qualified: false,
                reason: 'Corporate property management - excluded'
            };
        }
        
        // Government/housing authority check
        if (plaintiff.includes('housing authority') || 
            plaintiff.includes('city of') || 
            plaintiff.includes('county') ||
            plaintiff.includes('housing')) {
            return {
                qualified: false,
                reason: 'Government/Housing Authority - excluded'
            };
        }
        
        if (plaintiff.endsWith(' lp')) {
            return {
                qualified: false,
                reason: 'Limited Partnership (likely apartment complex) - excluded'
            };
        }
        
        if (plaintiff.includes('hughes enterprises') ||
            plaintiff.includes('enterprises')) {
            return {
                qualified: false,
                reason: 'Property management enterprise - excluded'
            };
        }
        
        if (plaintiff.includes('lifestyle')) {
            return {
                qualified: false,
                reason: 'Lifestyle/property management company - excluded'
            };
        }
        
        // Name validation
        const isValidPersonName = /^[a-zA-Z\s'-]+$/i.test(plaintiff) && 
                                  /^[a-zA-Z\s'-]+$/i.test(defendant) && 
                                  !/\d/.test(plaintiff) && 
                                  !/\d/.test(defendant);
        if (!isValidPersonName) {
            return {
                qualified: false,
                reason: 'Invalid person name format - contains numbers or special characters'
            };
        }
        
        // Check for individual person names
        const words = plaintiff.split(' ');
        const hasPersonName = words.length >= 2 && 
                              words.length <= 4 && 
                              !plaintiff.includes('llc') && 
                              !plaintiff.includes('inc') && 
                              !plaintiff.includes('corp') &&
                              !plaintiff.includes('lp') &&
                              !plaintiff.includes('company') &&
                              !plaintiff.includes('group') &&
                              !plaintiff.includes('trust') &&
                              !plaintiff.includes('estate') &&
                              !plaintiff.includes('owner') &&
                              !plaintiff.includes('brookefield');
        
        if (hasPersonName) {
            const firstWord = words[0].toLowerCase();
            const isLikelyPerson = !firstWord.includes('garner') &&
                                   !firstWord.includes('brook') &&
                                   !firstWord.includes('field') &&
                                   !firstWord.includes('hill') &&
                                   !firstWord.includes('park') &&
                                   !firstWord.includes('lake');
            
            if (isLikelyPerson) {
                return {
                    qualified: true,
                    reason: 'Individual landlord - potential opportunity'
                };
            }
        }
        
        if (plaintiff.includes('llc')) {
            return {
                qualified: false,
                reason: 'LLC company - excluded'
            };
        }
    }
    
    // Bank/financial cases
    if (caseType.includes('general civil') && 
        (style.includes('bank') || 
         style.includes('financial') || 
         style.includes('citibank') ||
         style.includes('onemain') ||
         style.includes('capital one') ||
         style.includes('credit union') ||
         style.includes('lvnv funding') ||
         style.includes('republic finance'))) {
        return {
            qualified: false,
            reason: 'Bank/financial debt collection - not a property lead'
        };
    }
    
    // Divorce cases
    if (caseType.includes('divorce') || caseType.includes('domestic')) {
        return {
            qualified: false,
            reason: 'Divorce/domestic case - not a property lead'
        };
    }
    
    // Default decision
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
    
    // V1.5: Count cases that would have detail pages opened
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
                <h3 style="margin: 0; font-size: 16px;">📋 Case Training v1.5 - Smart Navigation</h3>
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
                    <strong>⚡ V1.5 Smart Navigation:</strong> Will open detail pages for ${detailPagesCount} qualified case${detailPagesCount !== 1 ? 's' : ''} only.
                    Skipping ${cases.length - detailPagesCount} disqualified cases to save time and server load.
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
                        ">✅ Qualified Cases (${qualified.length}) - Detail Pages Will Open</h4>
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
                        ">❌ Skipped Cases (${skipped.length}) - No Detail Page Access</h4>
                        ${skipped.map(c => renderCase(c)).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div style="
                padding: 12px;
                background: white;
                border-top: 1px solid #e5e7eb;
            ">
                <button id="export-btn" style="
                    width: 100%;
                    padding: 10px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">📊 Export Training Data</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', uiHTML);
    
    // Store cases globally for export
    window.trainingCases = cases;
    window.userFeedback = userFeedback;
    
    // Add event listener to export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log('Export button clicked');
            exportTrainingData();
        });
    }
}

function renderCase(caseData) {
    const feedback = userFeedback[caseData.id] || {};
    
    // V1.5: Show detail page indicator
    const detailIndicator = caseData.shouldOpenDetail ? 
        '<span style="background: #fbbf24; color: #78350f; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 8px;">📄 DETAIL PAGE</span>' : 
        '<span style="background: #e5e7eb; color: #6b7280; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 8px;">⏭️ SKIP DETAIL</span>';
    
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
                <strong>Plaintiff vs Defendant:</strong> ${caseData.styleDefendant}<br>
                ${caseData.plaintiffAddress || caseData.defendantAddress ? `
                    <div style="margin-top: 4px; padding: 4px; background: #f9fafb; border-radius: 3px;">
                        ${caseData.plaintiffAddress ? `<strong>P Address:</strong> ${caseData.plaintiffAddress}<br>` : ''}
                        ${caseData.defendantAddress ? `<strong>D Address:</strong> ${caseData.defendantAddress}` : ''}
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
                           "/>
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
                           "/>
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
            " onchange="saveNotes('${caseData.id}', this.value)">${feedback.notes || ''}</textarea>
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
    
    const reviewed = Object.keys(window.userFeedback).filter(id => window.userFeedback[id].assessment).length;
    const reviewedElement = document.getElementById('reviewed-count');
    if (reviewedElement) {
        reviewedElement.innerHTML = `Reviewed: <strong>${reviewed}</strong>`;
    }
}

function saveNotes(caseId, notes) {
    console.log(`Saving notes for case ${caseId}`);
    if (!window.userFeedback[caseId]) {
        window.userFeedback[caseId] = {};
    }
    window.userFeedback[caseId].notes = notes;
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
    link.download = `training-data-v1.5-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('Training data exported!\n\n1. File downloaded to your Downloads folder\n2. Data copied to clipboard - paste it in our conversation\n\nV1.5 Features:\n- Roommate detection added\n- Smart detail page navigation\n- Only qualified cases will have detail pages opened');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            alert('Training data downloaded to your Downloads folder!\n\n(Could not copy to clipboard - you can open the file to copy the content)');
        });
    } else {
        alert('Training data downloaded to your Downloads folder!');
    }
}

// Attach functions to window for onclick/onchange handlers
window.handleCheckbox = handleCheckbox;
window.saveNotes = saveNotes;
window.exportTrainingData = exportTrainingData;

// ========== INITIALIZATION ==========

function initializeExtension() {
    const hasResults = document.querySelector('a.caseLink') !== null;
    
    if (hasResults) {
        console.log('Results page detected - extracting cases...');
        setTimeout(() => {
            const cases = extractCasesFromPage();
            if (cases.length > 0) {
                createTrainingUI(cases);
                console.log(`Training UI created with ${cases.length} cases`);
                
                // V1.5: Log detail page strategy
                const toOpen = cases.filter(c => c.shouldOpenDetail).length;
                console.log(`[V1.5] Smart Navigation: ${toOpen} detail pages will be opened, ${cases.length - toOpen} will be skipped`);
            } else {
                console.log('No cases found to display');
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

console.log('V1.5 Extension loaded with roommate detection and smart detail navigation');