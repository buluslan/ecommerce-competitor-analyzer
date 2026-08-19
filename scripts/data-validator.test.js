const assert = require('node:assert/strict');
const test = require('node:test');

const { validateProductData } = require('./data-validator.js');

test('accepts complete product data', () => {
  const result = validateProductData('B0C4YT8S6H', {
    title: 'Example product',
    price: '$159.99',
    rating: '4.4/5'
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.warnings, []);
});

test('keeps missing optional commerce fields as warnings', () => {
  const result = validateProductData('B0C4YT8S6H', {
    title: 'Example product',
    price: null,
    rating: null
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.warnings, [
    'Product price is missing',
    'Product rating is missing'
  ]);
});

test('rejects malformed required fields and impossible values', () => {
  const result = validateProductData('bad', {
    title: 'Unknown Title',
    price: '-1',
    rating: '8.1'
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.issues, [
    'ASIN must contain 10 letters or digits',
    'Product title is missing',
    'Product price must be a positive number',
    'Product rating must be between 0 and 5'
  ]);
});
