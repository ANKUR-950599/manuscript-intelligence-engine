/**
 * Persona Agent — STEP 1 of the Heavy Run/Refill Loop.
 * Uses: Qwen qwen3.6-plus for persona enrichment.
 * Enriches static persona templates with location intelligence and psychological pain architecture.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { groqGenerate } = require("./clients/qwenClient");

async function personaAgent(templates, businessContext, locationContext) {
  const targetLocation = locationContext?.city || businessContext?.targetLocation || "Kolkata";
  const baseTemplate = templates[0] || {};
  
  const systemPrompt = `You are a world-class consumer psychologist and persona strategist specializing in the Indian accounting education sector. You create "living" personas that capture the deepest psychological truths of students and professionals. Your work is data-driven but emotionally profound.`;
  
  const userPrompt = `Enrich the following persona template with deep location-specific intelligence and current market trends for ${targetLocation}.
  
=== BASE TEMPLATE (Psychological Foundation) ===
Category: ${baseTemplate.audienceCategory || "Accounting Aspirant"}
Identity Belief: ${baseTemplate.psychologyLayer?.identityBelief || "Seeking stability"}
Hidden Fears: ${(baseTemplate.painArchitecture?.hiddenFears || []).join("; ")}
Pain Points: ${baseTemplate.psychologyLayer?.emotionalFrustration || "Lack of practical guidance"}
Live Situations: ${(baseTemplate.painArchitecture?.liveDailyLifeSituations || []).join("; ")}

=== BUSINESS CONTEXT ===
Target Location: ${targetLocation}
Education Goal: ${businessContext?.educationBackground || "Commerce/Accounting Qualification"}
Primary Struggle: ${businessContext?.biggestProblem || "No practical software exposure or market readiness"}`;

  const enrichmentRules = `
ENRICHMENT RULES:
1. FOUNDATION FIRST: Your primary source of truth is the BASE TEMPLATE. Preserve the core psychological identity (beliefs, fears).
2. LOCATION AS A LENS: Apply the Target Location (${targetLocation}) as a "lens". Adapt their environment, not their core character.
3. PAIN POINT DEPTH: Dive deep into the TEMPLATE pains. Explain their emotional toll in ${targetLocation}.
4. CHARACTER SNAPSHOT: 1 sentence for core identity, 1 for local life, 1 for current struggle.

Respond in this EXACT format:
[BEGIN PERSONA]
BUYER PERSONA: (A punchy name/label for this enriched persona)
CHARACTER_SNAPSHOT: (4-5 sentences that make them feel alive in ${targetLocation}, describing their daily grind)
ENRICHED IDENTITY BELIEF: (2 deep-seated beliefs that drive their behavior)
DEEP_PAIN_ANALYSIS: (4-5 sentences analyzing the emotional toll of their pain points in ${targetLocation})
LOCATION SPECIFIC ANXIETY: (3 specific fears unique to the ${targetLocation} job market)
HIDDEN FEARS: (8 deep psychological fears, semicolon-separated)
LIVE SITUATIONS: (6 real-life situations they experience in ${targetLocation}, semicolon-separated)
EMOTIONAL TRIGGERS: (8 specific hooks that trigger them to take action, semicolon-separated)
[END_PERSONA]`;

  const finalPrompt = `${userPrompt}\n\n${enrichmentRules}`;
  let result = "";
  
  try {
    result = await groqGenerate(systemPrompt, finalPrompt, {
      model: "qwen3.6-plus",
      temperature: 0.8,
      maxTokens: 4000
    });
  } catch (err) {
    console.error("Persona Agent Qwen generation failed:", err.message);
    result = "";
  }

  const block = extractBlock(result, "[BEGIN PERSONA]", "[END_PERSONA]") || result;

  return {
    buyerPersona: extractField(block, "BUYER PERSONA"),
    characterSnapshot: extractField(block, "CHARACTER_SNAPSHOT"),
    identityBelief: extractField(block, "ENRICHED IDENTITY BELIEF"),
    painPointAnalysis: extractField(block, "DEEP_PAIN_ANALYSIS"),
    locationAnxiety: extractField(block, "LOCATION SPECIFIC ANXIETY"),
    hiddenFears: extractListSemicolon(block, "HIDDEN FEARS"),
    liveSituations: extractListSemicolon(block, "LIVE SITUATIONS"),
    emotionalTriggers: extractListSemicolon(block, "EMOTIONAL TRIGGERS"),
    fullPsychology: baseTemplate.psychologyLayer || {},
    fullPainArchitecture: baseTemplate.painArchitecture || {},
    lifeSituation: baseTemplate.lifeSituation || {},
    voiceOfCustomer: baseTemplate.voiceOfCustomer || {},
    transformationGoal: baseTemplate.transformationGoal || {},
    buyingBehavior: baseTemplate.buyingBehavior || {},
    targetLocation,
    methodology: {
      approach: "Psychological Persona Enrichment",
      model: "qwen3.6-plus",
      reasoning: `Enriched the base template with deep localized context for ${targetLocation}.`
    }
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
  const match = block.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_\\s]+:|$ )`, "i"));
  return match ? match[1].trim() : "";
}

function extractListSemicolon(block, key) {
  const val = extractField(block, key);
  return val ? val.split(";").map(s => s.trim()).filter(s => s.length > 0) : [];
}

module.exports = personaAgent;