import mongoose from "mongoose";
import {Following} from "../models/followings.model.js";
import {User} from "../models/user.model.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js";

// get userFollowers
// get userFollowings
// toggle follow

const toggleFollow = asyncHandler(async(req, res)=> {
    try {
        const {bloggerId} = req.params
        if(!bloggerId){
            throw new ApiError(400, "BloggerId is required !!")
        }
        const user = req.user
        const alreadyAFollower = await Following.find({
            blogger: bloggerId,
            follower: user._id
        })
        if(alreadyAFollower.length > 0){
            await Following.findByIdAndDelete(alreadyAFollower[0]._id)
            const data = {
                Following : false
            }
            res.status(200).json(new ApiResponse(200, data, "Blogger successfully unfollowed !!"))
        }else{
            await Following.create({
                follower: user._id,
                blogger: bloggerId
            })
    
            const data = {
                Following: true
            }
    
            res.status(200).json(new ApiResponse(200, data, "Blogger successfully followed !!"))
        }
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error toggling following!!")
    }
})

const removeFollower = asyncHandler(async(req, res)=> {
    try {
        const {followerId} = req.params
        if(!followerId){
            throw new ApiError(400, "follower id is required !!")
        }
        const follower = await Following.find({
            blogger: req.user._id,
            follower: followerId  
        })
    
        if(follower.length === 0){
            throw new ApiError(400, "No follower exists with the given follower Id")
        }
    
        await Following.findByIdAndDelete(follower[0]._id)
        res.status(200).json(new ApiResponse(200, {}, "follower successfully removed!!"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error removing the follower !")
    }
})

const getUserFollowers = asyncHandler(async(req, res)=> {
    try {
        const {page = 1, limit=15} = req.query
        const {bloggerId} = req.params 
        const offset = ( parseInt(page) - 1 ) * parseInt(limit)
        const followers = await Following.aggregate([
            {
                $match: {
                    blogger: new mongoose.Types.ObjectId(bloggerId)
                }
            },
            {
                $skip : offset
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: "users",
                    localField: "follower",
                    foreignField: "_id",
                    as: "follower",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                profilePic: 1,
                                bio:1,
                                fullname:1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$follower"
            }
        ])
    
        const followersList = followers.map((follower) => follower.follower);
    
        res.status(200).json( new ApiResponse(200, followersList, "followers fetched successfully !!"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error getting bloggers followers")
    }

})

const getUserFollowings = asyncHandler(async(req, res)=> {
    try {
        const {page = 1, limit=15} = req.query
        const {userId} = req.params 
        const offset = ( parseInt(page) - 1 ) * parseInt(limit)
        const followedBloggersList = await Following.aggregate([
            {
                $match: {
                    follower: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $skip : offset
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: "users",
                    localField: "blogger",
                    foreignField: "_id",
                    as: "blogger",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                profilePic: 1,
                                bio:1,
                                fullname:1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$blogger"
            }
        ])
    
        const bloggersList = followedBloggersList.map((blogger) => blogger.blogger);
    
        res.status(200).json( new ApiResponse(200, bloggersList, "Bloggers followed fetched successfully !!"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error fetching followed bloggers ")
    }

})

const followersCount = asyncHandler(async(req, res)=>{
    try {
        const {userId} = req.params 
    
        const followers = await Following.countDocuments({blogger: userId})
        const data = {
            followers
        }
        res.status(200).json(new ApiResponse(200, data, "successfully get followers count"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500 , error.message || "error getting followersCount !!")
    }
})

const followingCount = asyncHandler(async(req, res)=>{
    try {
        const {userId} = req.params 
    
        const following = await Following.countDocuments({follower: userId})
        const data = {
            following
        }
        res.status(200).json(new ApiResponse(200, data, "successfully get following count"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500 , error.message || "error getting followingCount !!")
    }
})

export {
    toggleFollow,
    removeFollower,
    getUserFollowers,
    getUserFollowings,
    followersCount,
    followingCount
}