import mongoose from "mongoose";
import {asyncHandler} from "../utils/AsyncHandler.js";
import {User} from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const generateVerificationToken = (email) => {
    const token = jwt.sign({email}, process.env.VERIFICATION_TOKEN_SECRET , { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY });
    return token;
  };

const sendVerificationEmail = async (email, token) => {
    try {

      const verificationLink = `http://localhost:5000/api/v1/user/register/verify-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      const transporter = nodemailer.createTransport({
        service: "gmail", // Use Gmail's service
        auth: {
          user: process.env.PROJECT_OWNER_EMAIL, // Project's email
          pass: process.env.PROJECT_OWNER_PASSWORD, // Project's email password
        },
      });
  
      const mailOptions = {
        from: `"BlogApp" <${process.env.PROJECT_OWNER_EMAIL}>`, // Sender
        to: email, // Recipient
        subject: "Email Verification", // Email subject
        html: `
          <p>Hello,</p>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
  
      console.log("Verification email sent successfully to:", email);
    } catch (error) {
      console.log("Failed to send verification email:", error.message);
      throw new ApiError(500, error.message || "Email sending failed. Please try again.");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details 
    // validate details -- not empty
    // check if user already exists by email or username  
    // get files
    // upload files on cloudinary 
    // create user with email unverified 
    // send verification email 

    try {
        const {username, fullname, email, password, bio=""} = req.body
    
        const requiredFields = { username, fullname, email, password };
        
        // Check for missing fields
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value) // Check for falsy values
            .map(([key]) => key); // Extract field names
        
        if (missingFields.length > 0) {
            throw new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`);
        }
    
        const existingUser = await User.find({
            $or: [
                { email },
                { username }
            ]
        })

        if(existingUser.length > 0){
            console.log(existingUser)
            throw new ApiError(400, "user already exists with the given username or email!!")
        }
       console.log(req.files)
        const ProfilePicLocalUrl = req.files?.profilePic? req.files.profilePic[0].path : "";
        const ProfilePic = ProfilePicLocalUrl.length>0 ? await uploadOnCloudinary(ProfilePicLocalUrl) : "";

        const BannerPicLocalUrl = req.files.bannerPic? req.files.bannerPic[0].path : "";
        const BannerPic = BannerPicLocalUrl.length>0 ? await uploadOnCloudinary(BannerPicLocalUrl) : "";
    
        const user = await User.create({
            username,
            fullname,
            email,
            password,
            profilePic : ProfilePic?.url || "",
            bannerPic : BannerPic?.url || "",
            bio
        })
        if(!user){
            throw new ApiError(500, "something went wrong while registering the user !!")
        }
        const verificationToken = generateVerificationToken(email);
        await sendVerificationEmail(email, verificationToken)
    
        const createdUser = await User.findById(user._id).select("-password -verificationToken")
    
        res.status(201).json(new ApiResponse(201, createdUser, "user created SuccessFully !! Check your email for email-verification .."))
    
    } catch (error) {
        throw new ApiError(500, error.message || "error registering user !!")
    }
})

const verifyToken = asyncHandler(async(req,res)=>{
    const {token, email} = req.query;
    const decodedToken = decodeURIComponent(token)
    const decodedEmail = decodeURIComponent(email)
    //console.log(`decodedToken: ${decodedToken} , decodedEmail: ${decodedEmail}`)
    try {
        if(!decodedToken || !decodedEmail){
            throw new ApiError(500, "error decoding uri components")
        }
        const user = await User.find({
                email: decodedEmail
            })
        if(user.length === 0){
            throw new ApiError("error getting the user with decoded email")
        }
        const token = await jwt.verify(decodedToken, process.env.VERIFICATION_TOKEN_SECRET)
        //console.log(user)
        if(token.email !== user[0].email){
            console.log("token.email: ", token.email, "user.email: ", user.email)
            throw new ApiError(400, "email in token does not match with the email in the database")
        }
        user[0].isVarified = true;
        await user[0].save({validateBeforeSave: false})
        res.status(200).json(new ApiResponse(200, {}, "email successfully verified !!"))
    } catch (error) {
        throw new ApiError(404, error.message || "verification link expired or not valid !! Request for another verification link ")
    }
})

const loginUser = asyncHandler(async(req, res)=>{
    // get login details 
    // validate details -- provided or not
    // check for the user in database and check if he is verified or not ? 
    // if not verified ask him to verify or regenarate verification email !!
    // if verified compare password 
    // then genarae access token and refresh token 
    // send response along with cookies containing access and refresh tokens !!!

    try {
        const {emailOrUsername, password} = req.body
        if(!emailOrUsername || !password){
            throw new ApiError(400, "Both email or username and password is required !!")
        }
    
        const user = await User.find({
            $or : [
                {email: emailOrUsername},{username: emailOrUsername}
            ]
        })
    
        if(user.length === 0){
            throw new ApiError(400, "user with the given email or username does not exist!!")
        }
    
        if(user[0].isVarified === false){
            throw new ApiError(402, "Your email is not verified !! check email-box for varification link or request for new link")
        }
    
        const isPasswordCorrect = await user[0].comparePassword(password)
        if(!isPasswordCorrect){
            throw new ApiError(400, "Incorrect password")
        }
    
        const accessToken = await user[0].generateAccessToken()
        if(!accessToken){
            throw new ApiError(500, "error genarating access token !")
        }
        const refreshToken = await user[0].generateRefreshToken()
        if(!refreshToken){
            throw new ApiError(500, "error genarating refresh token !")
        }
    
        const loggedInUser = await User.findById(user[0]._id).select("-password")
    
        const options = {  // cookies can not be modified by frontend but only from the server by this setting or options 
           httpOnly: true,
           secure: true
        }
     
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, loggedInUser, "User logged in successfully"))
    
    } catch (error) {
        throw new ApiError(500, error.message || "error logging user in ..")
    }
})

const resendVerificationLink = asyncHandler(async(req, res)=> {
    try {
        const {email} = req.body
        const user = await User.find({email})
        if(user.length === 0){
            throw new ApiError(400, "No user with the given email !!")
        }
        if(user[0].isVarified ){
            throw new ApiError(400, "User with the given email is already verified")
        }
        const verificationToken = generateVerificationToken(user[0].email);
        await sendVerificationEmail(user[0].email, verificationToken);
        res.status(200).json(new ApiResponse(200, {},"verification link sent successfully"))
    } catch (error) {
        throw new ApiError(500, "Error Sending Verification link")
    }
})

const logoutUser = asyncHandler(async(req, res)=> {
    const options = {  
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const changePassword = asyncHandler(async(req, res)=>{
    try {
        const {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword){
            console.log("both are required !!")
            throw new ApiError(400, "Both , old and new passwords are required !!")
        }
        const user = await User.findById(req.user._id);
        const isPassCorrect = await user.comparePassword(oldPassword);
        if(!isPassCorrect){
            throw new ApiError(400, "Incorrect old password")
        }
        user.password = newPassword;
        await user.save({validateBeforeSave: false})
    
        res.status(200).json(new ApiResponse(200, "password changed successfully!!"))
    } catch (error) {
        throw new ApiError(500, error.message || "Error changing the password")
    }
})

const sendOTP = asyncHandler(async(req, res)=>{
    try {
        const {email} = req.body
        if(!email){
            throw new ApiError(400, "email is required to reset the password !!")
        }
        const user = await User.find({email})
        if(user.length === 0){
            throw new ApiError(400, "No user exists with the given email !!")
        }
        const OTP = Math.floor(1000 + Math.random() * 900000)
        const otpExpiry = Date.now() + 2 * 60 * 1000 // 2minute expiry 

        user[0].otp = OTP
        user[0].otpExpiry = otpExpiry
        await user[0].save({validateBeforeSave:false})

        const transporter = nodemailer.createTransport({
            service: "gmail", // Use Gmail's service
            auth: {
              user: process.env.PROJECT_OWNER_EMAIL, 
              pass: process.env.PROJECT_OWNER_PASSWORD, 
            },
          });
      
          const mailOptions = {
            from: `"BlogApp" <${process.env.PROJECT_OWNER_EMAIL}>`, 
            to: email, 
            subject: "Password Reset OTP",
            text: `Your OTP for resetting the password is: ${OTP}. It is valid for 2 minutes.`,    
          };
    
          await transporter.sendMail(mailOptions);
      
          console.log("Password Reset OTP sent successfully to email:", email);
          res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully to the registered email !!"))

    } catch (error) {
        throw new ApiError(500, error.message || "error sending OTP")
    }
    
})

const verifyOTP = asyncHandler(async(req, res)=> {
    try {
        const {email, otp} = req.body
        if(!email || !otp){
            throw new ApiError(400, "both email and otp are required to verify OTP")
        }
        const user = await User.find({email})
        if(user.length === 0){
            throw new ApiError(400, "No user with given email")
        }
    
        if(user[0].otp !== Number(otp) || user[0].otpExpiry < Date.now()){
            throw new ApiError(400, "OTP expired or Invalid")
        }
    
        user[0].otp = undefined;
        user[0].otpExpiry = undefined;
        user[0].save({validateBeforeSave:false})
        res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"))
    } catch (error) {
        throw new ApiError(400, error.message || "error verifying otp")
    }
})

const resetPassword = asyncHandler(async(req, res)=> {
    const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(!user.isVarified){
        throw new ApiError(400, "the given email is not verified request for verification link and check your email !!")
    }
    // Update password and clear OTP fields
    user.password = newPassword; 
    await user.save({validateBeforeSave:false});

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    throw new ApiError(500, error.message || "error reseting your password !")
  }
})

const changeProfilePic = asyncHandler(async(req,res)=>{
   try {
     const profilePic = req.file?.path
     if(!profilePic){
         throw new ApiError(400, "profile pic is required to change the profile pic !!")
     }
     const user = req.user
     const oldProfilePic = user.profilePic
     if(oldProfilePic.length > 0){
         await deleteFromCloudinary(oldProfilePic)
     }
     const newProfilePic = await uploadOnCloudinary(profilePic)
     user.profilePic = newProfilePic.url
     await user.save({validateBeforeSave:false})
 
     res.status(200).json(new ApiResponse(200, {profilePic: user.profilePic}, "Profile Pic changed successfully"))
   } catch (error) {
    throw new ApiError(500, error.message || "error changing profile pic !!")
   }
})

const changeBannerPic = asyncHandler(async(req,res)=>{
    try {
      const bannerPic = req.file?.path
      if(!bannerPic){
          throw new ApiError(400, "bannerPic is required to change the banner pic !!")
      }
      const user = req.user
      const oldBannerPic = user.bannerPic
      if(oldBannerPic.length > 0){
          await deleteFromCloudinary(oldBannerPic)
      }
      const newBannerPic = await uploadOnCloudinary(bannerPic)
      user.bannerPic = newBannerPic.url
      await user.save({validateBeforeSave:false})
  
      res.status(200).json(new ApiResponse(200, {newBannerPic: user.bannerPic}, "Banner Pic changed successfully"))
    } catch (error) {
     throw new ApiError(500, error.message || "error changing Banner pic !!")
    }
 })

const updateProfile = asyncHandler(async(req,res)=>{
    try {
        const {fullname, bio} = req.body
        if(!fullname){
            throw new ApiError(400, "fullname is required to update the profile !!")
        }
        const user = req.user
        user.fullname = fullname
        user.bio = bio
        await user.save({validateBeforeSave:false})
        res.status(200).json(new ApiResponse(200, {user}, "Profile updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "error updating the profile !!")
    }
})

const getBloggers = asyncHandler(async(req, res)=> {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Search query is required" });
    }
    
    try {
        const users = await User.find({
            $or: [
                {username: {$regex : query , $options: "i"}},
                {fullname: {$regex : query , $options: "i"}}
            ]
        }).select("fullname username profilePic ")
        res.status(200).json(new ApiResponse(200, users, "fetched matching users !!"))
    } catch (error) {
        throw new ApiError(500, "No user found with the matching username")
    }
})

const getUserProfile = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    if(!query){
        throw new ApiError(400, "query is required")
    }
    try {
        const userProfile = await User.findById(userId).select("-password -otp -otpExpiry")
        if(userProfile.length === 0){
            throw new ApiError(400, "No user found with the given username")
        }
        res.status(200).json(new ApiResponse(200, userProfile, "fetched user profile successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "error fetching users profile")
    }
})

const getCurrentUserProfile = asyncHandler(async(req, res)=> {
   try {
       const user = req.user
       res.status(200).json(new ApiResponse(200, user, "fetched current user profile successfully !"))
   } catch (error) {
       throw new ApiError(500, error.message || "error fetching users profile")
   }
})

const getSavedBlogs = asyncHandler(async(req, res)=> {
    try {
        const user = req.user
        const savedBolgs = await User.aggregate([
            {
                $match: {
                    _id : new mongoose.Types.ObjectId(user._id)
                }
            },
            {
                $unwind: '$savedBlogs'
            },
            {
                $lookup: {
                    from : "blogs",
                    localField: "savedBlogs",
                    foreignField : "_id",
                    as:'savedBlogDetails'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    username: {$first: '$username'},
                    fullname: {$first: '$fullname'},
                    savedBlogs: {$push: { $arrayElemAt: ['$savedBlogDetails',0]}}
                }
            }
        ])
        if(!savedBolgs){
            throw new ApiError(200, "error getting saved Blogs")
        }
        res.status(200).json( new ApiResponse(200, savedBolgs, "fetched saved blogs successfully !!"))
    } catch (error) {
        throw new ApiError(500, error.message || "error getting saved Blogs")
    }
}) 

export {
    registerUser,
    verifyToken,
    loginUser,
    resendVerificationLink,
    logoutUser,
    changePassword,
    sendOTP,
    verifyOTP,
    resetPassword,
    changeProfilePic,
    changeBannerPic,
    updateProfile,
    getBloggers,
    getUserProfile,
    getCurrentUserProfile,
    getSavedBlogs
}