/**
 * Competitor Agent — STEP 3 of the Heavy Run/Refill Loop.
 * Uses: Qwen-Max (Deep Research Mode) for competitor gap mapping and intelligence isolation.
 * Upgraded with Tavily Search Capabilities and Ingesting High-Volume Social Sentiments for Deep Market Analysis.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const clients = require("./clients/clientRegistry");
const { PRIMARY_COMPETITORS, getCompetitorContext } = require("../config/competitors");

async function competitorAgent(competitorWebsites, personaProfile, researchData) {
  const allCompetitors = typeof getCompetitorContext === "function" ? getCompetitorContext() : "Generic Local Accounting Institutes, Video Tutorial Channels";
  const targetLocation = personaProfile.targetLocation || researchData.targetLocation || "Kolkata";
  const embeddedSocialData = researchData.rawLiveSocialContext || "No dynamic social metrics gathered.";
  
  let realTimeCompetitorIntel = "No live web competitive tracks scraped for this batch.";
  try {
    const competitiveSearchString = `best accounting institute tally training course placement reviews ${targetLocation}`;
    console.log(`🌐 Competitor Agent: Querying expanded market terrain via Tavily: "${competitiveSearchString}"`);
    
    // Scaled up maxResults from 3 to 12 for maximum geographic competitor tracking exposure
    const liveCompetitorTracks = await clients.tavily.tavilySearch(competitiveSearchString, { searchDepth: "advanced", maxResults: 12, includeRawContent: true });
    
    if (liveCompetitorTracks && liveCompetitorTracks.length > 0) {
      realTimeCompetitorIntel = liveCompetitorTracks.map((c, i) => {
        const bodyContent = c.raw_content || c.content || "";
        return `[Competitor Live Signal #${i+1}]: ${c.title}\nURL: ${c.url}\nExtracted Deep Content: ${bodyContent.substring(0, 500)}...`;
      }).join("\n\n");
    }
  } catch (tavilyCompError) {
    console.error("⚠️ Live competitive tracking step bypassed:", tavilyCompError.message);
  }

  const systemPrompt = `You are a professional competitive intelligence strategist specializing in the Indian Accounting & Finance Education market. You analyze competitors through strategic (SWOT) and psychological (emotional/trust gaps) lenses to expose actionable conversion vulnerabilities. Cross-examine landing page promises against raw public sentiments.`;
  
  const userPrompt = `Perform a comprehensive, extensive competitive intelligence analysis for the Indian accounting education market.
  
=== PRIMARY STATIC COMPETITORS ===
${allCompetitors}

=== LIVE REAL-TIME LOCAL MARKET COMPETITOR TRACKS ===
${realTimeCompetitorIntel}

=== RAW ETHNOGRAPHIC SOCIAL SENTIMENT MATRIX (FB, IG, LINKEDIN) ===
${embeddedSocialData}

=== AUDIENCE INTELLIGENCE ===
Reader: ${personaProfile.buyerPersona || "Accounting Student"}
Identity Belief: ${personaProfile.identityBelief || "Seeking career security"}
Target Location: ${targetLocation}
Pain Points: ${(personaProfile.painPoints || []).join("; ")}

=== RESEARCH CONTEXT ===
Search Intent Context: ${researchData.searchIntentAnalysis || ""}
Trust Signals Needed: ${(researchData.trustSignals || []).join(", ")}
SEO Gaps Found: ${(researchData.seoGaps || []).join(", ")}

Execute analysis using professional intelligence frameworks. Respond in this EXACT format:
[BEGIN_ANALYSIS]
SWOT_STRENGTHS: (6 competitor strengths, comma-separated)
SWOT_WEAKNESSES: (6 competitor weaknesses, comma-separated)
SWOT_OPPORTUNITIES: (6 market opportunities, comma-separated)
SWOT_THREATS: (4 market threats, comma-separated)
EMOTIONAL_GAPS: (6 emotions competitors fail to address, comma-separated)
TRUST_GAPS: (6 ways competitors fail to build trust, comma-separated)
SEO_GAPS: (6 SEO keyword/content gaps, comma-separated)
POSITIONING_ANALYSIS: (4-5 sentences on how competitors position themselves and where they fail)
MESSAGING_WEAKNESSES: (6 messaging failures, comma-separated)
COMPETITOR_BLIND_SPOTS: (6 things competitors completely miss, comma-separated)
DIFFERENTIATION_STRATEGY: (4-5 sentences on exactly how to beat them with specific tactical content hooks)
CONTENT_OPPORTUNITIES: (6 content topics competitors ignore completely, comma-separated)
[END_ANALYSIS]`;

  let result = "";
  try {
    // Upgraded explicitly to Deep Research (qwen-max + native web execution)
    result = await clients.qwen.deepResearch(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 4000 // Ensuring structural analysis is not truncated mid-payload
    });
  } catch (err) {
    console.error("Competitor Agent — Qwen generation failed:", err.message);
    return buildFallbackCompetitorAnalysis(targetLocation);
  }

  const block = extractBlock(result, "[BEGIN_ANALYSIS]", "[END_ANALYSIS]") || result;
  if (!block || block.length < 50) {
    return buildFallbackCompetitorAnalysis(targetLocation);
  }

  return {
    swot: {
      strengths: extractList(block, "SWOT_STRENGTHS"),
      weaknesses: extractList(block, "SWOT_WEAKNESSES"),
      opportunities: extractList(block, "SWOT_OPPORTUNITIES"),
      threats: extractList(block, "SWOT_THREATS")
    },
    emotionalGaps: extractList(block, "EMOTIONAL_GAPS"),
    trustGaps: extractList(block, "TRUST_GAPS"),
    seoGaps: extractList(block, "SEO_GAPS"),
    positioningAnalysis: extractField(block, "POSITIONING_ANALYSIS"),
    messagingWeaknesses: extractList(block, "MESSAGING_WEAKNESSES"),
    competitorBlindSpots: extractList(block, "COMPETITOR_BLIND_SPOTS"),
    strategyNotes: extractField(block, "DIFFERENTIATION_STRATEGY"),
    contentOpportunities: extractList(block, "CONTENT_OPPORTUNITIES"),
    targetLocation
  };
}

function buildFallbackCompetitorAnalysis(targetLocation) {
  return {
    swot: {
      strengths: ["Established local brand reputation", "High volume batch operations"],
      weaknesses: ["Outdated theoretical examples", "Lack of personalized office placement assistance"],
      opportunities: ["Direct structural software simulation workshops", "Local corporate networking partnerships"],
      threats: ["Low-cost fragmented individual tutorial channels"]
    },
    emotionalGaps: ["Anxiety over sudden placement shortlisting trials", "Imposter syndrome during live ledger reconciliation"],
    trustGaps: ["Failure to share unedited screen recordings of software errors", "Absence of authentic student documentation case tracks"],
    seoGaps: ["Corporate real-world taxation filing paths near me", "Tally practical office problems and accounting troubleshooting sheets"],
    positioningAnalysis: "Competitors position around standard syllabus timelines. The primary structural opening is positioning as a live career simulator rather than an academic learning institution.",
    messagingWeaknesses: ["Overused corporate catalog vocabulary", "Zero contextual alignment with local market demands"],
    competitorBlindSpots: ["Individual operational confidence building", "Live structural accounting ledger analysis"],
    strategyNotes: "Lead with explicit, real-world case documents from local logistics and commerce nodes to capture immediate intent.",
    contentOpportunities: ["Step-by-step corporate balance sheet correction walkthroughs", "Navigating tax audit anxiety guides"],
    targetLocation
  };
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

function extractList(block, key) {
  const val = extractField(block, key);
  return val ? val.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
}

module.exports = competitorAgent;