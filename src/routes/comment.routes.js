import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createComment, deleteComment, getblogComments } from "../controllers/comment.controller.js";

const router = Router();
router.route("/postComment/:blogId").post(verifyJWT, createComment);
router.route("/deleteComment/:commentId").delete(verifyJWT, deleteComment);
router.route("/blogComments/:blogId").get(verifyJWT, getblogComments);

export default router;