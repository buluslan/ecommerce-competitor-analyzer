# n8n Workflow Reference

**Source**: Amazon Competitor Analysis n8n Workflow (v81)
**Workflow ID**: N2Z4oEsWYFAFWDX3
**Location**: Your n8n workflow URL (private)
**Config File**: `工作流配置.json`

---

## Overview

This document captures the key patterns, decisions, and learnings from the n8n workflow implementation that are relevant to the skill implementation.

---

## Workflow Architecture

### Node Flow (v81)

```
Google Sheets Trigger
    ↓
Google Sheets (Read ASINs)
    ↓
Filter (Skip analyzed)
    ↓
Olostep API (Scrape with 100 comments)
    ↓
Set (Parse data)
    ↓
Google Gemini (AI Analysis)
    ↓
Code (Extract structured data) ← **Key fix in v81**
    ↓
Google Sheets (Write results)
```

### Key Nodes

| Node | Purpose | Critical Setting |
|------|---------|------------------|
| **Filter** | Skip already-analyzed ASINs | Check "分析结果" column is empty |
| **Olostep API** | Scrape product page | `comments_number: 100` |
| **Google Gemini** | AI analysis | Model: `gemini-3-flash-preview` |
| **Code - Extract** | Parse AI response | Uses `$input.all()` for batch |

---

## Critical Fixes & Learnings

### Problem 1: Batch Processing Not Working (v79 → v81)

**Symptom**: Workflow only processed one ASIN despite reading multiple from Google Sheets.

**Root Cause**: The "Code - 提取结构化数据" node was using `$input.item.json` instead of `$input.all()`, causing it to collapse all items into one.

