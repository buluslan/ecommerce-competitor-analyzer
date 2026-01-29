// Test Olostep API key - using native fetch (Node 18+)

const API_KEY = 'fFYZWMPZlSzs3Un4zKKWvXw0qZlJ2BML9Qql';
const URL = 'https://www.amazon.com/dp/B08LNY11RK';

console.log('Testing Olostep API key...');
console.log('API Key:', API_KEY);
console.log('Target URL:', URL);
console.log('');

// Test v1 API (exact n8n format)
console.log('=== Test: v1 API (n8n format) ===');
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
  
  const text = await response.text();
  console.log('Response:', text.substring(0, 500));
  
  if (response.ok) {
    try {
      const data = JSON.parse(text);
      if (data.data && data.data.title) {
        console.log('✅ v1 API Works! Title:', data.data.title);
      } else {
        console.log('⚠️  v1 API responded but no title found');
        console.log('Data keys:', Object.keys(data));
      }
    } catch (e) {
      console.log('Response is not JSON');
    }
  } else {
    console.log('❌ v1 API Failed with status:', response.status);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
