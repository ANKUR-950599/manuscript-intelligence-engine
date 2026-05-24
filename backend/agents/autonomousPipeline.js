/**
 * Master Control Script — Multi-Loop Execution System.
 * Safe for both standalone CRON tasks and Express Server orchestration.
 * Completely reconstructed and updated to safely forward high-volume intelligence records.
 */
const path = require("path");
const mongoose = require("mongoose");

if (!process.env.MONGODB_URI) {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
  if (!process.env.MONGODB_URI) {
    require("dotenv").config({ path: path.join(__dirname, "./.env") });
  }
}

const personaAgent = require("../agents/personaAgent");
const researchAgent = require("../agents/researchAgent");
const competitorAgent = require("../agents/competitorAgent");
const orchestratorAgent = require("../agents/orchestratorAgent");
const blogGeneratorAgent = require("../agents/blogGeneratorAgent");
const validationAgent = require("../agents/validationAgent");

const TopicSchema = new mongoose.Schema({
  rank: Number,
  title: String,
  coreAngle: String,
  emotionalHook: String,
  painPointsAddressed: [String],
  targetKeywords: [String],
  seoGap: String,
  category: String,
  targetLocation: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});
const TopicQueue = mongoose.models.TopicQueue || mongoose.model("TopicQueue", TopicSchema, "topic_queue");

