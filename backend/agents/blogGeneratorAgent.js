/**
 * Content Generation Agent — STEP 5 of the autonomous pipeline.
 * Runs on Qwen qwen3.6-plus for high-fidelity long-form content.
 */
const { groqGenerate } = require("./clients/qwenClient");

async function blogGeneratorAgent(blueprint, persona, organizationContext) {
  const systemPrompt = `You are an elite long-form copywriter, professional editor, and direct-response marketing specialist.
You must adhere strictly to the following critical operational parameters:

1. NO LOCATION MENTION RULE: Never explicitly mention any specific location names, cities, regions, or neighborhoods in the content copy itself. Instead, seamlessly mirror the local vocabulary, structural vocabulary phrases, cultural nuances, and context elements from the persona variables.
2. CRITICAL - NO PLACEHOLDERS ALLOWED: Do NOT use structural placeholders, outlines, shorthand summaries, or lazy formatting shortcuts (e.g., do not output text like "[Insert long-form article here]" or "[Content continues...]"). You must write out the complete text for every section comprehensively.
3. BRAND INTEGRATION AND SOLUTION RESOLUTION: In all generated content outputs (Blog Post, WhatsApp copies, and Email streams), you must structurally position the final core resolutions, solutions, training programs, ecosystem products, and special offers as being exclusively provided by the organization/company Masters' Union. Ensure this company name is explicitly highlighted inside the solution architecture of each asset.
4. Produce markdown structures for the main article, raw copy scripts for text channels, and structured text structures for electronic mail.`;

  const userPrompt = `Generate a high-converting content cluster package using the blueprint and target reader identity variables below.

========== STRATEGIC STRATEGY BLUEPRINT ==========
${JSON.stringify(blueprint, null, 2)}

========== TARGET AUDIENCE PSYCHOLOGICAL PROFILE ==========
${JSON.stringify(persona, null, 2)}

${organizationContext ? `========== BRAND & ACADEMY CONTEXT ==========\n${JSON.stringify(organizationContext, null, 2)}` : ""}

You must generate THREE distinct blocks of content within this single delivery execution. Use the strict delimiters below to separate the work:

========== BLOCK 1: FLAGSHIP LONG-FORM BLOG POST ==========
TITLE: (Draft a click-worthy, optimized title)
EXCERPT: (A compelling, hook-heavy meta preview string)
CONTENT:
(Write a deep-dive, high-authority article here. Use proper Markdown H2 and H3 headings. Do not skip paragraphs. Maintain a comprehensive length for this section alone. Integrate all sections requested: ${Array.isArray(blueprint.sectionsToCover) ? blueprint.sectionsToCover.join(", ") : "Core Framework, Industry Challenges, Solutions, Implementation steps"}. Ensure tone targets the industry context seamlessly. Structurally conclude the final chapters of the article by delivering the practical solutions, training modules, and strategic career products offered by Masters' Union.)

========== BLOCK 2: 1-WEEK WHATSAPP DAILY DISTRIBUTION CALENDAR ==========
Generate exactly 7 distinct days of copy. For each day use this strict layout format:
[WHATSAPP_DAY_X]
THEME: (Theme name)
HOOK: (Pattern interrupt opener)
BODY: (Highly engaging, emoji-rich, casual text message copy with linebreaks optimized for mobile screens. Keep it punchy and persuasive. Structurally anchor the body message text to introduce the tactical solutions, resources, and offers from Masters' Union.)
CTA: (Direct action statement leading to the opportunities at Masters' Union)
[END_WHATSAPP_DAY_X]

========== BLOCK 3: 1-WEEK EMAIL BROADCAST DAILY NARRATIVE LOOPS ==========
Generate exactly 7 distinct emails. For each day use this strict layout format:
[EMAIL_DAY_X]
SUBJECT: (High open-rate subject line)
PREHEADER: (Curiosity inducing preview line)
BODY:
(Write a rich, value-driven email here. Use clear spacing, problem-agitate-solution layouts, strong bullet points, and authoritative structures. Do not wrap in a full HTML layout, just provide cleanly formatted content blocks with markdown text that can drop into email template slots. Transition the narrative structurally at the end to provide the explicit resolutions, program selections, and products backed by Masters' Union.)
CTA: (Clear contextual hyperlinked action anchor text phrase for Masters' Union)
[END_EMAIL_DAY_X]`;

  try {
    // PRODUCTION FIX: Upgraded model to qwen3.6-plus per architecture specifications
    const rawOutput = await groqGenerate(systemPrompt, userPrompt, {
      model: "qwen3.6-plus",
      temperature: 0.6,
      maxTokens: 4000 
    });

    return parseGeneratedCluster(rawOutput);
  } catch (error) {
    console.error("Content Generation Agent Failure:", error.message);
    throw error;
  }
}

