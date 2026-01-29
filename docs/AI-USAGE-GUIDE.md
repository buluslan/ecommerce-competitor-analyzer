# AI Usage Guide - E-commerce Competitor Analyzer

**Purpose**: This document tells AI agents how to use the e-commerce competitor analyzer skill effectively.

---

## Quick Decision Tree

```
User request contains ANY of these?
├─ "analyze" + [product URL/ASIN]
├─ "research" + [product URL/ASIN]
├─ "extract insights" + [product URL/ASIN]
├─ "competitor" + [product URL/ASIN]
└─ "Amazon product" + [URL/ASIN]
   → YES: Use this skill
   → NO: Use other tools
```

---

## When to Use This Skill

Use this skill when the user asks for:
- Analysis of Amazon/Temu/Shopee products
- Competitor research on e-commerce platforms
- Product insights from marketplaces
- Batch analysis of multiple products
- Extraction of pricing, reviews, or rankings

**Do NOT use for**:
- General web scraping (use generic tools)
- Social media analysis
- News article analysis
- Non-e-commerce websites

---

## 4-Step Workflow

### Step 1: Parse User Input

Extract ALL product identifiers from the user's message:

**Examples**:
```
Input: "Analyze B0C4YT8S6H and B08N5WRQ1Y"
Extract: ['B0C4YT8S6H', 'B08N5WRQ1Y']

Input: "Check this: https://amazon.com/dp/B0C4YT8S6H"
Extract: ['B0C4YT8S6H']  // Extract ASIN from URL

Input: "Compare these:
B0C4YT8S6H
https://amazon.com/dp/B08N5WRQ1Y
B0CLFH7CCV"
Extract: ['B0C4YT8S6H', 'B08N5WRQ1Y', 'B0CLFH7CCV']
```

### Step 2: Validate Environment

Check if required configuration exists:
```bash
# Read .env file
cat .env

# Verify keys exist
grep -q "OLOSTEP_API_KEY=" .env
grep -q "GEMINI_API_KEY=" .env
```

**If missing**: Ask user to configure API keys first.

### Step 3: Process Products (Batch with Error Isolation)

```javascript
// Critical: Use Promise.allSettled for error isolation
const products = extractProducts(userInput);
const results = await Promise.allSettled(
  products.map(async (asin) => {
    return await scrapeAndAnalyze(asin);
  })
);

// Report results
const successful = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

console.log(`✅ ${successful.length} succeeded, ❌ ${failed.length} failed`);
```

### Step 4: Generate Dual Output

**Output 1: Google Sheets**
- Columns: ASIN, Title, Price, Rating, 4 analysis summaries
- Sheet ID priority: User specified > .env default > Ask user

**Output 2: Markdown Report**
- Filename: `竞品分析-YYYY-MM-DD.md`
- Structure: Overview + Detailed analysis for each product

---

## File Reading Order (For AI)

When processing a request, read files in this order:

1. **`.env`** - Check API keys exist
2. **`platforms.yaml`** - Get platform patterns and scraper config
3. **`prompts/analysis-prompt-base.md`** - Get AI analysis prompt
4. **`scripts/scrape-amazon.js`** - (Optional) Use scraper if available

---

## Critical Rules

### ✅ MUST DO

1. **Extract ALL product identifiers** before processing
2. **Use Promise.allSettled** for batch processing (error isolation)
3. **Generate BOTH formats**: Google Sheets + Markdown
4. **Report summary**: X succeeded, Y failed
5. **Use exact prompt** from `prompts/analysis-prompt-base.md`
6. **Validate .env exists** before starting

### ❌ MUST NOT DO

1. **Do NOT modify** the analysis prompt template
2. **Do NOT stop batch** if single product fails
3. **Do NOT skip validation** of API keys
4. **Do NOT output only one format** (must do both Sheets + Markdown)
5. **Do NOT hardcode** personal credentials

---

## Common Patterns

### Pattern 1: Single Product Analysis

