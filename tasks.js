const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("./Task");
const authMiddleware = require("./authMiddleware");
const redisClient = require("./redisClient");

const router = express.Router();

const TASK_LIST_TTL = 300; // 5 minutes

// Helper to build cache keys
function getTaskListKey(userId) {
  return `tasks:${userId}`;
}
function getTaskKey(userId, taskId) {
  return `task:${userId}:${taskId}`;
}

// Get all tasks for logged-in user (with Redis cache)
router.get("/", authMiddleware, async (req, res) => {
  const cacheKey = getTaskListKey(req.user);
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const tasks = await Task.find({ user: req.user }).sort({ createdAt: -1 });
    await redisClient.set(cacheKey, JSON.stringify(tasks), "EX", TASK_LIST_TTL);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get single task by ID (with Redis cache)
router.get("/:id", authMiddleware, async (req, res) => {
  const cacheKey = getTaskKey(req.user, req.params.id);
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const task = await Task.findOne({ _id: req.params.id, user: req.user });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    await redisClient.set(cacheKey, JSON.stringify(task), "EX", TASK_LIST_TTL);
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Invalidate cache helper
async function invalidateTaskCache(userId, taskId) {
  await redisClient.del(getTaskListKey(userId));
  if (taskId) await redisClient.del(getTaskKey(userId, taskId));
}

// Add new task (invalidate cache)
router.post(
  "/",
  [
    authMiddleware,
    body("taskName").notEmpty(),
    body("dueDate").notEmpty().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { taskName, description, dueDate } = req.body;
      const task = new Task({
        user: req.user,
        taskName,
        description,
        dueDate,
      });
      await task.save();
      await invalidateTaskCache(req.user);
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Update task (invalidate cache)
router.put(
  "/:id",
  [
    authMiddleware,
    body("taskName").notEmpty(),
    body("dueDate").notEmpty().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { taskName, description, dueDate } = req.body;
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user },
        { taskName, description, dueDate },
        { new: true }
      );
      if (!task) return res.status(404).json({ msg: "Task not found" });
      await invalidateTaskCache(req.user, req.params.id);
      res.json(task);
    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Delete task (invalidate cache)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    await invalidateTaskCache(req.user, req.params.id);
    res.json({ msg: "Task deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Clear all cache (admin or for demo)
router.post("/clear-cache", async (req, res) => {
  try {
    await redisClient.flushall();
    res.json({ msg: "Cache cleared" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to clear cache" });
  }
});

module.exports = router;
