/**
 * Apify Automation API Client — Social Engine.
 * Integrates targeted public social media platforms within free-tier compute ceilings.
 * Upgraded to utilize native proxy rotation and high-yield keyword clustering.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const { ApifyClient } = require("apify-client");

async function runApifyActor(actorId, input) {
  const token = process.env.APIFY_API_KEY || process.env.APIFY_TOKEN;
  if (!token) {
    console.warn(`⚠️ Apify Client Alert: Token missing. Bypassing actor execution [${actorId}].`);
    return [];
  }

  try {
    const client = new ApifyClient({ token });

    // Inject automatic proxy configuration to bypass datacenter IP blocks
    const optimizedInput = {
      ...input,
      proxyConfiguration: {
        useApifyProxy: true,
        groups: ["SHADER"] // Uses Apify's standard proxy pool
      }
    };

    const run = await client.actor(actorId).call(optimizedInput);

    if (!run || !run.defaultDatasetId) {
      console.warn(`⚠️ Apify Client Alert: No default dataset ID returned for actor [${actorId}].`);
      return [];
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items;
  } catch (error) {
    console.error(`❌ Apify Client Exception on Actor [${actorId}]:`, error.message);
    return [];
  }
}

/**
 * Orchestrates multi-channel extraction loops.
 */
async function fetchSocialSignals(keywordContext, targetLocation) {
  const aggregatedSignals = {
    facebook: [],
    instagramPosts: [],
    instagramHashtags: [],
    linkedin: []
  };

  const searchQuery = `${keywordContext} ${targetLocation}`;

  // Generate an array of broad, high-volume hashtags to avoid empty 0-result pages
  const baselineTags = ["accounting", "tally", "gst", "jobsearch", "freshersjobs"];
  const dynamicTags = keywordContext
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, ""))
    .filter(word => word.length > 2);
  
  // Merge and deduplicate target hashtags, taking the top 3 relevant ones
  const targetedHashtags = [...new Set([...dynamicTags, ...baselineTags])].slice(0, 3);

  try {
    console.log(`🤖 Initializing Apify Social Signal Scrapes for query: "${searchQuery}"`);

    // 1. Facebook Posts Scraper — Routed through proxy layer to bypass Cheerio blocks
    const fbResults = await runApifyActor("apify/facebook-posts-scraper", {
      startUrls: [{ url: `https://www.facebook.com/search/posts/?q=${encodeURIComponent(searchQuery)}` }],
      resultsLimit: 40,
      commentsLimit: 5
    });
    aggregatedSignals.facebook = fbResults.map(p => {
      const rawText = p.text || p.message || "";
      const commentsText = Array.isArray(p.comments) ? p.comments.map(c => c.text).join(" | ") : "";
      return commentsText ? `${rawText} [User Comments: ${commentsText}]` : rawText;
    }).filter(Boolean);

    // 2. Instagram Scraper — Fed with broad industry hashtag entry points
    const igUrls = targetedHashtags.map(tag => `https://www.instagram.com/explore/tags/${tag}/`);
    const igResults = await runApifyActor("apify/instagram-scraper", {
      directUrls: igUrls,
      resultsLimit: 40,
      maxPosts: 40,
      scrapeComments: true,
      commentsLimit: 3
    });
    aggregatedSignals.instagramPosts = igResults.map(p => {
      const caption = p.caption || "";
      const topComments = Array.isArray(p.latestComments) ? p.latestComments.map(c => c.text).join(" | ") : "";
      return topComments ? `${caption} [Comments: ${topComments}]` : caption;
    }).filter(Boolean);

    // 3. Instagram Hashtag Scraper
    const igHashResults = await runApifyActor("apify/instagram-hashtag-scraper", {
      hashtags: targetedHashtags,
      resultsLimit: 40
    });
    aggregatedSignals.instagramHashtags = igHashResults.map(h => h.caption || "").filter(Boolean);

    // 4. LinkedIn Post Scraper — (Fully functional configuration preserved)
    const liResults = await runApifyActor("supreme_coder/linkedin-post", {
      urls: [`https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(searchQuery)}`],
      count: 40
    });
    aggregatedSignals.linkedin = liResults.map(l => l.text || l.postContent || "").filter(Boolean);

  } catch (globalApifyErr) {
    console.error("⚠️ Global Apify extraction pipeline interrupted gracefully:", globalApifyErr.message);
  }

  return aggregatedSignals;
}

module.exports = { runApifyActor, fetchSocialSignals };