```
User: "Analyze B0C4YT8S6H"

AI Actions:
1. Extract: ['B0C4YT8S6H']
2. Validate: Check .env has API keys
3. Scrape: Call Olostep API for product data
4. Analyze: Call Gemini with analysis prompt
5. Output: Write to Google Sheets + Generate Markdown
6. Report: "✅ Analysis complete for B0C4YT8S6H"
```

### Pattern 2: Batch Analysis

```
User: "Analyze these: B0C4YT8S6H, B08N5WRQ1Y, B0CLFH7CCV"

AI Actions:
1. Extract: ['B0C4YT8S6H', 'B08N5WRQ1Y', 'B0CLFH7CCV']
2. Validate: Check .env has API keys
3. Batch Process:
   - Promise.allSettled([scrapeAndAnalyze(B0C4YT8S6H), ...])
4. Handle Results:
   - 2 succeeded, 1 failed (example)
   - Output: Write 2 rows to Google Sheets
   - Output: Generate Markdown with 2 products
   - Report: "✅ 2 succeeded, ❌ 1 failed (B0CLFH7CCV: timeout)"
```

### Pattern 3: URL Input

```
User: "Analyze https://amazon.com/dp/B0C4YT8S6H"

AI Actions:
1. Extract: ['B0C4YT8S6H'] (extract ASIN from URL)
2. Continue same as Pattern 1
```

---

## Error Handling

### If .env is missing
```
"⚠️ Configuration required: Please set up .env file with API keys.
Required: OLOSTEP_API_KEY, GEMINI_API_KEY
See .env.example for template."
```

### If scraping fails
```
"❌ Failed to scrape B0C4YT8S6H: Product not found
Continuing with remaining products..."
```

### If Google Sheets ID is missing
```
"⚠️ Google Sheets ID not found in .env
Please provide:
- Sheet ID: abc123xyz789
- Sheet URL: https://docs.google.com/spreadsheets/d/abc123xyz789
- Or add GOOGLE_SHEETS_ID=... to .env"
```

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| Extract identifiers | < 1 second |
| Validate .env | < 1 second |
| Scrape 1 product | ~30 seconds |
| Analyze 1 product | ~45 seconds |
| **Total per product** | **~1-2 minutes** |
| Batch of 10 (parallel) | ~10-15 minutes |

---

## Analysis Framework (4 Dimensions)

The AI analysis uses this proven framework from n8n workflow:

1. **文案构建逻辑与词频分析** (The Brain)
   - Copywriting strategy
   - Top 10 keywords with weight distribution

2. **视觉资产设计思路** (The Face)
   - Visual methodology
   - Design psychology

3. **评论定量与定性分析** (The Voice)
   - Review sentiment
   - Top 3 strengths/pain points/improvements

4. **市场维态与盲区扫描** (The Pulse)
   - Market positioning
   - Competitive blind spots

**Important**: Use the exact prompt from `prompts/analysis-prompt-base.md` without modifications.

---

## Quick Reference

### File Locations
- Skill instructions: `SKILL.md`
- Platform config: `platforms.yaml`
- Analysis prompt: `prompts/analysis-prompt-base.md`
- Env template: `.env.example`

### Required API Keys
```bash
OLOSTEP_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GOOGLE_SHEETS_ID=your_sheet_id_here
```

### Output Formats
- Google Sheets: Structured table (ASIN, Title, Price, Rating, 4 summaries)
- Markdown: Detailed report (竞品分析-YYYY-MM-DD.md)

---

## Summary

**Your role as AI**:
1. Parse user input for product identifiers
2. Validate environment (API keys)
3. Batch process with error isolation
4. Generate dual output (Sheets + Markdown)
5. Report results summary

**Key principles**:
- Error isolation: Single failure ≠ batch failure
- Dual output: Always generate both formats
- Exact prompt: Use analysis prompt as-is
- User feedback: Report successes and failures

---

**Last updated**: 2026-01-29
