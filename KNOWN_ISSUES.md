# Known Issues and Limitations

## Critical Issue: Olostep API `extract` Parameter Bug (FIXED in v1.0.2)

### Problem
**Date Discovered**: 2026-01-29
**Severity**: 🚨 CRITICAL
**Status**: ✅ FIXED

The initial implementation used Olostep API v1 with the `extract` parameter, which caused **0% accuracy**:
- 3 out of 3 test ASINs returned completely wrong products
- Products returned were real Amazon items, but not the target ASINs
- Example: ASIN B08D6T4DKS (Rubbermaid cleaner) was incorrectly identified as "Tineco vacuum"

### Root Cause
```javascript
// WRONG - using extract parameter causes wrong products
{
  "url": "https://www.amazon.com/dp/B08D6T4DKS",
  "extract": {
    "title": true,
    "bullet_points": true,
    "price": true,
    "rating": true,
    "reviews": { "max": 100, "sort": "recent" },
    "images": true
  }
}
// Result: Tineco vacuum ❌ WRONG

// CORRECT - only send URL parameter (matches n8n config)
{
  "url": "https://www.amazon.com/dp/B08D6T4DKS"
}
// Result: Rubbermaid cleaner ✅ CORRECT
```

**Key Finding**: The `extract` parameter causes Olostep to return different product data. This was discovered by comparing with a working n8n workflow that only sends the URL parameter.

### Fix Applied
- ✅ Removed `extract` parameter from v1 API calls
- ✅ Updated `scripts/olostep-client.js` to match n8n's working configuration
- ✅ Now Olostep auto-detects and extracts content (no manual specification needed)
- ✅ Accuracy improved from 0% to 100% in testing

### Testing Results
Tested with the same 3 ASINs that previously failed:
```
B08D6T4DKS → Rubbermaid Reveal Power Scrubber ✅ CORRECT
B09SYYRBVP → kelamayi Broom ✅ CORRECT
B0FF4515N3 → AONEZ Brushes ✅ CORRECT

Accuracy: 3/3 (100%)
```

---

## Current Limitations

### 1. Olostep API Rate Limits
- Free tier: 1,000 requests/month
- Paid tier required for high-volume analysis
- Consider implementing request queuing for large batches

### 2. Amazon Anti-Scraping Measures
- IP-based rate limiting
- CAPTCHAs on frequent requests
- Region-based content differences
- **Mitigation**: Use proxies, rotate user agents, respect rate limits

### 3. v2 API Authentication Issues
- v2 API (`/v2/agent/web-agent`) returns 403 errors with current API keys
- Current implementation uses v1 API which works correctly
- **Mitigation**: v1 API with simplified parameters works well

### 4. Multi-Regional ASINs
- Same ASIN may show different products in different regions
- Current implementation uses amazon.com (US)
- **Mitigation**: Specify region in URL if needed

---

## Recommended Usage

### For Small Batches (< 10 ASINs)
```bash
node scripts/test-skill.js B08LNY11RK B0F5HFG1N8
```

### For Large Batches (> 10 ASINs)
1. Run in smaller chunks (≤20 ASINs)
2. Review generated markdown reports
3. Sample 10-20% results manually

### For Production/Critical Analysis
1. Always verify ASINs in generated reports
2. Keep detailed logs for audit trail
3. Consider manual verification for important decisions

---

## Reporting Issues

If you encounter accuracy problems:

1. **Verify ASIN** - Check if the ASIN in the report title matches what you requested

2. **Report with details**:
   - ASIN that failed
   - Expected vs actual product
   - Full error message
   - Your Olostep API version (check .env)

3. **Workaround**: Use manual analysis or alternative scrapers

---

## Future Improvements

- [ ] Add support for v2 API when authentication is resolved
- [ ] Implement local scraping with Playwright (no API limits)
- [ ] Add confidence scoring to results
- [ ] Create web dashboard for validation review
- [ ] Add A/B testing framework for scraper accuracy

---

## Changelog

### v1.0.2 (2026-01-29) - CRITICAL BUG FIX
- ✅ Fixed Olostep API accuracy issue (0% → 100%)
- ✅ Removed `extract` parameter that was causing wrong products
- ✅ Updated to match n8n's working configuration
- ✅ Added accuracy test script (`test-accuracy-fix.mjs`)

### v1.0.1 (2026-01-29)
- Initial attempt to fix accuracy (v2 API approach)
- Added data validation module
- Implemented validation checks

### v1.0.0 (2026-01-28)
- Initial release
- Basic Amazon scraping functionality
- AI-powered analysis
- Google Sheets integration

---

**Last Updated**: 2026-01-29
**Document Version**: 1.0.2
