/**
 * file: backend/agents/clients/clientRegistry.js
 * Master Client Dictionary & Dependency Injection Hub
 */

const qwenClient = require('./qwenClient');
const tavilyClient = require('./tavilyClient');
const apifyClient = require('./apifyClient');

console.log('⚡ [System] Booting Central Client Registry...');

const clients = {
    qwen: qwenClient,
    tavily: tavilyClient,
    apify: apifyClient
};

module.exports = clients;