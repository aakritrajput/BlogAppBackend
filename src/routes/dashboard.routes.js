import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { dashboard } from "../controllers/dashboard.controller.js";

const router = Router();
router.route("/").get(verifyJWT, dashboard)

export default router 