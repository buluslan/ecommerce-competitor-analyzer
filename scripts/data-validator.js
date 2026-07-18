/**
 * Validate the minimum product data needed by the analysis workflow.
 *
 * The test runner imports this module before it makes any network calls. Keep
 * validation deterministic so incomplete scrape results fail with actionable
 * messages instead of reaching the analysis step.
 */

function isPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (!isPresent(value)) {
    return null;
  }

  const normalized = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateProductData(asin, productData = {}) {
  const issues = [];
  const warnings = [];

  if (!/^[A-Z0-9]{10}$/i.test(asin || '')) {
    issues.push('ASIN must contain 10 letters or digits');
  }

  if (!isPresent(productData.title) || /^unknown title$/i.test(productData.title.trim())) {
    issues.push('Product title is missing');
  }

  const price = parseNumber(productData.price);
  if (productData.price == null || productData.price === '') {
    warnings.push('Product price is missing');
  } else if (price == null || price <= 0) {
    issues.push('Product price must be a positive number');
  }

  const rating = parseNumber(productData.rating);
  if (productData.rating == null || productData.rating === '') {
    warnings.push('Product rating is missing');
  } else if (rating == null || rating < 0 || rating > 5) {
    issues.push('Product rating must be between 0 and 5');
  }

  const isValid = issues.length === 0;
  const summary = isValid
    ? `Validation passed with ${warnings.length} warning(s)`
    : `Validation failed with ${issues.length} issue(s)`;

  return { isValid, issues, warnings, summary };
}

module.exports = { validateProductData };
