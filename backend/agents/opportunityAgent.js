// Correct path pointing to the clients folder with destructuring
const { groqGenerate } = require("./clients/qwenClient");
const { getCompetitorContext, getPrimaryLocationContext } = require("../config/competitors");
const { memoryAgent } = require("./memoryAgent");

function extractBlock(text, start, end) {
  if (!text) return null;
  const s = text.indexOf(start);
  const e = text.indexOf(end, s + start.length);
  if (s === -1 || e === -1) return null;
  return text.substring(s + start.length, e).trim();
}

function extractField(block, key) {
  if (!block) return "";
  const match = block.match(new RegExp(`${key}:\\s*(.+)`, "i"));
  return match ? match[1].trim() : "";
}

function extractList(block, key) {
  const val = extractField(block, key);
  return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
}

async function opportunityAgent() {
  const locationContext = getPrimaryLocationContext ? getPrimaryLocationContext() : "Kolkata";
  const competitorContext = getCompetitorContext ? getCompetitorContext() : [];

  let memoryData;
  try {
    memoryData = await memoryAgent("ACCOUNTING");
  } catch (e) {
    memoryData = { totalBlogsGenerated: 0, previousTitles: [], successfulTopics: [], emotionalStrategies: [] };
  }

  const researchSystemPrompt = `You are a market research intelligence system specializing in the Indian Accounting & Finance Education sector. Analyze current market conditions for THREE audience categories and provide opportunity intelligence.`;

  const researchUserPrompt = `Analyze the current market opportunity for accounting education content across these 3 audience categories:

1. 12TH PASS COMMERCE STUDENTS - Recently completed 12th, confused about career, limited budget
2. COLLEGE-LEVEL STUDENTS (B.Com/BBA/BA) - Have degree but no practical skills, terrified of interviews
3. WORKING PROFESSIONALS - Stuck in low-paying jobs, need upskilling, time-constrained

=== LOCATION CONTEXT ===
${locationContext}

=== COMPETITOR LANDSCAPE ===
${competitorContext}

=== PREVIOUS CONTENT GENERATED ===
Total blogs: ${memoryData.totalBlogsGenerated || 0}
Recent topics: ${(memoryData.previousTitles || []).slice(-5).join(", ") || "None yet"}
Successful strategies: ${(memoryData.emotionalStrategies || []).slice(-3).join("; ") || "None yet"}

For EACH audience category, analyze:
1. What are they CURRENTLY searching for RIGHT NOW in Kolkata and Lucknow?
2. What emotional pain points are MOST INTENSE right now?
3. Where are competitors WEAKEST for this audience?
4. What trending topics are GROWING for this audience?
5. What content would have the HIGHEST conversion potential?

Respond in this EXACT format:
[BEGIN_ANALYSIS]
CATEGORY_1_NAME: 12th Pass Commerce Student
CATEGORY_1_SEARCH_DEMAND: (describe current search intensity and popular queries)
CATEGORY_1_EMOTIONAL_INTENSITY: (describe how emotionally charged this audience is RIGHT NOW)
CATEGORY_1_COMPETITOR_GAPS: (where competitors fail this audience)
CATEGORY_1_TRENDING_TOPICS: (what's growing for this audience)
CATEGORY_1_LOCATION_DEMAND: (Kolkata/Lucknow specific demand)

CATEGORY_2_NAME: College-Level Student
CATEGORY_2_SEARCH_DEMAND: (describe current search intensity)
CATEGORY_2_EMOTIONAL_INTENSITY: (describe emotional state)
CATEGORY_2_COMPETITOR_GAPS: (competitor weaknesses)
CATEGORY_2_TRENDING_TOPICS: (growing topics)
CATEGORY_2_LOCATION_DEMAND: (location specific)

CATEGORY_3_NAME: Working Professional
CATEGORY_3_SEARCH_DEMAND: (describe current search intensity)
CATEGORY_3_EMOTIONAL_INTENSITY: (describe emotional state)
CATEGORY_3_COMPETITOR_GAPS: (competitor weaknesses)
CATEGORY_3_TRENDING_TOPICS: (growing topics)
CATEGORY_3_LOCATION_DEMAND: (location specific)

MARKET_TRENDS: (3 overall market trends, comma-separated)
COMPETITOR_WEAKNESSES: (3 overall competitor weaknesses, comma-separated)
EMOTIONAL_OPPORTUNITIES: (3 emotional content opportunities, comma-separated)
SEO_GAPS: (3 SEO keyword gaps, comma-separated)
[END_ANALYSIS]`;

  let researchAnalysis = "";
  try {
    researchAnalysis = await groqGenerate(researchSystemPrompt, researchUserPrompt, { model: "qwen3.6-plus", temperature: 0.7, maxTokens: 4000 });
  } catch (err) {
    console.error("Opportunity Agent — Qwen analysis failed:", err.message);
  }

  const scoringSystemPrompt = `You are a data-driven analytical engine. Score audience categories based on market opportunity data. Be precise and quantitative. Output valid JSON only.`;
  const scoringUserPrompt = `Based on this market analysis, score each audience category on a 0-100 scale across 7 dimensions.

=== MARKET ANALYSIS ===
${researchAnalysis}

=== PREVIOUS BLOG HISTORY ===
Total blogs generated: ${memoryData.totalBlogsGenerated || 0}
Categories used recently: ${(memoryData.usedCategories || []).join(", ") || "None"}
Successful emotional strategies: ${(memoryData.emotionalStrategies || []).slice(-3).join("; ") || "None"}

=== SCORING DIMENSIONS ===
1. searchDemand
2. emotionalIntensity
3. competitorGaps
4. seoOpportunity
5. trendGrowth
6. locationDemand
7. previousSuccess

IMPORTANT:
If one category has been heavily covered recently, reduce its previousSuccess score to encourage diversity.

Respond in EXACT JSON format:
{
  "categoryScores": [
    {
      "category": "12th Pass Commerce Student",
      "scores": {
        "searchDemand": 0,
        "emotionalIntensity": 0,
        "competitorGaps": 0,
        "seoOpportunity": 0,
        "trendGrowth": 0,
        "locationDemand": 0,
        "previousSuccess": 0
      },
      "totalScore": 0,
      "reasoning": "..."
    }
  ],
  "selectedCategory": "..."
}`;

  let scoringJsonText = "";
  try {
    scoringJsonText = await groqGenerate(scoringSystemPrompt, scoringUserPrompt, { model: "qwen3.6-plus", temperature: 0.2, maxTokens: 3000 });
  } catch (err) {
    console.error("Opportunity Agent — Qwen scoring failed:", err.message);
  }

  const analysisBlock = extractBlock(researchAnalysis, "[BEGIN_ANALYSIS]", "[END_ANALYSIS]") || researchAnalysis;
  const scoringJson = (() => {
    try {
      const match = scoringJsonText.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  })();

  const categorySummaries = [
    {
      category: "12th Pass Commerce Student",
      searchDemand: extractField(analysisBlock, "CATEGORY_1_SEARCH_DEMAND"),
      emotionalIntensity: extractField(analysisBlock, "CATEGORY_1_EMOTIONAL_INTENSITY"),
      competitorGaps: extractField(analysisBlock, "CATEGORY_1_COMPETITOR_GAPS"),
      trendingTopics: extractField(analysisBlock, "CATEGORY_1_TRENDING_TOPICS"),
      locationDemand: extractField(analysisBlock, "CATEGORY_1_LOCATION_DEMAND"),
    },
    {
      category: "College-Level Student",
      searchDemand: extractField(analysisBlock, "CATEGORY_2_SEARCH_DEMAND"),
      emotionalIntensity: extractField(analysisBlock, "CATEGORY_2_EMOTIONAL_INTENSITY"),
      competitorGaps: extractField(analysisBlock, "CATEGORY_2_COMPETITOR_GAPS"),
      trendingTopics: extractField(analysisBlock, "CATEGORY_2_TRENDING_TOPICS"),
      locationDemand: extractField(analysisBlock, "CATEGORY_2_LOCATION_DEMAND"),
    },
    {
      category: "Working Professional",
      searchDemand: extractField(analysisBlock, "CATEGORY_3_SEARCH_DEMAND"),
      emotionalIntensity: extractField(analysisBlock, "CATEGORY_3_EMOTIONAL_INTENSITY"),
      competitorGaps: extractField(analysisBlock, "CATEGORY_3_COMPETITOR_GAPS"),
      trendingTopics: extractField(analysisBlock, "CATEGORY_3_TRENDING_TOPICS"),
      locationDemand: extractField(analysisBlock, "CATEGORY_3_LOCATION_DEMAND"),
    },
  ];

  return {
    categories: categorySummaries,
    marketTrends: extractList(analysisBlock, "MARKET_TRENDS"),
    competitorWeaknesses: extractList(analysisBlock, "COMPETITOR_WEAKNESSES"),
    emotionalOpportunities: extractList(analysisBlock, "EMOTIONAL_OPPORTUNITIES"),
    seoGaps: extractList(analysisBlock, "SEO_GAPS"),
    scoring: scoringJson,
    selectedCategory: scoringJson.selectedCategory || "College-Level Student",
    methodology: {
      approaches: ["Broad market research", "Quantitative scoring"],
      models: {
        primary: "Qwen qwen3.6-plus",
        scoring: "Qwen qwen3.6-plus",
      },
      reasoning: "Qwen qwen3.6-plus handles both broad narrative synthesis and quantitative scoring.",
    },
  };
}

module.exports = opportunityAgent;
