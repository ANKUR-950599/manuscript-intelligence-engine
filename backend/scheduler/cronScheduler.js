const cron = require("node-cron");
const ContentCalendar = require("../models/ContentCalendar");
const { runAutonomousPipeline } = require("../agents/autonomousPipeline");

let isRunning = false;
let lastRunAt = null;
let lastRunResult = null;
let schedulerStatus = "idle";

async function startScheduler() {
  console.log("🕐 Scheduler initialized - weekly generation on Sunday 2:00 AM IST, daily dispatch at 9:00 AM IST");

  cron.schedule("0 2 * * 0", async () => {
    console.log("🚀 Weekly pipeline triggered:", new Date().toISOString());
    await executeAutonomousRun("weekly_content_generation");
  }, { timezone: "Asia/Kolkata" });

  cron.schedule("0 9 * * *", async () => {
    console.log("📤 Daily content dispatch triggered:", new Date().toISOString());
    await dispatchDailyContent();
  }, { timezone: "Asia/Kolkata" });

  schedulerStatus = "active";
}

async function executeAutonomousRun(runType = "autonomous") {
  if (isRunning) {
    console.log("⚠ Pipeline already running. Skipping.");
    return { status: "skipped", reason: "Already running" };
  }

  isRunning = true;
  schedulerStatus = "running";
  console.log(`🤖 Starting ${runType} pipeline run...`);

  try {
    const result = await runAutonomousPipeline({
      runType,
      onStepUpdate: (logEntry) => {
        console.log(`  [${logEntry.step}] ${logEntry.status}: ${logEntry.message}`);
      },
    });

    lastRunAt = new Date();
    lastRunResult = result;
    schedulerStatus = "idle";
    isRunning = false;
    console.log(`✅ Pipeline completed: "${result.title || "Unknown"}"`);
    return result;
  } catch (err) {
    console.error("❌ Autonomous pipeline failed:", err.message);
    schedulerStatus = "error";
    isRunning = false;
    lastRunResult = { status: "failed", error: err.message };
    return lastRunResult;
  }
}

async function dispatchDailyContent() {
  try {
    const now = new Date();
    const calendar = await ContentCalendar.findOne({
      status: "active",
      weekStart: { $lte: now },
      weekEnd: { $gte: now },
    }).sort({ createdAt: -1 });

    if (!calendar || !Array.isArray(calendar.weekPlan)) {
      console.log("ℹ No active content calendar found for daily dispatch.");
      return { status: "skipped", reason: "No active calendar" };
    }

    const day = calendar.weekPlan.find((item) => {
      const d = new Date(item.date);
      return d.toDateString() === now.toDateString();
    });

    if (!day) {
      console.log("ℹ No content scheduled for today.");
      return { status: "skipped", reason: "No content for today" };
    }

    if (day.deliveryStatus?.blog === "sent" && day.deliveryStatus?.whatsapp === "sent" && day.deliveryStatus?.email === "sent") {
      console.log("ℹ Today's content already sent.");
      return { status: "skipped", reason: "Already sent" };
    }

    day.deliveryStatus = day.deliveryStatus || { blog: "pending", whatsapp: "pending", email: "pending" };
    day.deliveredAt = day.deliveredAt || { blog: null, whatsapp: null, email: null };

    if (day.blog?.content && day.deliveryStatus.blog !== "sent") {
      console.log(`📝 BLOG (${day.dayName}): ${day.blog.title}`);
      day.deliveryStatus.blog = "sent";
      day.deliveredAt.blog = new Date();
    }

    if (day.whatsapp?.message && day.deliveryStatus.whatsapp !== "sent") {
      console.log(`📱 WHATSAPP (${day.dayName}): ${day.whatsapp.headline}`);
      day.deliveryStatus.whatsapp = "sent";
      day.deliveredAt.whatsapp = new Date();
    }

    if (day.email?.body && day.deliveryStatus.email !== "sent") {
      console.log(`✉️ EMAIL (${day.dayName}): ${day.email.subject}`);
      day.deliveryStatus.email = "sent";
      day.deliveredAt.email = new Date();
    }

    await calendar.save();
    lastRunAt = new Date();
    lastRunResult = { status: "sent", contentCalendarId: calendar._id, day: day.dayName };
    return lastRunResult;
  } catch (err) {
    console.error("❌ Daily dispatch failed:", err.message);
    return { status: "failed", error: err.message };
  }
}

function getNextScheduledRun() {
  const now = new Date();
  const nextDaily = new Date(now);
  nextDaily.setHours(9, 0, 0, 0);
  if (nextDaily <= now) nextDaily.setDate(nextDaily.getDate() + 1);
  return nextDaily;
}

function getSchedulerStatus() {
  return {
    schedulerStatus,
    isRunning,
    lastRunAt,
    lastRunResult,
    nextScheduledRun: getNextScheduledRun(),
    schedule: "Weekly generation on Sunday 2:00 AM IST; daily dispatch at 9:00 AM IST",
  };
}

module.exports = {
  startScheduler,
  executeAutonomousRun,
  dispatchDailyContent,
  getSchedulerStatus,
};
