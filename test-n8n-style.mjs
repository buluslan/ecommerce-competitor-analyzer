/**
 * Test simplified Olostep API call (without extract parameter)
 * This matches n8n's exact configuration
 */

const API_KEY = 'olostep_R9xHjqtZqE3Yskv4B1CAzccfgr6XuFTXYCJg';
const ASIN = 'B08D6T4DKS';
const URL = `https://www.amazon.com/dp/${ASIN}`;

console.log('Testing Olostep API WITHOUT extract parameter (n8n style)...');
console.log('ASIN:', ASIN);
console.log('');

// Test 1: Simplified call (n8n style)
console.log('=== Test: Simplified (n8n style) ===');
try {
  const response = await fetch('https://api.olostep.com/v1/scrapes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: URL
      // NO extract parameter - let Olostep auto-detect
    })
  });

  console.log('Status:', response.status);

  const text = await response.text();

  if (response.ok) {
    try {
      const data = JSON.parse(text);
      console.log('Response structure:', Object.keys(data));

      if (data.data && data.data.title) {
        console.log('✅ Success! Title:', data.data.title);
      } else if (data.result) {
        console.log('✅ Success! Result keys:', Object.keys(data.result));
      } else {
        console.log('Response keys:', Object.keys(data));
        console.log('Full data (first 1000 chars):', text.substring(0, 1000));
      }
    } catch (e) {
      console.log('Response (first 1000 chars):', text.substring(0, 1000));
    }
  } else {
    console.log('❌ Failed:', text.substring(0, 500));
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('');

// Test 2: With extract parameter (our current implementation)
console.log('=== Test: WITH extract parameter (our code) ===');
try {
  const response = await fetch('https://api.olostep.com/v1/scrapes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: URL,
      extract: {
        title: true,
        bullet_points: true,
        price: true,
        rating: true,
        reviews: { max: 100, sort: "recent" },
        images: true
      }
    })
  });

  console.log('Status:', response.status);

  const text = await response.text();

  if (response.ok) {
    try {
      const data = JSON.parse(text);
      console.log('Response structure:', Object.keys(data));

      if (data.data && data.data.title) {
        console.log('✅ Success! Title:', data.data.title);
      } else {
        console.log('Response keys:', Object.keys(data));
        console.log('Full data (first 500 chars):', text.substring(0, 500));
      }
    } catch (e) {
      console.log('Response (first 500 chars):', text.substring(0, 500));
    }
  } else {
    console.log('❌ Failed:', text.substring(0, 500));
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
