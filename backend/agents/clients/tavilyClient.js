/**
 * Tavily Search API Client — Advanced/Deep Intelligence Layer.
 * Connects directly to Tavily infrastructure to extract live context.
 * Upgraded to return deep market arrays and extensive competitor node lookups.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

async function tavilySearch(query, options = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Tavily Client Alert: TAVILY_API_KEY is missing. Returning empty array.");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: options.searchDepth || "advanced",
        include_answer: options.includeAnswer !== undefined ? options.includeAnswer : true,
        include_raw_content: options.includeRawContent !== undefined ? options.includeRawContent : true,
        max_results: options.maxResults || 15
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("❌ Tavily Search Client Execution Failure:", error.message);
    return [];
  }
}

module.exports = { tavilySearch };