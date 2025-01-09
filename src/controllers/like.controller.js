import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// toggle like for blogs 
// toggle like for comments
// get likes count for blogs 
// get likes count for comments

const toggleBlogLike = asyncHandler(async (req, res) => {
    try {
            const {blogId} = req.params;
            if(!isValidObjectId(blogId)){
                throw new ApiError(400, "Invalid blog id");
            }
            const userId = req.user._id;
            const isLiked = await Like.exists({blogId,user: userId });
            if(isLiked){
                await Like.deleteOne({blogId,user: userId});
                res.status(200).json(new ApiResponse(200, {like: false}, "Blog unliked successfully"))
            }else{
                await Like.create({blogId,user: userId});
                res.status(200).json(new ApiResponse(200, {like: true}, "Blog liked successfully"))
            }
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error toggling like")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
            const {commentId} = req.params;
            if(!isValidObjectId(commentId)){
                throw new ApiError(400, "Invalid comment id");
            }
            const userId = req.user._id;
            const isLiked = await Like.exists({commentId,user:userId });
            if(isLiked){
                await Like.deleteOne({commentId,user: userId});
                res.status(200).json(new ApiResponse(200, {like: false}, "Comment unliked successfully"))
            }else{
                await Like.create({commentId,user: userId});
                res.status(200).json(new ApiResponse(200, {like: true}, "Comment liked successfully"))
            }
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error toggling like")
    }
})

const getBlogLikes = asyncHandler(async (req, res) => {
    try {
        const {blogId} = req.params;
        if(!isValidObjectId(blogId)){
            throw new ApiError(400, "Invalid blog id");
        }
        const likes = await Like.aggregate([
            {
                $match: {
                    blogId : new mongoose.Types.ObjectId(blogId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
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
                $unwind: "$user"
            }
        ])
    
        res.status(200).json( new ApiResponse(200, likes, "successfully fetched Blog likes info!!"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error fetching likes info for the blog")
    }
})

const getBlogLikesCount = asyncHandler(async(req, res)=>{
    try {
        const {blogId} = req.params
        if(!isValidObjectId(blogId)){
            throw new ApiError(400, "invalid blog id")
        }
        const likeCount = await Like.countDocuments({blogId})
        res.status(200).json(new ApiResponse(200, {likes: likeCount}, "successfully fetched blog's like Count"))
    } catch (error) {
        throw new ApiError(error.status || 500, error.message || " error fetching blog likes count")
    }
})

const getCommentLikesCount = asyncHandler(async(req, res)=>{
    try {
        const {commentId} = req.params
        if(!isValidObjectId(commentId)){
            throw new ApiError(400, "invalid blog id")
        }
        const likeCount = await Like.countDocuments({commentId})
        res.status(200).json(new ApiResponse(200, {likes: likeCount}, "successfully fetched blog's like Count"))
    } catch (error) {
        throw new ApiError(error.status || 500, error.message || " error fetching comment likes count")
    }
})

const getUsersLikedBlogs = asyncHandler(async(req, res)=>{
    try {
        const user = req.user;
        const likedBlogs = await Like.find({
            user: user._id,
            blogId: {
                $ne : undefined
            }
        }).populate("blogId")
        res.status(200).json(new ApiResponse(200, likedBlogs, "likedBlogs fetchedd successfully !!"))
    } catch (error) {
        res.status(error.statusCode || 500).json(error.message || "error getting likedBlogs !!")
    }
})

export {
    toggleBlogLike,
    toggleCommentLike,
    getBlogLikes,
    getBlogLikesCount,
    getCommentLikesCount,
    getUsersLikedBlogs
}