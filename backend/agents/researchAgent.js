/**
 * Research Agent — STEP 2 of the Heavy Run/Refill Loop.
 * Uses: Qwen qwen3.6-plus for deep empirical and vector research context harvesting.
 * Upgraded with High-Volume Data Condensing Engines and Massive Context Compression Layers.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { groqGenerate, groqEmbed } = require("./clients/qwenClient");
const { getLocationByCity } = require("../config/locations");
const { tavilySearch } = require("./clients/tavilyClient");
const { fetchSocialSignals } = require("./clients/apifyClient");
const mongoose = require("mongoose");

const ChatIntelligence = mongoose.models.ChatIntelligence || mongoose.model("ChatIntelligence", new mongoose.Schema({
  source: String,
  conversationId: String,
  userRawPrompt: String,
  assistantResponse: String,
  embedding: [Number]
}), "conversation_intelligence");

/**
 * Text preprocessing and structural condensing utility.
 * Sanitizes and compresses high-volume web payloads to prevent context window dilution.
 */
function condenseContentStream(textArray, maxLengthPerItem = 400) {
  if (!Array.isArray(textArray)) return "";
  return textArray
    .map(text => {
      if (!text) return "";
      // Strip URLs, heavy tracking codes, excessive white spacing, and symbols
      let clean = text.replace(/https?:\/\/\S+/g, "")
                      .replace(/\s+/g, " ")
                      .trim();
      return clean.length > maxLengthPerItem ? clean.substring(0, maxLengthPerItem) + "..." : clean;
    })
    .filter(text => text.length > 15)
    .slice(0, 35) // Enforce an upper item processing index limit
    .join(" \n• ");
}

