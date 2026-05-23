# 🖋️ The Manuscript — Autonomous Marketing Intelligence Engine

The Manuscript is a production-grade, multi-agent autonomous content pipeline that transforms raw business verticals into market-validated, psychologically tuned editorial assets. Unlike traditional AI generators that "guess" content, The Manuscript operates as a data-driven intelligence engine that scrapes real-time platform trends, evaluates consumer intent via deep search, manages a self-healing content queue, and streams long-form content over active server pipelines.

## 🚀 Live Ecosystem

* **Frontend (Production):** [https://hello0123.netlify.app/](https://hello0123.netlify.app/)
* **Backend (API Engine):** [https://blog-automation-1-afvy.onrender.com](https://blog-automation-1-afvy.onrender.com)
* **Core Infrastructure:** Node.js (v24/v18 runtimes), Express, Groq Llama 3.1 Inference Engine, MongoDB Atlas Distributed Shard-Cluster, Apify Actor Web-Scalers, and Tavily Deep Search APIs.

---

## 🧠 System Architecture & Advanced Workflow

The system operates on an event-driven, automated queue-monitoring engine. It continuously tracks asset counts and executes a multi-phase extraction and production cycle.



[Cron Scheduler / Trigger] ──> [Queue Monitor Check]
│
┌──────────────────┴──────────────────┐
▼ (Queue Saturated)                   ▼ (Queue Exhausted)
[Process Next Topic]             [Phase 1: Heavy Multi-Agent Refill Loop]
│                                     │
│                       ┌─────────────┴─────────────┐
│                       ▼                           ▼
│             [Apify Social Harvester]   [Tavily Market Analyzer]
│             (FB, IG, LinkedIn Data)    (Syllabus & Intent Trends)
│                       └─────────────┬─────────────┘
│                                     ▼
│                           [Structural Topic Seeding]
│                                     │
└──────────────────┬──────────────────┘
▼
[11-Step Core Persona Engine]
▼
[Real-Time Word-by-Word SSE Stream]
▼
[Database Persistence & Memory Update]


🚀 **Local Deployment Setup :**
1. Installation Requirements
Navigate into each module workspace and install dependencies:

cd backend && npm install
cd ../frontend && npm install

2. Execution Commands
Launch the backend engine:

cd backend
npm start

3. Launch the visual user interface dashboard:

cd frontend
npm run dev

Built for the Era of Autonomous Intelligence — Data-Driven, Psychologically Grounded, and Entirely Automated.