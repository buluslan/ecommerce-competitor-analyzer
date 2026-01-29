# E-commerce Competitor Analyzer

<div align="center">

**A powerful multi-platform e-commerce competitor analysis skill for Claude Code**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blue)](https://claude.ai/code)

</div>

## Overview

This is a [Claude Code Skill](https://claude.ai/code) that automatically analyzes competitor products across multiple e-commerce platforms (Amazon, Temu, Shopee) and generates comprehensive AI-powered analysis reports.

### Key Features

- **Multi-Platform Support**: Amazon (active), Temu & Shopee (planned)
- **Batch Processing**: Analyze multiple products in a single request
- **AI-Powered Analysis**: Four-dimensional analysis framework:
  - Copywriting strategy & keyword analysis
  - Visual asset design methodology
  - Customer review sentiment analysis
  - Market positioning & competitive intelligence
- **Dual Format Output**:
  - Google Sheets (structured data)
  - Markdown reports (detailed analysis)
- **Error Isolation**: Single product failure doesn't stop batch processing

## What is a Claude Code Skill?

A **Skill** is an "instruction manual" for Claude Code AI. It enables Claude to perform specialized tasks by providing structured prompts, scripts, and configurations.

This skill allows you to simply say:
> "Analyze these Amazon products: B0C4YT8S6H, B08N5WRQ1Y, B0CLFH7CCV"

And Claude will:
1. Extract product data from Amazon
2. Generate AI-powered analysis reports
3. Output results to Google Sheets + Markdown files

## Requirements

### API Keys (Required)

| Service | Purpose | Cost |
|---------|---------|------|
| **Olostep API** | Web scraping | 1000 free requests/month, then $0.002/request |
| **Google Gemini API** | AI analysis | ~$0.001/product |

### API Keys (Optional)

| Service | Purpose |
|---------|---------|
| **Google Sheets API** | Export results to Google Sheets |

## Installation

### Step 1: Install the Skill

```bash
# Using npx skills (recommended)
npx skills add YOUR_USERNAME/ecommerce-competitor-analyzer

# Or clone manually
git clone https://github.com/YOUR_USERNAME/ecommerce-competitor-analyzer.git
cp -r ecommerce-competitor-analyzer ~/.claude/skills/main-mode-skills/ecommerce-competitor-analyzer.skill
```

### Step 2: Configure Environment Variables

```bash
# Copy the example env file
cd ~/.claude/skills/main-mode-skills/ecommerce-competitor-analyzer.skill
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Add your API keys:
```bash
OLOSTEP_API_KEY=your_olostep_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_SHEETS_ID=your_google_sheets_id_here
```

### Step 3: Verify Installation

```bash
# List installed skills
~/.claude/list-skills.sh
```

## Usage

### Basic Usage (Single Product)

In Claude Code, simply say:

```
Analyze this Amazon product: B0C4YT8S6H
```

Claude will:
1. Extract product data from Amazon
2. Generate comprehensive analysis report
3. Save to Google Sheets (1 row) + Markdown file

### Batch Analysis (Multiple Products)

```
Analyze these Amazon products:
B0C4YT8S6H
B08N5WRQ1Y
B0CLFH7CCV
```

Or use URLs:

```
Analyze these products:
https://amazon.com/dp/B0C4YT8S6H
https://amazon.com/dp/B08N5WRQ1Y
```

### Output Formats

#### Format 1: Google Sheets (Structured Data)

| ASIN | Product Title | Price | Rating | Copywriting Analysis | Visual Analysis | Review Analysis | Market Analysis |
|------|--------------|-------|--------|---------------------|-----------------|-----------------|-----------------|
| B0C4YT8S6H | Samsung Galaxy Tab A9+ | $159.99 | 4.4 | [300-word summary] | [300-word summary] | [300-word summary] | [300-word summary] |

#### Format 2: Markdown Report (Detailed Analysis)

```markdown
# Amazon Competitor Analysis Report

## Product 1: B0C4YT8S6H

### Basic Information
- Title: Samsung Galaxy Tab A9+ Plus 11" 64GB Android Tablet
- Price: $159.99
- Rating: 4.4/5

### Copywriting Strategy & Keyword Analysis
[Full analysis content...]

### Visual Asset Design Methodology
[Full analysis content...]

### Customer Review Analysis
[Full analysis content...]

### Market Positioning & Competitive Intelligence
[Full analysis content...]
```

## Configuration

### Google Sheets Setup (Optional)

If you want to export results to Google Sheets:

1. **Create Google Cloud Project**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable Google Sheets API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create OAuth2 Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Desktop app"
   - Download the JSON credentials file

4. **Configure Skill**
   - Copy the contents of the JSON file
   - Paste into `.env` as `GOOGLE_SHEETS_CREDENTIALS`
   - Add your Google Sheets ID as `GOOGLE_SHEETS_ID`

### Advanced Settings

Edit `platforms.yaml` for advanced configuration:

```yaml
settings:
  max_batch_size: 20        # Max products per batch
  concurrency_limit: 5      # Parallel processing
  scraping_timeout: 120000  # 2 minutes
  analysis_timeout: 60000   # 1 minute
```

## Project Structure

```
ecommerce-competitor-analyzer.skill/
├── SKILL.md                                # AI instruction manual
├── platforms.yaml                          # Platform configurations
├── .env.example                            # Configuration template
├── scripts/                                # Core scripts
│   ├── detect-platform.js                 # Platform detection
│   ├── scrape-amazon.js                   # Amazon scraper
│   └── batch-processor.js                 # Batch processing engine
├── prompts/                                # AI prompt templates
│   ├── analysis-prompt-base.md            # Base analysis framework
│   ├── analysis-prompt-amazon.md          # Amazon-specific prompts
│   └── analysis-prompt-cross-platform.md  # Cross-platform comparison
└── references/                             # Documentation
    ├── n8n-workflow-analysis.md           # n8n workflow insights
    └── platform-differences.md            # Platform comparison
```

## API Key Setup Guide

### 1. Olostep API

1. Visit [https://olostep.com/](https://olostep.com/)
2. Sign up for a free account
3. Navigate to Dashboard > API Keys
4. Copy your API key
5. Add to `.env`: `OLOSTEP_API_KEY=your_key_here`

**Pricing**: 1000 free requests/month, then $0.002/request

### 2. Google Gemini API

1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Add to `.env`: `GEMINI_API_KEY=your_key_here`

**Pricing**: ~$0.001/product analysis

### 3. Google Sheets API (Optional)

See "Google Sheets Setup" section above.

## Troubleshooting

### Issue: "Olostep API key not found"

**Solution**: Make sure you've created `.env` file from `.env.example` and added your API key.

### Issue: "Google Sheets authentication failed"

**Solution**: Ensure `GOOGLE_SHEETS_CREDENTIALS` in `.env` contains valid JSON (single line).

### Issue: "Batch processing timeout"

**Solution**: Increase `SCRAPER_TIMEOUT` in `.env` or reduce batch size.

### Issue: "Some products failed but others succeeded"

**Solution**: This is expected behavior. The skill uses error isolation - single failures don't stop the batch. Check the output report for failed items.

## Development

### Running Tests

```bash
# Test platform detection
node scripts/detect-platform.js https://amazon.com/dp/B0C4YT8S6H

# Test scraper
node scripts/scrape-amazon.js B0C4YT8S6H
```

### Adding New Platforms

1. Add platform config to `platforms.yaml`
2. Create scraper script in `scripts/`
3. Create analysis prompt in `prompts/`
4. Update `scripts/detect-platform.js`

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Areas for Contribution

- [ ] Add Temu platform support
- [ ] Add Shopee platform support
- [ ] Improve error handling
- [ ] Add more AI analysis dimensions
- [ ] Create Excel export format
- [ ] Add PDF report generation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built based on n8n workflow v81 logic
- Uses Olostep API for web scraping
- Uses Google Gemini API for AI analysis
- Inspired by [宝玉's Skills framework](https://github.com/op7418)

## Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/ecommerce-competitor-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/ecommerce-competitor-analyzer/discussions)

## Roadmap

- [x] Amazon platform support
- [ ] Temu platform support
- [ ] Shopee platform support
- [ ] Cross-platform comparison
- [ ] Historical price tracking
- [ ] Review sentiment visualization
- [ ] Competitor price alerts
- [ ] Automated daily analysis

---

<div align="center">

**Made with ❤️ for e-commerce professionals**

[⬆ Back to Top](#ecommerce-competitor-analyzer)

</div>