async function researchAgent(personaProfile, businessContext, locationContext) {
  const targetLocation = locationContext?.city || businessContext?.targetLocation || "Kolkata";
  const locationData = typeof getLocationByCity === "function" ? getLocationByCity(targetLocation) : null;
  
  let empiricalContextString = "No matching real-world interaction logs found in local index cache.";
  
  try {
    if (process.env.QWEN_API_KEY) {
      const vectorSearchSearchQuery = `${personaProfile.buyerPersona || "Accounting student"} ${targetLocation} career path anxiety, tally core learning gaps, gst billing struggles`;
      const runtimeQueryVector = await groqEmbed(vectorSearchSearchQuery, {
        model: process.env.QWEN_EMBEDDING_MODEL || "textembedding-gecko-001"
      });
      
      if (runtimeQueryVector && runtimeQueryVector.length > 0) {
        const matchingDialogues = await ChatIntelligence.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: runtimeQueryVector,
              numCandidates: 15,
              limit: 4
            }
          },
          {
            $project: {
              source: 1,
              userRawPrompt: 1,
              assistantResponse: 1,
              score: { $meta: "vectorSearchScore" }
            }
          }
        ]);
        
        if (matchingDialogues && matchingDialogues.length > 0) {
          empiricalContextString = matchingDialogues.map((dialogue, index) => 
            `[Log Structure Entry #${index + 1} | Source Channel: ${dialogue.source}]\nRaw Human Search Intent: ${dialogue.userRawPrompt}\nExpert AI Response Baseline: ${dialogue.assistantResponse.substring(0, 250)}...`
          ).join("\n\n");
        }
      }
    }
  } catch (vectorSearchError) {
    console.error("Runtime Context Vector Search processing bypassed:", vectorSearchError.message);
  }

  // --- LIVE WEB INTELLIGENCE INGESTION ENGINE ---
  let liveWebContextString = "No secondary real-time web results fetched.";
  let liveSocialContextString = "No external social channel signals collected.";

  try {
    const deepQueryString = `practical accounting training tally gst placement concerns freshers ${targetLocation}`;
    console.log(`🌐 Deploying Advanced Tavily Deep Search Layer for: "${deepQueryString}"`);
    
    // Upgraded maxResults from 4 to 15 for widespread network discovery
    const webItems = await tavilySearch(deepQueryString, { searchDepth: "advanced", maxResults: 15, includeRawContent: true });
    
    if (webItems && webItems.length > 0) {
      liveWebContextString = webItems.map((item, idx) => {
        const primaryBody = item.raw_content || item.content || "";
        return `[Live Source #${idx + 1}]: ${item.title}\nURL: ${item.url}\nSummary content: ${primaryBody.substring(0, 600)}...`;
      }).join("\n\n");
    }

    console.log("📡 Harvesting Scaled Social Media Signals via Upgraded Apify Integration Pipeline...");
    const socialSignals = await fetchSocialSignals("accounting training job", targetLocation);
    
    // Process heavy textual streams through the structural condenser matrix
    const condensedFB = condenseContentStream(socialSignals.facebook);
    const condensedIGPosts = condenseContentStream(socialSignals.instagramPosts);
    const condensedIGHash = condenseContentStream(socialSignals.instagramHashtags);
    const condensedLI = condenseContentStream(socialSignals.linkedin);

    liveSocialContextString = [
      `[Facebook Public Data Stream Logs]:\n• ${condensedFB || "None found"}`,
      `[Instagram Organic Post Copies & Top Comments]:\n• ${condensedIGPosts || "None found"}`,
      `[Instagram Hashtag Context Clusters]:\n• ${condensedIGHash || "None found"}`,
      `[LinkedIn Professional Feeds]:\n• ${condensedLI || "None found"}`
    ].join("\n\n");

  } catch (deepIntelligenceErr) {
    console.error("⚠️ Deep multi-channel live research harvest bypassed:", deepIntelligenceErr.message);
  }

  const researchSystemPrompt = `You are a behavioral research intelligence system for the Indian Accounting & Finance Education market. You understand WHY users search, not just WHAT they search. Focus on emotional intent, career anxiety, and location-specific patterns. Gather insight angles matching: Google, LinkedIn, Reddit, and accounting forums. Combine vector historical records with real-time web insights and scraped social data streams to optimize context validation.`;

  const researchUserPrompt = `Perform deep behavioral research for this specific audience and location.
  
=== EMPIRICAL CONVERSATIONAL DATA REFERENCE LOGS ===
${empiricalContextString}

=== REAL-TIME ADVANCED TAVILY DEEP WEB SEARCH CONTEXT ===
${liveWebContextString}

=== APIFY DEEP SOCIAL INSIGHT SIGNALS (FB, IG, LINKEDIN) ===
${liveSocialContextString}

=== AUDIENCE ===
Reader: ${personaProfile.buyerPersona || "Accounting Student"}
Category: ${businessContext?.audienceCategory || "College-Level Commerce Student"}
Identity Belief: ${personaProfile.identityBelief || "Not specified"}
Hidden Fears: ${(personaProfile.hiddenFears || []).join(", ")}
Pain Points: ${(personaProfile.painPoints || []).join("; ")}
Live Situations: ${(personaProfile.liveSituations || []).join("; ")}
Location: ${targetLocation}

=== LOCATION CONTEXT ===
City: ${targetLocation}
Economy: ${locationData?.economicProfile || "Tier-1/Tier-2 High Concentration Regional Economy"}
Education Hub: ${locationData?.educationHub || "Major commerce and operational hub"}
Local Search Patterns: ${(locationData?.searchBehavior || ["accounting placement requirements", "tally courses near me"]).join("; ")}
Local Pain Points: ${(locationData?.studentPainPoints || ["unpaid articleships", "lack of real company billing data"]).join("; ")}

Respond in this EXACT format:
[BEGIN RESEARCH]
SEARCH INTENT ANALYSIS: (8 search queries with the emotional WHY behind each; semicolon-separated)
EMOTIONAL SEARCH DRIVERS: (8 emotional drivers behind their searches; semicolon-separated)
CAREER ANXIETY PATTERNS: (6 specific career anxiety patterns in ${targetLocation}; semicolon-separated)
LOCATION SEARCH PATTERNS: (6 ${targetLocation}-specific search behaviors; semicolon-separated)
PLATFORM TRUST_MAP: (8 platforms they trust in ${targetLocation} and why; comma-separated)
TRENDING TOPICS: (8 trending accounting education topics; comma-separated)
CONTENT FORMATS PREFERRED: (5 content formats they prefer; comma-separated)
EMOTIONAL TRANSFORMATION PSYCHOLOGY: (5-6 sentences on the deep emotional transformation they desperately seek)
[END_RESEARCH]`;

  let researchResult = "";
  try {
    researchResult = await groqGenerate(researchSystemPrompt, researchUserPrompt, {
      model: "qwen3.6-plus",
      temperature: 0.8,
      maxTokens: 4000
    });
  } catch (err) {
    console.error("Research Agent Qwen Phase 1 failed:", err.message);
  }

  const analysisSystemPrompt = `You are an analytical research intelligence engine for accounting education. Provide structured, data-driven insights focusing on SEO opportunities, context, keyword gaps, and competitive structural gaps.`;
  
  const analysisUserPrompt = `Provide structured analytical research insights for accounting education content targeting ${businessContext?.audienceCategory || "students"} in ${targetLocation}.
  
=== QWEN BROAD RESEARCH RESUME ===
${researchResult.substring(0, 1500)}

Respond in this EXACT format:
[BEGIN ANALYSIS]
HIGH VALUE KEYWORDS: (6 SEO keywords for ${targetLocation} accounting audience; comma-separated)
AI SEARCH QUERIES: (4 conversational questions they ask ChatGPT/Perplexity; comma-separated)
SEO GAPS: (3 keyword/content gaps that competitors miss; comma-separated)
SEARCH INTENT CLUSTERS: (3 clusters of related search intents; semicolon-separated)
TRUST SIGNALS_NEEDED: (4 trust signals this audience needs to see; comma-separated)
CONTENT_OPPORTUNITY_SCORE: (Provide an integer from 1 to 100)
COMPETITIVE_CONTENT_GAPS: (3 content topics competitors don't cover well; comma-separated)
BEHAVIORAL_PATTERNS: (3 platform-specific behaviors; comma-separated)
[END_ANALYSIS]`;

  let analysisResult = "";
  try {
    analysisResult = await groqGenerate(analysisSystemPrompt, analysisUserPrompt, {
      model: "qwen3.6-plus",
      temperature: 0.5,
      maxTokens: 3000
    });
  } catch (err) {
    console.error("Research Agent Qwen Phase 2 failed:", err.message);
  }

  const researchBlock = extractBlock(researchResult, "[BEGIN RESEARCH]", "[END_RESEARCH]") || researchResult;
  const analysisBlock = extractBlock(analysisResult, "[BEGIN ANALYSIS]", "[END_ANALYSIS]") || analysisResult;

  const result = {
    searchIntentAnalysis: extractField(researchBlock, "SEARCH INTENT ANALYSIS"),
    emotionalSearchPatterns: extractListSemicolon(researchBlock, "EMOTIONAL SEARCH DRIVERS"),
    careerAnxietyPatterns: extractListSemicolon(researchBlock, "CAREER ANXIETY PATTERNS"),
    locationSearchPatterns: extractListSemicolon(researchBlock, "LOCATION SEARCH PATTERNS"),
    platformTrustMap: extractListComma(researchBlock, "PLATFORM TRUST_MAP"),
    trendInsights: extractListComma(researchBlock, "TRENDING TOPICS"),
    contentPreference: extractListComma(researchBlock, "CONTENT FORMATS PREFERRED"),
    transformationPsychology: extractField(researchBlock, "EMOTIONAL TRANSFORMATION PSYCHOLOGY"),
    keywords: extractListComma(analysisBlock, "HIGH VALUE KEYWORDS"),
    aiSearchQueries: extractListComma(analysisBlock, "AI SEARCH QUERIES"),
    seoGaps: extractListComma(analysisBlock, "SEO GAPS"),
    searchIntentClusters: extractListSemicolon(analysisBlock, "SEARCH INTENT CLUSTERS"),
    trustSignals: extractListComma(analysisBlock, "TRUST SIGNALS_NEEDED"),
    contentOpportunityScore: parseInt(extractField(analysisBlock, "CONTENT_OPPORTUNITY_SCORE")) || 75,
    competitiveContentGaps: extractListComma(analysisBlock, "COMPETITIVE_CONTENT_GAPS"),
    behavioralPatterns: extractListComma(analysisBlock, "BEHAVIORAL_PATTERNS"),
    rawLiveSocialContext: liveSocialContextString, // Forwarding deep data directly into downstream consumers
    targetLocation
  };

  if (result.keywords.length === 0) {
    result.keywords = [`accounting course ${targetLocation}`, "practical accounting training", "Tally ERP GST course", "accounting job freshers"];
    result.aiSearchQueries = ["Is Tally certification enough to get a corporate placement?", "How to pass accounting interviews without real experience?"];
    result.emotionalSearchPatterns = ["Fear of operational failure during office trials", "Anxiety over degree devaluation without skills"];
    result.trustSignals = ["Live internal dashboard screenshots", "Local hiring partner verification records"];
  }

  return result;
}

function extractBlock(text, start, end) {
  if (!text) return null;
  const s = text.indexOf(start);
  const e = text.indexOf(end, s + start.length);
  if (s === -1 || e === -1) return null;
  return text.substring(s + start.length, e).trim();
}

function extractField(block, key) {
  if (!block) return "";
  const match = block.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_\\s]+:|$)`, "i"));
  return match ? match[1].trim() : "";
}

function extractListComma(block, key) {
  const val = extractField(block, key);
  return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
}

function extractListSemicolon(block, key) {
  const val = extractField(block, key);
  return val ? val.split(";").map(s => s.trim()).filter(Boolean) : [];
}

module.exports = researchAgent;