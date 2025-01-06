import {Router} from "express" 
import { upload } from "../middlewares/multer.middleware.js"
import { 
    changeBannerPic, 
    changePassword, 
    changeProfilePic, 
    getBloggers, 
    getCurrentUserProfile, 
    getSavedBlogs, 
    getUserProfile, 
    loginUser, 
    logoutUser, 
    registerUser, 
    resendVerificationLink, 
    resetPassword, 
    sendOTP, 
    updateProfile, 
    verifyOTP, 
    verifyToken } from "../controllers/user.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()
router.route("/register").post(
    upload.fields([                   // middleware to upload files through multer on local server before calling a controller or method ..
        {name: "profilePic", maxCount: 1},
        {name: "bannerPic", maxCount: 1}
    ]), registerUser
)
router.route("/register/verify-token").get(verifyToken)
router.route("/login").post(loginUser)
router.route("/resendVerificationLink/:email").get(resendVerificationLink)
router.route("/logout").get(verifyJWT, logoutUser)
router.route("/changePassword").patch(verifyJWT, changePassword)
router.route("/sendOTP").patch(sendOTP)
router.route("/verifyOTP").patch(verifyOTP)
router.route("/resetPassword").patch(resetPassword)
router.route("/changeProfilePic").patch(verifyJWT, upload.single("profilePic"), changeProfilePic)
router.route("/changeBannerPic").patch(verifyJWT, upload.single("bannerPic"), changeBannerPic)
router.route("/updateProfile").patch(verifyJWT, updateProfile)
router.route("/bloggers").get(verifyJWT, getBloggers)
router.route("/userProfile/:userId").get(verifyJWT, getUserProfile)
router.route("/profile").get(verifyJWT, getCurrentUserProfile)
router.route("/savedBlogs").get(verifyJWT, getSavedBlogs)

export default router