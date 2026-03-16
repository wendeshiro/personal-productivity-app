import express from "express";
import {
  createActivity,
  deleteActivity,
  renderContinueActivity,
  renderHome,
  renderNewActivity,
  renderTimerScreen,
} from "../controllers/activitiesController.js";

const router = express.Router();

router.get("/", renderHome);
router.get("/activities/new", renderNewActivity);
router.get("/activities/continue", renderContinueActivity);
router.get("/activities/timer", renderTimerScreen);
router.post("/activities", createActivity);
router.post("/activities/:id/delete", deleteActivity);

export default router;
