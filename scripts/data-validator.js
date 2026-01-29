/**
 * Data Validation Module
 * Validates scraped Amazon product data for accuracy
 */

/**
 * Validate that scraped product data matches expected ASIN
 * @param {string} asin - Expected ASIN
 * @param {object} scrapedData - Scraped product data
 * @returns {object} - Validation result
 */
function validateProductData(asin, scrapedData) {
  const issues = [];
  const warnings = [];

  // Check 1: Basic data existence
  if (!scrapedData.title) {
    issues.push('Missing product title');
  }

  if (!scrapedData.price && !scrapedData.priceString) {
    warnings.push('Missing price data');
  }

  if (!scrapedData.rating) {
    warnings.push('Missing rating data');
  }

  // Check 2: Title length sanity check
  if (scrapedData.title) {
    if (scrapedData.title.length < 10) {
      issues.push(`Title too short: "${scrapedData.title}" (likely wrong data)`);
    }
    if (scrapedData.title.length > 500) {
      warnings.push('Title unusually long, may include extra content');
    }
  }

  // Check 3: ASIN consistency (if ASIN appears in title or URL)
  if (scrapedData.title) {
    // Extract ASINs from title (Amazon sometimes includes ASIN in title)
    const asinPattern = /[A-Z0-9]{10}/g;
    const foundAsins = scrapedData.title.match(asinPattern);

    if (foundAsins && foundAsins.length > 0) {
      const matchingAsin = foundAsins.find(a => a === asin);
      if (!matchingAsin) {
        issues.push(`ASIN mismatch: expected ${asin}, found ${foundAsins[0]} in title`);
      }
    }
  }

  // Check 4: Sanity check for common wrong data patterns
  if (scrapedData.title) {
    const titleLower = scrapedData.title.toLowerCase();

    // Check if title contains unexpected product types
    const unexpectedPatterns = [
      'sponsored',  // Ad content
      'advertisement',  // Ad content
      'recommended',  // Recommendation section
    ];

    for (const pattern of unexpectedPatterns) {
      if (titleLower.includes(pattern)) {
        issues.push(`Title contains "${pattern}" - likely not main product`);
      }
    }
  }

  // Check 5: Price sanity check
  if (scrapedData.price) {
    const price = parseFloat(scrapedData.price);
    if (price < 0.01) {
      issues.push(`Price too low: $${price}`);
    }
    if (price > 100000) {
      warnings.push(`Price unusually high: $${price}`);
    }
  }

  // Check 6: Rating sanity check
  if (scrapedData.rating) {
    const rating = parseFloat(scrapedData.rating);
    if (rating < 1 || rating > 5) {
      issues.push(`Invalid rating: ${rating} (must be 1-5)`);
    }
  }

  // Overall validation result
  const isValid = issues.length === 0;

  return {
    isValid,
    issues,
    warnings,
    summary: isValid
      ? '✅ Validation passed'
      : `❌ Validation failed: ${issues.length} issue(s), ${warnings.length} warning(s)`
  };
}

/**
 * Enhanced validation with known product categories
 * @param {string} asin - Expected ASIN
 * @param {object} scrapedData - Scraped product data
 * @param {string} expectedCategory - Expected product category (optional)
 * @returns {object} - Validation result
 */
function validateWithCategory(asin, scrapedData, expectedCategory = null) {
  const baseValidation = validateProductData(asin, scrapedData);

  // Additional category-based validation
  if (expectedCategory && scrapedData.title) {
    const titleLower = scrapedData.title.toLowerCase();
    const expectedLower = expectedCategory.toLowerCase();

    // Check if expected category appears in title
    if (!titleLower.includes(expectedLower)) {
      baseValidation.warnings.push(
        `Expected category "${expectedCategory}" not found in title`
      );
    }
  }

  return baseValidation;
}

/**
 * Cross-validate two data sources
 * @param {object} source1 - First data source
 * @param {object} source2 - Second data source
 * @returns {object} - Comparison result
 */
function crossValidateSources(source1, source2) {
  const differences = [];

  // Compare titles
  if (source1.title && source2.title) {
    const similarity = calculateStringSimilarity(source1.title, source2.title);
    if (similarity < 0.5) {
      differences.push({
        field: 'title',
        source1: source1.title.substring(0, 100),
        source2: source2.title.substring(0, 100),
        similarity
      });
    }
  }

  // Compare prices
  if (source1.price && source2.price) {
    const price1 = parseFloat(String(source1.price).replace(/[^0-9.]/g, ''));
    const price2 = parseFloat(String(source2.price).replace(/[^0-9.]/g, ''));

    if (Math.abs(price1 - price2) / Math.max(price1, price2) > 0.3) {
      differences.push({
        field: 'price',
        source1: price1,
        source2: price2,
        difference: Math.abs(price1 - price2) / Math.max(price1, price2)
      });
    }
  }

  return {
    isConsistent: differences.length === 0,
    differences,
    summary: differences.length === 0
      ? '✅ Sources are consistent'
      : `⚠️ Found ${differences.length} difference(s)`
  };
}

/**
 * Calculate string similarity (simple implementation)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

module.exports = {
  validateProductData,
  validateWithCategory,
  crossValidateSources,
  calculateStringSimilarity
};
