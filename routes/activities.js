import express from "express";
import {
  completeActivity,
  createActivity,
  deleteActivity,
  renderActivitySummary,
  renderContinueActivity,
  renderHome,
  renderNewActivity,
  restoreActivity,
  renderTimerScreen,
} from "../controllers/activitiesController.js";

const router = express.Router();

router.get("/", renderHome);
router.get("/activities/new", renderNewActivity);
router.get("/activities/continue", renderContinueActivity);
router.get("/activities/timer", renderTimerScreen);
router.post("/activities/summary", renderActivitySummary);
router.post("/activities", createActivity);
router.post("/activities/:id/delete", deleteActivity);
router.post("/activities/:id/complete", completeActivity);
router.post("/activities/restore", restoreActivity);

export default router;
