import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import {Like} from "../models/like.model.js";   
import {Following} from "../models/followings.model.js";

const dashboard = asyncHandler(async(req, res)=>{
    // get user followers , user profile , user blogs , total likes
    try {
        const {userId} = req.params
        const followers = await Following.countDocuments({blogger: userId});
        const following = await Following.countDocuments({follower: userId});
        const totalLikes = await Like.countDocuments({user: userId});
        const totalBlogs = await Blog.countDocuments({author: userId});
        const data = {
            followers ,
            following ,
            totalLikes ,
            totalBlogs ,
        }
        res.status(200).json(new ApiResponse(200, data, "Dashboard data fetched successfully"));
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error fetching dashboard data");
    }
})

export {dashboard}