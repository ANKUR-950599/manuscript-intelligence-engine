const axios = require("axios");

const QWEN_API_KEY = process.env.QWEN_API_KEY || "";
const DEFAULT_MODEL = process.env.QWEN_MODEL || "qwen3.7-max";
const QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

function ensureApiKey() {
  if (!QWEN_API_KEY) {
    throw new Error("Missing QWEN_API_KEY environment variable for Qwen API access.");
  }
}

function buildQwenHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${QWEN_API_KEY.trim()}`,
  };
}

async function groqGenerate(arg1, arg2, arg3) {
  try {
    ensureApiKey();

    let messages = [];
    let model = DEFAULT_MODEL;
    let extraOptions = {};

    if (Array.isArray(arg1)) {
      messages = arg1;
      if (typeof arg2 === "string") model = arg2;
      if (typeof arg2 === "object") extraOptions = arg2;
      if (typeof arg3 === "object") extraOptions = arg3;
    } else if (typeof arg1 === "string" && typeof arg2 === "string") {
      messages = [
        { role: "system", content: arg1 },
        { role: "user", content: arg2 }
      ];
      if (typeof arg3 === "string") model = arg3;
      if (typeof arg3 === "object") extraOptions = arg3;
    } else if (typeof arg1 === "string") {
      messages = [{ role: "user", content: arg1 }];
      if (typeof arg2 === "string") model = arg2;
      if (typeof arg2 === "object") extraOptions = arg2;
    }

    const requestModel = extraOptions.model || model;
    const requestTemp = extraOptions.temperature !== undefined ? extraOptions.temperature : 0.7;
    const requestMaxTokens = extraOptions.maxTokens || extraOptions.max_tokens || 4000;
    
    // Explicitly activating Deep Research/Web-Search context mode for Qwen
    const enableDeepSearch = extraOptions.enable_search !== undefined ? extraOptions.enable_search : true;

    const response = await axios.post(
      `${QWEN_BASE_URL}/chat/completions`,
      {
        model: requestModel,
        messages,
        temperature: requestTemp,
        max_tokens: requestMaxTokens,
        enable_search: enableDeepSearch
      },
      {
        headers: buildQwenHeaders(),
      }
    );

    const message = response?.data?.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error(`Qwen generation returned no text: ${JSON.stringify(response?.data)}`);
    }

    return message;
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message || error;
    throw new Error(`Qwen generation failed: ${JSON.stringify(errorDetails)}`);
  }
}

let runtimeEmbeddingExtractor = null;

async function groqEmbed(text) {
  try {
    if (!runtimeEmbeddingExtractor) {
      const { pipeline } = await import("@xenova/transformers");
      runtimeEmbeddingExtractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }

    const cleanText = (text || "").replace(/\s+/g, " ").trim().substring(0, 1000);
    if (!cleanText) {
      return new Array(384).fill(0);
    }

    const output = await runtimeEmbeddingExtractor(cleanText, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  } catch (error) {
    throw new Error(`Qwen embedding failed (Local Vector Pipeline Error): ${error.message}`);
  }
}

/**
 * Interface Adapters matching Multi-Agent Core Execution Framework contracts
 */
async function generate(arg1, arg2, arg3) {
  return groqGenerate(arg1, arg2, arg3);
}

async function deepResearch(arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    let extraOptions = typeof arg2 === "object" ? { ...arg2 } : (typeof arg3 === "object" ? { ...arg3 } : {});
    extraOptions.enable_search = true;
    return groqGenerate(arg1, typeof arg2 === "string" ? arg2 : undefined, extraOptions);
  } else if (typeof arg1 === "string" && typeof arg2 === "string") {
    let extraOptions = typeof arg3 === "object" ? { ...arg3 } : {};
    extraOptions.enable_search = true;
    return groqGenerate(arg1, arg2, extraOptions);
  } else {
    let extraOptions = typeof arg2 === "object" ? { ...arg2 } : {};
    extraOptions.enable_search = true;
    return groqGenerate(arg1, typeof arg2 === "string" ? arg2 : undefined, extraOptions);
  }
}

async function embed(text) {
  return groqEmbed(text);
}

module.exports = {
  groqGenerate,
  generateCompletion: groqGenerate,
  groqEmbed,
  getEmbedding: groqEmbed,
  getEmbeddings: groqEmbed,
  generate,
  deepResearch,
  embed
};