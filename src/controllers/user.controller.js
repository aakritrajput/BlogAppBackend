import mongoose from "mongoose";
import {asyncHandler} from "../utils/AsyncHandler.js";
import {User} from "../models/User.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

const generateVerificationToken = (email) => {
    const token = jwt.sign({email}, process.env.VERIFICATION_TOKEN_SECRET , { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY });
    return token;
  };

const sendVerificationEmail = async (email, token) => {
    try {

      const verificationLink = `http://localhost:5000/api/v1/user/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  
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
      console.error("Failed to send verification email:", error.message);
      throw new Error("Email sending failed. Please try again.");
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

        if(existingUser){
            throw new ApiError(400, "user already exists with the given username or email!!")
        }
    
        const ProfilePicLocalUrl = req.files?.profilePic[0]?.path;
        const ProfilePic = await uploadOnCloudinary(ProfilePicLocalUrl);
        const BannerPicLocalUrl = req.files?.bannerPic[0]?.path;
        const BannerPic = await uploadOnCloudinary(BannerPicLocalUrl);
    
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
    

    try {
        if(!decodedToken || !decodedEmail){
            throw new ApiError(500, "error decoding uri components")
        }
        const user = await User.find({
                email: decodedEmail
            })
        if(!user){
            throw new ApiError("error getting the user with decoded email")
        }
        const token = await jwt.verify(decodedToken, process.env.VERIFICATION_TOKEN_SECRET)
        if(token.email == user.email){
            user.isVarified = true;
            await user.save({validateBeforeSave: false})
        }

        res.status(200).json(200, {}, "email successfully verified !!")
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
    
        if(!user){
            throw new ApiError(400, "user with the given email or username does not exist!!")
        }
    
        if(user.isVarified === false){
            throw new ApiError(402, "Your email is not verified !! check email-box for varification link or request for new link")
        }
    
        const isPasswordCorrect = await user.comparePassword(password)
        if(!isPasswordCorrect){
            throw new ApiError(400, "Incorrect password")
        }
    
        const accessToken = await user.generateAccessToken()
        if(!accessToken){
            throw new ApiError(500, "error genarating access token !")
        }
        const refreshToken = await user.generateRefreshToken()
        if(!refreshToken){
            throw new ApiError(500, "error genarating refresh token !")
        }
    
        const loggedInUser = await User.findById(user._id).select("-password")
    
        const options = {  // cookies can not be modified by frontend but only from the server by this setting or options 
           httpOnly: true,
           secure: true
        }
     
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully"))
    
    } catch (error) {
        throw new ApiError(500, error.message || "error logging user in ..")
    }
})

const resendVerificationLink = asyncHandler(async(req, res)=> {
    try {
        const user = req.user
        const verificationToken = generateVerificationToken(email);
        await sendVerificationEmail(user.email, verificationToken);
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
            throw new ApiError(400, "Both , old and new passwords are required !!")
        }
        const user = await User.findById(req.user._id);
        const isPassCorrect = await user.comparePassword();
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

const forgotPassword = asyncHandler(async(req, res)=>{
    
})




//forgot password ---
//change profilePic or update Profile
//getuserByusername or full name --> implement search thing here !! ---
// get profile 
// get saved blogs 