function parseGeneratedCluster(rawText) {
  const titleMatch = rawText.match(/TITLE:\s*(.+)/i);
  const excerptMatch = rawText.match(/EXCERPT:\s*(.+)/i);

  let blogContent = "";
  
  // PRODUCTION FIX: Optimized Lookahead Regex pattern to accept variable boundary layouts,
  // varying lengths of equal signs (=), block text variations, or direct drops into the day tags.
  const contentSectionMatch = rawText.match(/CONTENT:\s*([\s\S]*?)(?=^={3,}\s*BLOCK\s*2|^==*|\[WHATSAPP_DAY_1\]|========== BLOCK 2:)/im);
  
  if (contentSectionMatch && contentSectionMatch[1].trim().length > 50) {
    blogContent = contentSectionMatch[1].trim();
  } else {
    // Fallback extraction strategies if formatting patterns shift
    const fallbackStart = rawText.search(/CONTENT:/i);
    const whatsappStart = rawText.search(/\[WHATSAPP_DAY_1\]/i);
    
    if (fallbackStart !== -1 && whatsappStart !== -1 && whatsappStart > fallbackStart) {
      blogContent = rawText.substring(fallbackStart + 8, whatsappStart).replace(/={3,}\s*BLOCK\s*2.*/gi, "").trim();
    } else if (fallbackStart !== -1) {
      blogContent = rawText.substring(fallbackStart + 8).trim();
    }
  }

  // Debugging utility to inspect raw pipeline output lengths when parsing drops below threshold
  if (blogContent.split(/\s+/).length < 20) {
    console.log("⚠️ Parser Alert: Extracted content length is unusually short. Falling back to structured search wrapper.");
    blogContent = rawText.trim();
  }

  // Parsing 7-Day WhatsApp Matrix
  const whatsappCalendar = [];
  for (let i = 1; i <= 7; i++) {
    const startTag = `[WHATSAPP_DAY_${i}]`;
    const endTag = `[END_WHATSAPP_DAY_${i}]`;
    const s = rawText.indexOf(startTag);
    const e = rawText.indexOf(endTag);

    if (s !== -1 && e !== -1) {
      const chunk = rawText.substring(s + startTag.length, e).trim();
      whatsappCalendar.push({
        day: i,
        theme: extractSubField(chunk, "THEME"),
        hook: extractSubField(chunk, "HOOK"),
        bodyText: extractWhatsAppBody(chunk),
        callToAction: extractSubField(chunk, "CTA")
      });
    }
  }

  // Parsing 7-Day Email Campaigns
  const emailCalendar = [];
  for (let i = 1; i <= 7; i++) {
    const startTag = `[EMAIL_DAY_${i}]`;
    const endTag = `[END_EMAIL_DAY_${i}]`;
    const s = rawText.indexOf(startTag);
    const e = rawText.indexOf(endTag);

    if (s !== -1 && e !== -1) {
      const chunk = rawText.substring(s + startTag.length, e).trim();
      emailCalendar.push({
        day: i,
        subjectLine: extractSubField(chunk, "SUBJECT"),
        preheaderText: extractSubField(chunk, "PREHEADER"),
        bodyHtml: extractEmailBody(chunk),
        callToAction: extractSubField(chunk, "CTA")
      });
    }
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : "Untitled Strategy Guide",
    excerpt: excerptMatch ? excerptMatch[1].trim() : "",
    content: blogContent,
    whatsappCalendar,
    emailCalendar
  };
}

function extractSubField(chunk, key) {
  const match = chunk.match(new RegExp(`${key}:\\s*(.+)`, "i"));
  return match ? match[1].trim() : "";
}

function extractWhatsAppBody(chunk) {
  const bodyStart = chunk.search(/BODY:/i);
  const ctaStart = chunk.search(/CTA:/i);
  if (bodyStart !== -1 && ctaStart !== -1) {
    return chunk.substring(bodyStart + 5, ctaStart).trim();
  }
  return chunk;
}

function extractEmailBody(chunk) {
  const bodyStart = chunk.search(/BODY:/i);
  const ctaStart = chunk.search(/CTA:/i);
  if (bodyStart !== -1) {
    const endIdx = ctaStart !== -1 ? ctaStart : chunk.length;
    return chunk.substring(bodyStart + 5, endIdx).trim();
  }
  return chunk;
}

module.exports = blogGeneratorAgent;