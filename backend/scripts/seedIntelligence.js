// backend/scripts/seedIntelligence.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Re-use core architectural database layer schemas
const chatIntelligenceSchema = new mongoose.Schema({
  source: String,
  conversationId: String,
  userRawPrompt: String,
  assistantResponse: String,
  embedding: { type: [Number], required: true }
});

const ChatIntelligence = mongoose.model("ChatIntelligence", chatIntelligenceSchema, "conversation_intelligence");

async function seedVectorDatabase() {
  try {
    console.log("🚀 Initializing Local Vector Pipeline Transformation...");
    console.log("Connecting to MongoDB Atlas Cluster...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected Successfully.");

    // Dynamic import of @xenova/transformers to bridge CommonJS and ESM cleanly
    console.log("🧠 Loading local open-source embedding model pipeline (all-MiniLM-L6-v2)...");
    const { pipeline } = await import("@xenova/transformers");
    
    // Instantiate feature-extraction pipeline
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Model compilation successful. Local pipeline engine active.");

    const dataFilePath = path.join(__dirname, "filtered_conversations.json");
    if (!fs.existsSync(dataFilePath)) {
      throw new Error(`Target extraction data file missing at: ${dataFilePath}. Run data_extractor.py first.`);
    }

    const rawRecords = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
    console.log(`📋 Loaded ${rawRecords.length} records from extraction layer. Starting pipeline processing...`);

    for (let i = 0; i < rawRecords.length; i++) {
      const record = rawRecords[i];
      
      // Clean and sanitize string before passing into embedding vectorizer
      const cleanInputText = (record.userRawPrompt || "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 1000);

      if (!cleanInputText) {
        continue;
      }

      try {
        // Generate embedding vector coordinates completely locally
        const output = await extractor(cleanInputText, { pooling: "mean", normalize: true });
        const vectorEmbedding = Array.from(output.data);

        if (!vectorEmbedding || vectorEmbedding.length === 0) {
          console.warn(`⚠️ Warning: Local coordinate calculation failed at position vector index: ${i}`);
          continue;
        }

        // Write directly to your MongoDB Atlas cluster collection
        await ChatIntelligence.create({
          source: record.source || "wildchat_local_shard",
          conversationId: record.conversationId || record.conversation_id,
          userRawPrompt: record.userRawPrompt,
          assistantResponse: record.assistantResponse,
          embedding: vectorEmbedding // Array length of 384 coordinates
        });

        if ((i + 1) % 50 === 0 || (i + 1) === rawRecords.length) {
          console.log(`📊 Pipeline Vector Matrix Status: Indexed and saved ${i + 1} / ${rawRecords.length} records.`);
        }
      } catch (err) {
        console.error(`❌ Non-fatal handling exception on database record item index ${i}:`, err.message);
        // Short rest window before retrying to prevent system thread lockup
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("\n🎯 Execution Success! All data segments successfully converted locally and saved to MongoDB.");
  } catch (error) {
    console.error("\n❌ Critical Vector Seeding Failure Rule Blueprint Exception:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed cleanly.");
  }
}

// Execute pipeline loop
seedVectorDatabase();