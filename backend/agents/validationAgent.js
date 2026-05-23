/**
 * Validation Agent — STEP 2 of the Content Loop.
 * Runs structural and LLM-driven quality gating against production parameters.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { groqGenerate } = require("./clients/qwenClient");

async function validationAgent(blogResult, blueprint, persona) {
  const issues = [];
  let score = 100;

  if (!blogResult.content || blogResult.content.length < 200) {
    issues.push({ field: "content", issue: "Content is too short or missing entirely." });
    score -= 20;
  }

  if (!blogResult.title || blogResult.title.length < 10) {
    issues.push({ field: "title", issue: "Title is absent or structurally insufficient." });
    score -= 10;
  }

  const h2Count = (blogResult.content?.match(/^##\s+/gm) || []).length;
  if (h2Count < 2) {
    issues.push({ field: "structure", issue: "Content requires more formatting subdivisions (H2 headers) for user navigation." });
    score -= 10;
  }

  const wordCount = blogResult.content?.split(/\s+/).length || 0;
  if (wordCount < 300) {
    issues.push({ field: "wordCount", issue: `Current length is ${wordCount} words; falls short of minimum production threshold.` });
    score -= 20;
  }

  const accountingTerms = ["accounting", "finance", "tally", "gst", "taxation", "bookkeeping", "b.com", "commerce", "audit", "salary", "career", "job", "interview", "skills"];
  const contentLower = (blogResult.content || "").toLowerCase();
  const relevanceCount = accountingTerms.filter(t => contentLower.includes(t)).length;
  if (relevanceCount < 3) {
    issues.push({ field: "domainRelevance", issue: "Content text lacks basic domain-specific keywords or industry reference anchors." });
    score -= 10;
  }

  let detailedScores = {};

  if (blogResult.content && blogResult.content.length > 300) {
    try {
      const prompt = `You are a strict Senior Editor specializing in Indian Accounting & Finance educational content review.
Evaluate the candidate text against target user requirements.

=== AUDIENCE ===
Reader Profile: ${persona.buyerPersona}
Core Hidden Anxiety: ${(persona.hiddenFears || []).slice(0, 2).join("; ")}

=== ARTIFACT EVALUATION TRACE ===
TITLE: ${blogResult.title}
CONTENT METRIC HEAD:
${blogResult.content.substring(0, 2000)}

Evaluate across these 7 dimensions (0-100 each):
1. EMOTIONAL_DEPTH: Structural alignment with real accounting student career path anxieties.
2. TRUST_BUILDING: Relatable office scenario simulations.
3. SEO_QUALITY: Keyword diversity and structured header placement.
4. READABILITY: Paragraph length, whitespace distribution, and sentence pacing.
5. PSYCHOLOGICAL_ALIGNMENT: Directly addresses target anxieties.
6. COMPETITOR_DIFFERENTIATION: Avoids generic textbook phrasing.
7. CONTENT_QUALITY: Genuinely instructional value.

Respond exactly inside a single JSON object matching this schema:
{
  "emotionalDepth": 85,
  "trustBuilding": 75,
  "seoQuality": 80,
  "readability": 90,
  "psychologicalAlignment": 85,
  "competitorDifferentiation": 70,
  "contentQuality": 80,
  "isRobotic": false,
  "critiques": ["Provide concrete issue notes or empty array"]
 }`;

      const rawFeedback = await groqGenerate(
        "You are a harsh editorial reviewer for accounting education content. Output valid JSON only.",
        prompt,
        { model: "qwen3.6-plus", temperature: 0.1 }
      );

      let feedback = {};
      try {
        const jsonMatch = rawFeedback.match(/\{[\s\S]*\}/);
        feedback = JSON.parse(jsonMatch ? jsonMatch[0] : rawFeedback);
      } catch (e) {
        console.error("Validation Agent JSON Parse Error:", e.message);
      }

      detailedScores = {
        emotionalDepth: feedback.emotionalDepth || 70,
        trustBuilding: feedback.trustBuilding || 70,
        seoQuality: feedback.seoQuality || 70,
        readability: feedback.readability || 70,
        psychologicalAlignment: feedback.psychologicalAlignment || 70,
        competitorDifferentiation: feedback.competitorDifferentiation || 70,
        contentQuality: feedback.contentQuality || 70
      };

      const scores = Object.values(detailedScores);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      if (avgScore < 60) {
        issues.push({ field: "overallQuality", issue: `Calculated average score of ${avgScore}/100 falls below standard parameters.` });
        score -= (60 - avgScore);
      }

      if (feedback.isRobotic) {
        issues.push({ field: "tone", issue: "Content contains persistent repetitive AI template phrases." });
        score -= 15;
      }

      if (feedback.critiques && feedback.critiques.length > 0) {
        issues.push({ field: "editorialCritique", issue: feedback.critiques[0] });
      }

    } catch (e) {
      console.error("Validation Agent LLM Error:", e.message);
      issues.push({ field: "validationError", issue: "Deep content validation system bypass occurred." });
    }
  }

  const keywordsFound = (blueprint.targetKeywords || []).filter(kw =>
    blogResult.content?.toLowerCase().includes(kw.toLowerCase())
  );

  return {
    isValid: score >= 65,
    score: Math.max(0, Math.min(100, score)),
    issues,
    detailedScores,
    keywordsIntegrated: keywordsFound.length,
    totalKeywords: (blueprint.targetKeywords || []).length,
    h2Count,
    wordCount,
    domainRelevanceScore: relevanceCount
  };
}

module.exports = validationAgent;