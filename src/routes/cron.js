import express from "express";
import { autoAlphaStudents } from "../controllers/cronController.js";

const router = express.Router();

router.post("/attendance/auto-alpha", autoAlphaStudents);

export default router;
