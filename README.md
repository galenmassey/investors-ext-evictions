# Investors Evictions Extension

Chrome extension for capturing and filtering eviction cases from NC Court Portal.

## 🚀 Features

- **Smart Entity Detection** - Filters out LLCs, corporations, property management companies
- **Roommate Detection** - Identifies cases where parties share the same address
- **Detail Page Optimization** - Only opens detail pages for qualified cases (97% reduction in server requests)
- **Training Mode UI** - Visual overlay showing AI decisions with feedback options
- **Export Functionality** - JSON export of all captured cases with AI reasoning

## 📦 Installation

### Development Mode

1. Clone this repository:
```bash
git clone https://github.com/galenmassey/investors-ext-evictions.git
cd investors-ext-evictions
```

2. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

3. (Optional) Enable auto-reload for development:
```bash
cd extension
node dev-server.js
```

## 🎯 Usage

1. Navigate to NC Court Portal (portal-nc.tylertech.cloud)
2. Search for eviction cases (Summary Ejectment)
3. When results appear, the extension automatically:
   - Analyzes all cases on the page
   - Shows the Training UI overlay
   - Marks cases as Qualified (individual landlords) or Skipped (entities)

4. Review the AI decisions:
   - Check ✓ RIGHT or ✗ WRONG for each case
   - Add training notes
   - Export data for analysis

5. Click "Open Qualified" to open detail pages for qualified cases only

## 🔧 Configuration

Copy `.env.local.example` to `.env.local` and configure:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
UPLOAD_ENDPOINT=your_edge_function_url
```

## 📊 Entity Detection Rules

The extension filters out:
- **Business Entities**: LLC, Inc, Corp, LP, LLP, Trust
- **Property Management**: Realty, Properties, Management, Apartments
- **Government**: Housing Authority, City of, County of
- **Financial**: Banks, Credit Unions, Finance Companies
- **Known Businesses**: Specific company names from training data

## 🧪 Version History

### V1.5 ENHANCED (Current)
- Merged V3.1 entity detection improvements
- Added roommate detection (same address check)
- Smart detail page navigation
- Session statistics tracking
- Chrome storage persistence

### V1.4
- Initial smart navigation
- Basic entity filtering

## 📝 Training Data Format

Exported JSON includes:
```json
{
  "caseNumber": "25CV001234-090",
  "caseType": "Summary Ejectment",
  "plaintiffVsDefendant": "John Smith vs Jane Doe",
  "court": "District Court",
  "filingDate": "01/15/2025",
  "status": "Active",
  "plaintiffAddress": "123 Main St",
  "defendantAddress": "456 Oak Ave",
  "aiDecision": "qualified",
  "aiReason": "Individual landlord - potential opportunity",
  "shouldOpenDetail": true,
  "userAssessment": "correct",
  "userNotes": "Verified individual owner"
}
```

## 🐛 Troubleshooting

### Extension not loading
- Ensure you're in Developer Mode
- Check for errors in chrome://extensions
- Try reloading the extension

### Training UI not appearing
- Verify you're on a search results page
- Check that case links are present
- Open DevTools Console for error messages

### Auto-reload not working
- Ensure dev-server.js is running
- Check that port 8888 is not in use
- Verify localhost access is allowed

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test thoroughly on NC Court Portal
4. Submit a pull request

## 📞 Support

For issues or questions, create an issue on GitHub.

---

Built for the Investors project by Galen Massey