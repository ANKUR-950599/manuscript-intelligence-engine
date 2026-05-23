/**
 * AI MODEL CONFIGURATION
 * Maps each agent to its designated AI model provider.
 * 
 * Model Assignment (All using Alibaba Qwen qwen3.6-plus):
 * - Persona Agent: Qwen qwen3.6-plus
 * - Research Agent: Qwen qwen3.6-plus
 * - Competitor Agent: Qwen qwen3.6-plus
 * - Content Generation Agent: Qwen qwen3.6-plus
 * - Validation Agent: Qwen qwen3.6-plus
 * - Orchestrator Agent: Qwen qwen3.6-plus
 * - Opportunity Agent: Qwen qwen3.6-plus
 */

const MODEL_CONFIG = {
  qwen: {
    model: "qwen3.6-plus",
    provider: "qwen",
    apiKeyEnv: "QWEN_API_KEY",
    maxTokens: 8192,
    temperature: 0.7
  },
  qwenLightweight: {
    model: "qwen3.6-plus",
    provider: "qwen",
    apiKeyEnv: "QWEN_API_KEY",
    maxTokens: 2000,
    temperature: 0.3
  }
};

const AGENT_MODEL_MAP = {
  personaAgent: "qwen",
  researchAgent_broad: "qwen",
  researchAgent_analytical: "qwen",
  competitorAgent: "qwen",
  orchestratorAgent: "qwen",
  contentGenerationAgent: "qwen",
  validationAgent: "qwenLightweight",
  opportunityAgent_broad: "qwen",
  opportunityAgent_analytical: "qwen"
};

module.exports = { MODEL_CONFIG, AGENT_MODEL_MAP };
