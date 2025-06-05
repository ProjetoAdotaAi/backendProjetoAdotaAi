import { Router } from "express";
import multer from "multer";
import { handleReport } from "../controllers/reportController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/", upload.single("image"), handleReport);

export default router;