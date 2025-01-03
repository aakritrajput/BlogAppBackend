import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import {Like} from "../models/like.model.js";   
import {Following} from "../models/followings.model.js";

const dashboard = asyncHandler(async(req, res)=>{
    // get user followers , user profile , user blogs , total likes
    try {
        const user = req.user
        const followers = await Following.countDocuments({blogger: user._id});
        const following = await Following.countDocuments({follower: user._id});
        const totalLikes = await Like.countDocuments({user: user._id});
        const totalBlogs = await Blog.countDocuments({author: user._id});
        const data = {
            profilePic: user.profilePic,
            bannerPic: user.bannerPic,
            username: user.username,
            fullname: user.fullname,
            followers ,
            following ,
            totalLikes ,
            totalBlogs ,
        }
        res.status(200).json(new ApiResponse(200, data, "Dashboard data fetched successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error fetching dashboard data");
    }
})

export {dashboard}