import { Router } from "express";
import { toggleFollow, removeFollower, getUserFollowers, getUserFollowings, followersCount, isFollowing} from "../controllers/followings.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/toggleFollow/:bloggerId").patch(verifyJWT, toggleFollow)
router.route("/removeFollower/:followerId").delete(verifyJWT, removeFollower)
router.route("/userFollowers/:bloggerId").get(verifyJWT, getUserFollowers)
router.route("/userFollowings/:userId").get(verifyJWT, getUserFollowings)
router.route("/followerAndFollowingCount/:userId").get(verifyJWT, followersCount)
router.route("/followingStatus/:bloggerId").get(verifyJWT, isFollowing)

export default router