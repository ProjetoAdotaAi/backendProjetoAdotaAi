import { Router } from "express";
import { handleReport } from "../controllers/reportController.js";

const router = Router();

router.post("/", handleReport);

export default router;