#!/usr/bin/env node
/**
 * Test accuracy fix - verify that removing 'extract' parameter solves the 0% accuracy issue
 * Tests the same 3 ASINs that previously failed
 */

import { readFileSync } from 'fs';
import { scrapeWithOlostep } from './scripts/olostep-client.js';

// Load environment variables manually
function loadEnv() {
  try {
    const envContent = readFileSync('./.env', 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (e) {
    console.warn('Warning: Could not load .env file');
  }
}

loadEnv();

const TEST_ASINS = [
  { asin: 'B08D6T4DKS', expectedProduct: 'Rubbermaid' },
  { asin: 'B09SYYRBVP', expectedProduct: 'kelamayi' },
  { asin: 'B0FF4515N3', expectedProduct: 'AONEZ' }
];

async function testAccuracy() {
  console.log('🧪 Testing Accuracy Fix (without extract parameter)');
  console.log('='.repeat(60));
  console.log('');

  let correctCount = 0;
  let totalTests = TEST_ASINS.length;

  for (const { asin, expectedProduct } of TEST_ASINS) {
    console.log(`\n📦 Testing ASIN: ${asin}`);
    console.log(`   Expected to contain: "${expectedProduct}"`);
    console.log('   Working...');

    try {
      const result = await scrapeWithOlostep(asin, {
        apiVersion: 'v1',
        comments: 50
      });

      if (!result.success) {
        console.log(`   ❌ API call failed`);
        continue;
      }

      // Extract title from markdown
      const markdown = result.markdownContent;
      const titleMatch = markdown.match(/^(?:#\s*)?(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : 'No title found';

      // Check if expected product is in the response
      const isCorrect = markdown.toLowerCase().includes(expectedProduct.toLowerCase()) ||
                       title.toLowerCase().includes(expectedProduct.toLowerCase());

      console.log(`   📌 Title: ${title.substring(0, 80)}...`);

      if (isCorrect) {
        console.log(`   ✅ CORRECT - Contains "${expectedProduct}"`);
        correctCount++;
      } else {
        console.log(`   ❌ WRONG - Does not contain "${expectedProduct}"`);
        console.log(`   First 200 chars: ${markdown.substring(0, 200)}...`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS:');
  console.log(`   Accuracy: ${correctCount}/${totalTests} (${Math.round(correctCount/totalTests*100)}%)`);
  console.log('='.repeat(60));

  if (correctCount === totalTests) {
    console.log('✅ All tests passed! The fix is working.');
  } else {
    console.log('⚠️  Some tests still failing. Further investigation needed.');
  }
}

testAccuracy().catch(console.error);
