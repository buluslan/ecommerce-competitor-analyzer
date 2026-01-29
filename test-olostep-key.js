// Test Olostep API key - exact n8n format
const fetch = require('node-fetch');

const API_KEY = 'fFYZWMPZlSzs3Un4zKKWvXw0qZlJ2BML9Qql';
const URL = 'https://www.amazon.com/dp/B08LNY11RK';

console.log('Testing Olostep API key...');
console.log('API Key:', API_KEY);
console.log('Target URL:', URL);
console.log('');

// Test 1: v1 API (exact n8n format)
console.log('=== Test 1: v1 API (n8n format) ===');
try {
  const response = await fetch('https://api.olostep.com/v1/scrapes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: URL
    })
  });

  console.log('Status:', response.status);
  
  const data = await response.text();
  console.log('Response (first 500 chars):', data.substring(0, 500));
  
  if (response.ok) {
    console.log('✅ v1 API Works!');
  } else {
    console.log('❌ v1 API Failed');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('');
console.log('=== Test 2: v2 API ===');
try {
  const response = await fetch('https://api.olostep.com/v2/agent/web-agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: URL,
      wait_time: 10,
      screenshot: false,
      extract_dynamic_content: true
    })
  });

  console.log('Status:', response.status);
  
  const data = await response.text();
  console.log('Response (first 500 chars):', data.substring(0, 500));
  
  if (response.ok) {
    console.log('✅ v2 API Works!');
  } else {
    console.log('❌ v2 API Failed');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
