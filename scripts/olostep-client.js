/**
 * Olostep API Client with v1/v2 Support
 * Supports both API versions for backward compatibility
 */

// API Endpoints
const API_ENDPOINTS = {
  v1: 'https://api.olostep.com/v1/scrapes',
  v2: 'https://api.olostep.com/v2/agent/web-agent'
};

/**
 * Scrape Amazon product using Olostep API
 * @param {string} asin - Amazon ASIN
 * @param {object} options - Options
 * @param {string} options.apiVersion - 'v1' or 'v2' (default: 'v2')
 * @param {string} options.apiKey - Olostep API key
 * @param {number} options.waitTime - Wait time for page load (v2 only)
 * @param {number} options.comments - Number of comments to scrape
 * @returns {Promise<object>} - Scraped data
 */
async function scrapeWithOlostep(asin, options = {}) {
  const {
    apiVersion = process.env.OLOSTEP_API_VERSION || 'v1',  // Default to v1 for compatibility
    apiKey = process.env.OLOSTEP_API_KEY,
    waitTime = 10,
    comments = 100,
    domain = 'amazon.com'
  } = options;

  const url = `https://www.${domain}/dp/${asin}`;

  // Choose endpoint based on version
  const endpoint = API_ENDPOINTS[apiVersion];
  if (!endpoint) {
    throw new Error(`Invalid API version: ${apiVersion}. Use 'v1' or 'v2'`);
  }

  console.log(`📡 Using Olostep API ${apiVersion}`);

  try {
    if (apiVersion === 'v1') {
      return await scrapeV1(endpoint, url, apiKey, comments);
    } else {
      return await scrapeV2(endpoint, url, apiKey, waitTime, comments);
    }
  } catch (error) {
    console.error(`❌ Olostep API ${apiVersion} error:`, error.message);

    // Auto-fallback: if v2 fails, try v1
    if (apiVersion === 'v2' && options.autoFallback !== false) {
      console.warn('⚠️  v2 failed, attempting fallback to v1...');
      return await scrapeV1(API_ENDPOINTS.v1, url, apiKey, comments);
    }

    throw error;
  }
}

/**
 * Scrape using v1 API
 */
async function scrapeV1(endpoint, url, apiKey, comments) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      extract: {
        title: true,
        bullet_points: true,
        price: true,
        rating: true,
        reviews: {
          max: comments,
          sort: "recent"
        },
        images: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Olostep v1 error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Convert v1 response to standard format
  return {
    success: true,
    apiVersion: 'v1',
    markdownContent: convertV1ToMarkdown(data),
    rawData: data
  };
}

/**
 * Scrape using v2 API
 */
async function scrapeV2(endpoint, url, apiKey, waitTime, comments) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      wait_time: waitTime,
      screenshot: false,
      extract_dynamic_content: true,
      comments_number: comments
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Olostep v2 error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Return v2 response
  return {
    success: true,
    apiVersion: 'v2',
    markdownContent: data.markdown_content || data.html_content || '',
    rawData: data
  };
}

/**
 * Convert v1 response data to markdown format
 */
function convertV1ToMarkdown(data) {
  let markdown = '';

  if (data.data) {
    if (data.data.title) {
      markdown += `# ${data.data.title}\n\n`;
    }

    if (data.data.price) {
      const priceStr = typeof data.data.price === 'object'
        ? JSON.stringify(data.data.price)
        : String(data.data.price);
      markdown += `**Price:** ${priceStr}\n\n`;
    }

    if (data.data.rating) {
      const ratingStr = typeof data.data.rating === 'object'
        ? JSON.stringify(data.data.rating)
        : String(data.data.rating);
      markdown += `**Rating:** ${ratingStr}\n\n`;
    }

    if (data.data.bullet_points && Array.isArray(data.data.bullet_points)) {
      markdown += `**Bullet Points:**\n`;
      data.data.bullet_points.forEach(point => {
        markdown += `- ${point}\n`;
      });
      markdown += '\n';
    }

    if (data.data.reviews && Array.isArray(data.data.reviews)) {
      markdown += `**Reviews (${data.data.reviews.length}):\n\n`;
      data.data.reviews.slice(0, 20).forEach((review, i) => {
        markdown += `### Review ${i + 1}\n`;
        markdown += `- **Rating:** ${review.rating || 'N/A'}\n`;
        if (review.title) markdown += `- **Title:** ${review.title}\n`;
        if (review.body) markdown += `- **Body:** ${review.body}\n`;
        markdown += '\n';
      });
    }
  }

  return markdown || '# No content available\n';
}

module.exports = {
  scrapeWithOlostep,
  API_ENDPOINTS
};
