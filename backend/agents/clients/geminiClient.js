/**
 * LEGACY GROQ CLIENT ALIAS
 * Uses Groq model llama-3.3-70b-versatile for text generation
 * and Groq embeddings for vector search.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_EMBEDDING_MODEL = process.env.GROQ_EMBEDDING_MODEL || "textembedding-gecko-001";
const BASE_URL = process.env.GROQ_BASE_URL || "https://groq.googleapis.com/v1";

function ensureApiKey() {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable for Groq API access.");
  }
}

function buildGroqHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  const trimmedKey = GROQ_API_KEY.trim();
  const looksLikeApiKey = /^AIza/.test(trimmedKey);

  if (!looksLikeApiKey) {
    headers.Authorization = `Bearer ${trimmedKey}`;
  }

  return headers;
}

async function parseGroqResponse(response) {
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch (parseError) {
    return { status: response.status, ok: response.ok, rawText: text, error: parseError };
  }

  return { status: response.status, ok: response.ok, data, rawText: text };
}

async function groqGenerate(systemPrompt, userPrompt, options = {}) {
  ensureApiKey();

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const maxOutputTokens = options.maxTokens ?? 4096;
  const url = new URL(`${BASE_URL}/models/${model}:generateText`);
  const trimmedKey = GROQ_API_KEY.trim();
  if (/^AIza/.test(trimmedKey)) {
    url.searchParams.set("key", trimmedKey);
  }

  const payload = {
    prompt: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    },
    temperature,
    maxOutputTokens
  };

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: buildGroqHeaders(),
      body: JSON.stringify(payload)
    });

    const { ok, data, rawText } = await parseGroqResponse(response);
    if (!ok) {
      const errorMessage = data?.error?.message || data?.error || rawText || response.statusText;
      throw new Error(`Groq generation failed: ${errorMessage}`);
    }

    return data?.candidates?.[0]?.content || data?.output?.[0]?.content || data?.results?.[0]?.output?.content || "";
  } catch (error) {
    console.error("Groq API Error:", error.message || error);
    throw new Error(`Groq generation failed: ${error.message || error}`);
  }
}

async function groqEmbed(input, options = {}) {
  ensureApiKey();

  const model = options.model || DEFAULT_EMBEDDING_MODEL;
  const url = new URL(`${BASE_URL}/models/${model}:embedText`);
  const trimmedKey = GROQ_API_KEY.trim();
  if (/^AIza/.test(trimmedKey)) {
    url.searchParams.set("key", trimmedKey);
  }

  const payload = {
    input: Array.isArray(input) ? input : [input]
  };

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: buildGroqHeaders(),
      body: JSON.stringify(payload)
    });

    const { ok, data, rawText } = await parseGroqResponse(response);
    if (!ok) {
      const errorMessage = data?.error?.message || data?.error || rawText || response.statusText;
      throw new Error(`Groq embedding failed: ${errorMessage}`);
    }

    const embeddings = data?.data?.map(item => item?.embedding).filter(Boolean) || data?.embeddings?.map(item => item?.embedding).filter(Boolean);
    if (!embeddings || embeddings.length === 0) {
      throw new Error("Groq embedding response did not contain any embeddings.");
    }

    return embeddings.length === 1 ? embeddings[0] : embeddings;
  } catch (error) {
    console.error("Groq Embedding Error:", error.message || error);
    throw new Error(`Groq embedding failed: ${error.message || error}`);
  }
}

async function fallbackGenerate(systemPrompt, userPrompt, options = {}) {
  return groqGenerate(systemPrompt, userPrompt, options);
}

module.exports = {
  groqGenerate,
  groqEmbed,
  fallbackGenerate
};
