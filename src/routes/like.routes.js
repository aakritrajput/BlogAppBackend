import { Router } from "express"
import { toggleBlogLike, toggleCommentLike, getBlogLikes, getBlogLikesCount, getCommentLikesCount,isCommentLiked, getUsersLikedBlogs } from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.route("/toggleBlogLike/:blogId").patch(verifyJWT ,toggleBlogLike)
router.route("/toggleCommentLike/:commentId").patch(verifyJWT, toggleCommentLike)
router.route("/blogLikes/:blogId").get(verifyJWT, getBlogLikes)
router.route("/blogLikesCount/:blogId").get(verifyJWT, getBlogLikesCount)
router.route("/commentLikesCount/:commentId").get(verifyJWT, getCommentLikesCount)
router.route("/usersLikedBlogs").get(verifyJWT, getUsersLikedBlogs)
router.route("/isCommentLiked/:commentId").get(verifyJWT, isCommentLiked)

export default router