**Evidence** (Execution #368):
```
Google Sheets: 3 items ✅
Filter: 3 items ✅
Olostep API: 3 items ✅
Google Gemini: 3 items ✅
Code - Extract: 1 item ❌ (collapsed!)
```

**Solution** (v81):
```javascript
// BEFORE (Wrong)
const item = $input.item.json;
// Only processes first item

// AFTER (Correct)
const items = $input.all();
const results = items.map((item, index) => {
  // Process each item independently
  return { json: { /* extracted data */ } };
});
return results;  // Return all results
```

**Key Pattern**: Always use `$input.all()` + `.map()` for batch processing in n8n Code nodes.

---

### Problem 2: Expression Format Errors (v71 → v72)

**Symptom**: Workflow validation failed with "Invalid expression" errors.

**Root Cause**: n8n expressions must use `{{ }}` wrapping, not direct JavaScript.

**Solution**:
```javascript
// BEFORE (Wrong)
{{ $('Set - 解析数据').item.json.markdownContent }}

// AFTER (Correct)
{{ $('Set - 解析数据').item.json.markdownContent }}
```

**Key Pattern**: All n8n expressions in HTTP nodes must use double curly braces.

---

## Code Patterns for Skill Implementation

### 1. Batch Processing Pattern

```javascript
// From n8n "Code - 提取结构化数据" node (v81)
const items = $input.all();

const results = items.map((item, index) => {
  try {
    // Extract data from current item
    const aiResponse = item.json.content?.parts?.[0]?.text || '';

    // Get upstream data for this index
    const upstreamData = $('Set - 解析数据').all();
    const asin = upstreamData[index].json.asin;

    // Return structured result
    return {
      json: {
        asin: asin,
        extractedTitle: extractTitle(aiResponse),
        extractedPrice: extractPrice(aiResponse),
        extractedRating: extractRating(aiResponse)
      }
    };
  } catch (error) {
    // Error isolation: single failure doesn't stop batch
    return {
      json: {
        asin: 'unknown',
        error: 'Processing failed'
      }
    };
  }
});

return results;
```

### 2. Regex Extraction Patterns

```javascript
// Title extraction (multiple fallback patterns)
const titlePatterns = [
  /产品标题[：:]+([^\n]+)/,
  /Title[：:]+([^\n]+)/
];

let title = '未知';  // Default value
for (const pattern of titlePatterns) {
  const match = aiResponse.match(pattern);
  if (match) {
    title = match[1].trim();
    break;
  }
}

// Price extraction
const pricePatterns = [
  /价格[：:]+[^0-9]*([0-9]+\.?[0-9]*)/,
  /Price[：:]+[^0-9]*([0-9]+\.?[0-9]*)/
];

// Rating extraction
const ratingPatterns = [
  /评分[：:]+[^0-9]*([0-9]+\.?[0-9]*)/,
  /Rating[：:]+[^0-9]*([0-9]+\.?[0-9]*)/
];
```

### 3. Error Isolation Pattern

```javascript
// Process with error isolation
const items = $input.all();
const results = items.map((item, index) => {
  try {
    // Processing logic
    const data = processData(item);
    return { success: true, data };
  } catch (error) {
    // Return error result instead of throwing
    return { success: false, error: error.message };
  }
});

// Continue with all results (successful + failed)
return results;
```

---

## Olostep API Configuration

### Request Format

```javascript
{
  "url": "https://www.amazon.com/dp/B0C4YT8S6H",
  "wait_time": 10,
  "screenshot": false,
  "extract_dynamic_content": true,
  "comments_number": 100  // Key: 100 comments for deep analysis
}
```

### Response Format

```javascript
{
  "task_id": "string",
  "markdown_content": "Full page content in markdown",
  "html_content": "Full page HTML"
}
```

### Key Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| `comments_number` | 100 | Set to 100 for deep review analysis |
| `wait_time` | 10 | Allow page load completion |
| `extract_dynamic_content` | true | Catch JS-rendered content |

---

## Gemini AI Configuration

### Model

- **Model**: `gemini-3-flash-preview`
- **Reason**: Fast and cost-effective for analysis tasks

### Prompt Structure

The prompt is structured with:
1. **Role**: Expert Amazon operations director + brand strategist
2. **Goal**: Deep product analysis with 4 dimensions
3. **Output**: Structured analysis + extracted fields

### 4-Dimensional Analysis Framework

1. **文案构建逻辑与词频分析** (The Brain)
   - Build strategy (pain point / scenario / spec-driven)
   - Top 10 keyword extraction

2. **视觉资产设计思路** (The Face)
   - Design methodology
   - Visual flow breakdown
   - Color psychology

3. **评论定量与定性分析** (The Voice)
   - Quantitative overview
   - Advantage clustering
   - Negative review penetration
   - Top 3 insights

4. **市场维态与盲区扫描** (The Pulse)
   - Price trends
   - Q&A analysis
   - Blind spot identification

---

## Google Sheets Integration

### Sheet Structure

| Column | Purpose |
|--------|---------|
| A (ASIN) | Product identifier (input) |
| B (分析结果) | Full AI analysis (output) |
| C (标题) | Extracted title (output) |
| D (价格) | Extracted price (output) |
| E (评分) | Extracted rating (output) |

### Filter Logic

```javascript
// Skip if already analyzed
const isAnalyzed = $input.item.json.分析结果 !== '';
return isAnalyzed === false;
```

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v81 | 2026-01-28 | Fixed batch processing (Code node) |
| v80 | 2026-01-28 | Added 100 comments scraping |
| v79 | 2026-01-28 | Batch processing attempt |
| v73-v78 | 2026-01-28 | Structured data extraction |
| v71-v72 | 2026-01-28 | Expression format fixes |

---

## Skill Implementation Checklist

- [x] Use `$input.all()` + `.map()` for batch processing
- [x] Implement error isolation (single failure ≠ batch failure)
- [x] Use exact Gemini prompt from n8n (no modifications)
- [x] Extract title/price/rating with regex fallbacks
- [x] Olostep API with 100 comments
- [x] Google Sheets dual output (table + markdown)
- [x] Support ASIN and URL input formats
