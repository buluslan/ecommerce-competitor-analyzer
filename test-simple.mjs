const API_KEY = 'olostep_R9xHjqtZqE3Yskv4B1CAzccfgr6XuFTXYCJg';
const ASIN = 'B08D6T4DKS';
const URL = `https://www.amazon.com/dp/${ASIN}`;

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

const data = await response.json();
console.log('Title extracted from markdown:');
const titleMatch = data.result.markdown_content.match(/^(.+?)\n/);
console.log(titleMatch ? titleMatch[1] : 'No title found');
console.log('');
console.log('First 1000 chars of markdown:');
console.log(data.result.markdown_content.substring(0, 1000));
