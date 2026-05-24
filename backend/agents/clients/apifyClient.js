/**
 * Apify Automation API Client — Social Engine.
 * Integrates targeted public social media platforms within free-tier compute ceilings.
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

    const optimizedInput = {
      ...input,
      proxyConfiguration: {
        useApifyProxy: true,
        groups: ["RESIDENTIAL"]
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
    facebookComments: [],
    instagramPosts: [],
    instagramHashtags: [],
    instagramComments: [],
    linkedin: []
  };

  const searchQuery = `${keywordContext} ${targetLocation}`;

  const baselineTags = [
    "accounting", "tally", "gst", "jobsearch", "freshersjobs", "finance", "placement"
  ];
  
  const dynamicTags = keywordContext
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/g, ""))
    .filter(word => word.length > 2);
  
  const targetedHashtags = [...new Set([...dynamicTags, ...baselineTags])].slice(0, 3);

  try {
    console.log(`🤖 Initializing Apify Social Signal Scrapes for query: "${searchQuery}"`);

    // =========================================================================
    // PHASE 1: INSTAGRAM DISCOVERY LOOP
    // =========================================================================
    
    const igHashResults = await runApifyActor("apify/instagram-hashtag-scraper", {
      hashtags: targetedHashtags,
      resultsLimit: 20
    });
    aggregatedSignals.instagramHashtags = igHashResults.map(h => h?.caption || h?.text || "").filter(Boolean);

    let harvestedUsernames = igHashResults
      .map(h => h?.ownerUsername || h?.user?.username || h?.author)
      .filter(Boolean);
    
    let harvestedPostUrls = igHashResults
      .map(h => {
        // Enforce lowercase conversion on shortcodes to steady the endpoint resolver
        const shortcode = h?.shortcode;
        return shortcode ? `https://www.instagram.com/p/${shortcode.toLowerCase()}/` : h?.url;
      })
      .filter(Boolean);

    if (harvestedUsernames.length === 0) {
      const locationSlug = targetLocation.toLowerCase().replace(/[^a-z0-9]/g, "");
      harvestedUsernames = [`accounting_${locationSlug}`, `jobs_${locationSlug}`];
    }
    
    harvestedUsernames = [...new Set(harvestedUsernames)].slice(0, 3);
    harvestedPostUrls = [...new Set(harvestedPostUrls)].slice(0, 2);

    // Instagram Post Scraper — Hardened against ceiling limits
    const igPostResults = await runApifyActor("apify/instagram-post-scraper", {
      username: harvestedUsernames,
      posts_count: 2,
      resultsLimit: 10, // Hard stop to keep the actor from running wild
      include_comments: false
    });
    aggregatedSignals.instagramPosts = igPostResults.map(p => p?.caption || p?.text || "").filter(Boolean);

    if (harvestedPostUrls.length > 0) {
      const igCommentResults = await runApifyActor("apify/instagram-comment-scraper", {
        directUrls: harvestedPostUrls,
        maxComments: 5,
        resultsLimit: 10
      });
      aggregatedSignals.instagramComments = igCommentResults.map(c => c?.text || c?.commentText || "").filter(Boolean);
    }

    // =========================================================================
    // PHASE 2: FACEBOOK PIPELINE (FIXED STRUCTURE)
    // =========================================================================

    // Fixed: startUrls converted to an Array of Objects to satisfy schema validation rules
    const fbGroupResults = await runApifyActor("apify/facebook-groups-scraper", {
      startUrls: [
        { url: `https://www.facebook.com/groups/search/groups/?q=${encodeURIComponent(targetLocation + " jobs")}` },
        { url: "https://www.facebook.com/groups/kolkatajobs/" }
      ],
      resultsLimit: 10,
      searchGroupKeyword: keywordContext,
      viewOption: "RECENT_ACTIVITY",
      crawlerType: "playwright",
      usePlaywright: true
    });
    
    let harvestedFbPostUrls = [];
    aggregatedSignals.facebook = fbGroupResults.map(g => {
      const postUrl = g?.url || g?.postUrl;
      if (postUrl) harvestedFbPostUrls.push({ url: postUrl }); // Pre-format for down-stream compatibility
      return g?.text || g?.postText || g?.message || "";
    }).filter(Boolean);

    if (harvestedFbPostUrls.length > 0) {
      const fbCommentResults = await runApifyActor("apify/facebook-comments-scraper", {
        startUrls: harvestedFbPostUrls.slice(0, 2),
        maxComments: 5,
        includeReplies: false
      });
      aggregatedSignals.facebookComments = fbCommentResults.map(c => c?.text || c?.commentText || "").filter(Boolean);
    }

    // =========================================================================
    // PHASE 3: LINKEDIN CONTENT HARVESTING
    // =========================================================================

    const liResults = await runApifyActor("harvestapi/linkedin-post-search", {
      keyword: searchQuery,
      limit: 20
    });
    aggregatedSignals.linkedin = liResults.map(l => l?.text || l?.postContent || l?.commentary || "").filter(Boolean);

  } catch (globalApifyErr) {
    console.error("⚠️ Global Apify extraction pipeline interrupted gracefully:", globalApifyErr.message);
  }

  return aggregatedSignals;
}

module.exports = { runApifyActor, fetchSocialSignals };