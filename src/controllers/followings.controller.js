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
        res.status(error.statusCode || 500).json( error.message || "error toggling following!!")
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
        const options = {
            page: parseInt(page), 
            limit: parseInt(limit), 
        }
        //console.log('bloggerId',bloggerId)
        const followers =  Following.aggregate([
            {
                $match: {
                    blogger : new mongoose.Types.ObjectId(bloggerId)
                }
            },
            {
                
                $sort: { createdAt: -1 } 
                
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
            },
            {
                $project: {
                    _id: 0,
                    follower: 1
                }
            }
        ])
        
        const followersList = await Following.aggregatePaginate(followers, options);

        if (followersList.docs.length === 0) {
            throw new ApiError(404, "No followers to show");
        }
    
        res.status(200).json( new ApiResponse(200, followersList, "followers fetched successfully !!"))
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error getting bloggers followers")
    }

})

const getUserFollowings = asyncHandler(async(req, res)=> {
    try {
        const {page = 1, limit=15} = req.query;
        const {userId} = req.params ;
        const options = {
            page: parseInt(page), 
            limit: parseInt(limit), 
        }
        const followedBloggersList =  Following.aggregate([
            {
                $match: {
                    follower: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $sort: { createdAt: -1 } 
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
            },
            {
                $project: {
                    _id: 0,
                    blogger: 1
                }
            }
        ])
    
        const followingsList = await Following.aggregatePaginate(followedBloggersList, options);

        if (followingsList.docs.length === 0) {
            throw new ApiError(404, "No followers to show");
        }
        console.log('followingsList', followingsList)
        res.status(200).json( new ApiResponse(200, followingsList, "Bloggers followed fetched successfully !!"))
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error fetching followed bloggers ")
    }

})

const isFollowing = asyncHandler(async(req, res)=> {
    try {
        const user = req.user
        const {bloggerId} = req.params
        const isFollowingBlogger = await Following.find({blogger: bloggerId, follower: user._id})  //if return docs that means user is following the blogger
        const isBloggerFollowing = await Following.find({blogger: user._id, follower: bloggerId}) //if return docs that means blogger is following the user
        const data = {
            isFollowing: isFollowingBlogger.length > 0,
            isFollowedByBlogger: isBloggerFollowing.length > 0
        }
        res.status(200).json(new ApiResponse(200, data, "successfully get following status"))
    } catch (error) {
        res.status(error.statusCode || 500 ).json( error.message || "error getting following status !!")
    }
})

const followersCount = asyncHandler(async(req, res)=>{
    try {
        const {userId} = req.params 
    
        const followers = await Following.countDocuments({blogger: userId})
        const following = await Following.countDocuments({follower: userId})
        const data = {
            followers,
            following
        }
        res.status(200).json(new ApiResponse(200, data, "successfully get following and followers count"))
    } catch (error) {
        res.status(error.statusCode || 500 ).json( error.message || "error getting following and followersCount !!")
    }
})


export {
    toggleFollow,
    removeFollower,
    getUserFollowers,
    getUserFollowings,
    isFollowing,
    followersCount
}