const ContentOutputSchema = new mongoose.Schema({
  topicId: mongoose.Schema.Types.ObjectId,
  title: String,
  excerpt: String,
  blogBody: String,
  whatsappCalendar: Array,
  emailCalendar: Array,
  publishedToWeb: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const ContentQueue = mongoose.models.ContentQueue || mongoose.model("ContentQueue", ContentOutputSchema, "content_queue");

// UPGRADED STATE: Injected massive structural keywords and model routing configurations directly into context layers
const staticBusinessContext = { 
  audienceCategory: "College Grads / Freshers", 
  biggestProblem: "No practical exposure to tax filing or TallyPrime ERP", 
  educationBackground: "B.Com / Commerce",
  systemIntelligenceLayer: {
    preferredModel: "qwen3.7-max",
    enableDeepResearch: true,
    searchDepth: "advanced"
  },
  massiveKeywordDictionary: [
    "accounting", "tally", "gst", "jobsearch", "freshersjobs", "incometax", 
    "bookkeeping", "ca", "charteredaccountant", "audit", "finance", "taxation", 
    "tallyerp9", "tallyprime", "tds", "invoicingsystem", "payroll", "bcom", "mcom", 
    "corporatefinance", "accountant", "financialanalysis", "balancesheet", 
    "ledger", "accountingskills", "careerdevelopment", "placement", "corporate compliance",
    "statutory audit", "tax returns", "provident fund", "esi compliance", "accounting automation",
    "financial reporting", "reconciliation", "quickbooks", "sap fico", "excel for finance"
  ]
};

const personaTemplates = [{ audienceCategory: "Unemployed Commerce Graduate", psychologyLayer: { identityBelief: "My college degree is a piece of paper without practical skills.", emotionalFrustration: "Rejected at interviews because I don't know real office billing." }, painArchitecture: { hiddenFears: ["Facing absolute financial dependency", "Disappointing family after investments"], liveDailyLifeSituations: ["Scrolling job portals seeing 2+ years experience requirements", "Anxious conversations with working peers"] } }];
const locationContext = { city: "Kolkata" };

const organizationContext = { 
  name: "Advance Accounting Academy", 
  solutionPitch: "Our specialized professional certification courses provide access to live structural company balance sheets, enterprise simulated invoice books, and concrete interview preparation modules.",
  systemIntelligenceLayer: {
    preferredModel: "qwen3.7-max",
    enableDeepResearch: true,
    searchDepth: "advanced"
  }
};

async function executeSystemCycle() {
  const isStandalone = require.main === module;
  
  let cycleResult = {
    title: "Autonomous Pipeline Run",
    status: "initialized",
    phase: 0
  };

  if (mongoose.connection.readyState === 0) {
    console.log("Connecting to MongoDB Atlas Cluster (Standalone Mode)...");
    if (!process.env.MONGODB_URI) {
      throw new Error("CRITICAL ERROR: MONGODB_URI is undefined. Verify pathing structure of your .env file.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Standalone database link established cleanly.");
  } else {
    console.log("🔗 Shared Connection Detected: Reusing active server database link.");
  }

  const pendingTopicsCount = await TopicQueue.countDocuments({ status: "pending" });
  console.log(`Current Queue Health: ${pendingTopicsCount} pending topics found.`);

  if (pendingTopicsCount === 0) {
    console.log("\n⚠️ Queue Exhausted. Initializing Phase 1: Heavy Multi-Agent Refill Loop...");
    console.log("📊 Active Database Connection Confirmed. Hooking conversation_intelligence stream variables...");
    
    // Step 1: Run Persona Enrichment
    const enrichedPersona = await personaAgent(personaTemplates, staticBusinessContext, locationContext);
    
    // Step 2: Run Deep Research (Triggers upgraded Tavily & expanded multi-activity Apify integrations using massive dictionary context)
    const researchInsights = await researchAgent(enrichedPersona, staticBusinessContext, locationContext);
    
    // Step 3: Run Competitor Isolation (Injected with the unedited, dense raw content channels via pipeline forwarding)
    const competitorInsights = await competitorAgent([], enrichedPersona, researchInsights);
    
    // Step 4: Run Orchestrator to generate Topics
    const newTopicsBatch = await orchestratorAgent(enrichedPersona, researchInsights, competitorInsights);
    
    console.log(`Generated ${newTopicsBatch.length} new structural topics. Seeding collection...`);
    await TopicQueue.insertMany(newTopicsBatch);
    console.log("🎯 Batch topic seeding complete. Phase 1 Loop terminated safely.");

    cycleResult = {
      title: "Queue Refilled (New Batch Generated)",
      status: "refilled",
      phase: 1,
      count: newTopicsBatch.length
    };
  } else {
    console.log("\n🚀 Pending Topics Available. Initializing Phase 2: Content Loop Generation...");
    
    const targetTopic = await TopicQueue.findOne({ status: "pending" }).sort({ rank: 1 });
    console.log(`Selected Topic: ${targetTopic.title} (Rank: ${targetTopic.rank})`);

    const personaProfileWrapper = { buyerPersona: "Commerce Graduate", identityBelief: "Degree lacks real execution loops", hiddenFears: targetTopic.painPointsAddressed };
    
    // Integrates the qwen3.7-max configuration contextualized directly through organizationContext parameters
    const fullContentPackage = await blogGeneratorAgent(targetTopic, personaProfileWrapper, organizationContext);
    
    const validationResult = await validationAgent({ title: fullContentPackage.title, content: fullContentPackage.content }, targetTopic, personaProfileWrapper);
    
    console.log(`\nValidation Processing Report | Quality Score: ${validationResult.score}/100`);
    
    if (validationResult.isValid) {
      console.log("✅ Content package approved. Saving assets to ContentQueue...");
      
      await ContentQueue.create({
        topicId: targetTopic._id,
        title: fullContentPackage.title,
        excerpt: fullContentPackage.excerpt,
        blogBody: fullContentPackage.content,
        whatsappCalendar: fullContentPackage.whatsappCalendar,
        emailCalendar: fullContentPackage.emailCalendar,
        publishedToWeb: true
      });

      targetTopic.status = "completed";
      await targetTopic.save();
      console.log(`🎯 Queue Updated. Topic ID ${targetTopic._id} marked as completed.`);

      cycleResult = {
        title: fullContentPackage.title,
        status: "completed",
        phase: 2,
        topicId: targetTopic._id
      };
    } else {
      console.log("❌ Content failed to clear production validation benchmarks.", validationResult.issues);
      cycleResult = {
        title: targetTopic.title,
        status: "failed_validation",
        phase: 2,
        issues: validationResult.issues
      };
    }
  }

  if (isStandalone) {
    await mongoose.connection.close();
    console.log("🔌 Standalone database connection closed cleanly.");
  } else {
    console.log("📡 Keeping shared database stream active for Express ecosystem APIs.");
  }

  return cycleResult;
}

if (require.main === module) {
  executeSystemCycle().catch(err => {
    console.error("Fatal System Pipeline Interruption:", err);
    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close();
    }
  });
}

module.exports = {
  executeSystemCycle,
  runAutonomousPipeline: executeSystemCycle,
};