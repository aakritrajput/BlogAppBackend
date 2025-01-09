import Router from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { createBLog, deleteBlog, getBlogById, getBlogs, getUserBlogs, searchBlogs, updateBlog } from '../controllers/blog.controller.js';

const router = Router();
router.route("/createBlog").post(verifyJWT, upload.single("coverImage"), createBLog)
router.route("/userBlogs/:userId").get(verifyJWT, getUserBlogs)
router.route("/updateBlog/:blogId").patch(verifyJWT, upload.single("coverImage"), updateBlog)
router.route("/deleteBlog/:blogId").delete(verifyJWT, deleteBlog)
router.route("/searchBlogs").get(verifyJWT, searchBlogs)
router.route("/allBlogs").get(getBlogs)
router.route("/blogById/:blogId").get(verifyJWT, getBlogById)

export default router 