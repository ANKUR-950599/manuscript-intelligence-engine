/**
 * Orchestrator Agent — STEP 4 of the Heavy Run/Refill Loop.
 * Synthesizes research and competitor blind spots into exactly 6 highly structured, ranked topics.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const clients = require("./clients/clientRegistry");

async function orchestratorAgent(persona, research, competitor) {
  const targetLocation = persona.targetLocation || research.targetLocation || "Kolkata";

  const prompt = `You are the Chief Content Strategist for an Indian Accounting & Finance education brand targeting students in ${targetLocation}. You are the central orchestrator brain. Your task is to analyze the buyer persona profile, empirical research vectors (specifically emphasizing raw user phrases and conversational friction found in the historical conversation_intelligence dataset logs), and competitor weaknesses to build a structured batch blueprint containing exactly 6 high-impact topics. These topics will be queued sequentially for production.
  
TARGET PERSONA DETAILS:
${JSON.stringify(persona, null, 2)}

RESEARCH DATA CORPUS:
${JSON.stringify(research, null, 2)}

COMPETITOR INTEL & GAPS:
${JSON.stringify(competitor, null, 2)}

OUTPUT REQUIREMENT:
You must generate exactly 6 highly distinct content topics ranked from Rank 1 to Rank 6. Rank 1 must represent the most immediate, conversion-heavy low-hanging fruit. Each topic block must be fully fleshed out with precise editorial parameters. Ensure the tone and structural angles reflect the exact raw user struggles discovered within the historical chat intelligence context block.

You must respond in this EXACT structural layout block without deviation:
[START_TOPICS_LIST]

TOPIC_RANK: 1
CORE_TITLE: (High impact, optimized click-worthy title addressing an immediate intent)
CORE_ANGLE: (The strategic positioning perspective that differentiates this topic from competitor content)
EMOTIONAL_HOOK: (The psychological anxiety trigger or aspirational hook to lead with)
PAIN_POINTS_ADDRESSED: (List 3 precise localized structural frustrations, semicolon-separated)
TARGET_KEYWORDS: (4 highly relevant localized SEO terms, comma-separated)
BENCHMARK_SEO_GAP: (The unique angle competitors miss on this topic)
ESTIMATED_CATEGORY: (ACCOUNTING or FINANCE)

TOPIC_RANK: 2
...
(Repeat structure precisely for topics 2, 3, 4, 5, and 6)

[END_TOPICS_LIST]`;

  try {
    const rawBlueprint = await clients.qwen.generate(
      "You are an elite multi-agent system director and master copywriter. Output clear strategies matching strict layout block constraints.",
      prompt,
      { temperature: 0.4 }
    );

    return parseBatchTopics(rawBlueprint, targetLocation);
  } catch (error) {
    console.error("Orchestrator Agent Failure:", error.message);
    throw error;
  }
}

function parseBatchTopics(text, targetLocation) {
  const startTag = "[START_TOPICS_LIST]";
  const endTag = "[END_TOPICS_LIST]";
  const s = text.indexOf(startTag);
  const e = text.indexOf(endTag);

  if (s === -1 || e === -1) {
    throw new Error("Invalid output format returned from Qwen Orchestrator");
  }

  const block = text.substring(s + startTag.length, e).trim();
  const rawTopicBlocks = block.split(/TOPIC_RANK:\s*/i).filter(Boolean);
  
  const topicsArray = rawTopicBlocks.map((chunk) => {
    const lines = chunk.split("\n");
    const rank = parseInt(lines[0].trim());
    
    return {
      rank: rank || 1,
      title: extractSubField(chunk, "CORE_TITLE"),
      coreAngle: extractSubField(chunk, "CORE_ANGLE"),
      emotionalHook: extractSubField(chunk, "EMOTIONAL_HOOK"),
      painPointsAddressed: extractSubField(chunk, "PAIN_POINTS_ADDRESSED").split(";").map(p => p.trim()).filter(Boolean),
      targetKeywords: extractSubField(chunk, "TARGET_KEYWORDS").split(",").map(k => k.trim()).filter(Boolean),
      seoGap: extractSubField(chunk, "BENCHMARK_SEO_GAP"),
      category: extractSubField(chunk, "ESTIMATED_CATEGORY") || "ACCOUNTING",
      targetLocation,
      status: "pending"
    };
  });

  return topicsArray;
}

function extractSubField(chunk, key) {
  const match = chunk.match(new RegExp(`${key}:\\s*(.+)`, "i"));
  return match ? match[1].trim() : "";
}

module.exports = orchestratorAgent;