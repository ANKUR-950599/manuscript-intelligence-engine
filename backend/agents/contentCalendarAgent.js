// Correct path pointing to the clients folder with destructuring
const { groqGenerate } = require("./clients/qwenClient");

function extractBlock(text, start, end) {
  if (!text) return null;
  const s = text.indexOf(start);
  const e = text.indexOf(end, s + start.length);
  if (s === -1 || e === -1) return null;
  return text.substring(s + start.length, e).trim();
}

function buildCalendarFallback(blueprint, persona, weekStart) {
  const baseTitle = blueprint.blogTitle || "Weekly Content";
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return {
    weekStart,
    weekEnd: new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    theme: blueprint.contentDirection || "Psychology-driven transformation",
    weekPlan: days.map((dayName, i) => ({
      dayIndex: i + 1,
      dayName,
      date: new Date(new Date(weekStart).getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
      blog: {
        title: `${baseTitle} - Day ${i + 1}`,
        metaDescription: `Practical guidance for ${persona.buyerPersona || "the audience"}.`,
        content: `# ${baseTitle}\n\n## Why this matters\n\nWrite blog content here.`,
        summary: `A practical post for ${persona.buyerPersona || "the audience"}.`,
        tags: (blueprint.targetKeywords || []).slice(0, 5),
        cta: blueprint.ctaStrategy || "Take the next step today.",
      },
      whatsapp: {
        headline: `Day ${i + 1} update`,
        message: `A short WhatsApp message for ${persona.buyerPersona || "the audience"}.`,
        cta: blueprint.ctaStrategy || "Read more.",
      },
      email: {
        subject: `Day ${i + 1}: ${baseTitle}`,
        preheader: "Your weekly learning update",
        body: `An email draft for ${persona.buyerPersona || "the audience"}.`,
        cta: blueprint.ctaStrategy || "Open the full guide.",
      },
      sendTimeIST: "09:00",
    })),
    generatedByModel: {
      blog: "Qwen qwen3.6-plus",
      calendar: "Qwen qwen3.6-plus",
    },
  };
}

async function contentCalendarAgent(blueprint, persona, research, competitor, weekStartISO) {
  const weekStart = weekStartISO ? new Date(weekStartISO) : new Date();
  const baseStart = new Date(weekStart);
  baseStart.setHours(0, 0, 0, 0);

  const calendarPrompt = `You are a content calendar strategist for an Indian education brand. Build a 7-day plan for BLOG + WHATSAPP + EMAIL. Make it practical, human, and conversion-aware.`;

  const calendarUserPrompt = `Use this blueprint and audience intelligence to create a 7-day channel plan.

=== BLUEPRINT ===
${JSON.stringify(blueprint, null, 2)}

=== PERSONA ===
${JSON.stringify(persona, null, 2)}

=== RESEARCH ===
${JSON.stringify(research, null, 2).slice(0, 5000)}

=== COMPETITOR GAPS ===
${JSON.stringify(competitor, null, 2).slice(0, 5000)}

Return JSON in this exact shape:
{
  "theme": "string",
  "weekPlan": [
    {
      "dayIndex": 1,
      "dayName": "Monday",
      "date": "YYYY-MM-DD",
      "blog": {
        "title": "string",
        "metaDescription": "string",
        "content": "string",
        "summary": "string",
        "tags": ["string"],
        "cta": "string"
      },
      "whatsapp": {
        "headline": "string",
        "message": "string",
        "cta": "string"
      },
      "email": {
        "subject": "string",
        "preheader": "string",
        "body": "string",
        "cta": "string"
      },
      "sendTimeIST": "09:00"
    }
  ]
}`;

  let calendarRaw = "";
  try {
    calendarRaw = await groqGenerate(calendarPrompt, calendarUserPrompt, { model: "qwen3.6-plus", temperature: 0.4, maxTokens: 5000 });
  } catch (error) {
    console.error("Content Calendar Agent — Qwen failed:", error.message);
  }

  const jsonMatch = calendarRaw.match(/\{[\s\S]*\}/);
  let parsed = null;
  try {
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    parsed = null;
  }

  if (!parsed || !Array.isArray(parsed.weekPlan) || parsed.weekPlan.length !== 7) {
    return buildCalendarFallback(blueprint, persona, baseStart.toISOString());
  }

  const refinementPrompt = `Refine the following 7-day content plan for clarity, persuasion, and consistency. Keep JSON only.
${JSON.stringify(parsed, null, 2)}`;

  let calendarRawRefinement = "";
  try {
    calendarRawRefinement = await groqGenerate(
      "You are a senior editorial strategist. Improve clarity and keep the same JSON structure.",
      refinementPrompt,
      { model: "qwen3.6-plus", temperature: 0.2, maxTokens: 5000 }
    );
  } catch (error) {
    console.error("Content Calendar Agent — Qwen refinement failed:", error.message);
  }

  const refinedMatch = calendarRawRefinement.match(/\{[\s\S]*\}/);
  let refined = parsed;
  try {
    refined = refinedMatch ? JSON.parse(refinedMatch[0]) : parsed;
  } catch {
    refined = parsed;
  }

  if (!Array.isArray(refined.weekPlan) || refined.weekPlan.length !== 7) {
    return buildCalendarFallback(blueprint, persona, baseStart.toISOString());
  }

  return {
    ...refined,
    weekStart: baseStart.toISOString(),
    weekEnd: new Date(baseStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    generatedByModel: {
      blog: "Qwen qwen3.6-plus",
      calendar: "Qwen qwen3.6-plus",
    },
  };
}

module.exports = contentCalendarAgent;
