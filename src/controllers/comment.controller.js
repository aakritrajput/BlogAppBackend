import mongoose, {isValidObjectId} from "mongoose";
import { Comment } from "../models/comment.model.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new comment
// delete a comment 
// get blog comments

const createComment = asyncHandler(async(req, res)=>{
    try {
        const {blogId} = req.params;
        if(!isValidObjectId(blogId)){
            throw new ApiError(400, "invalid blog id");
        }
        const {content} = req.body; 
        if(content.trim().length === 0){
            throw new ApiError(400, "Comment cannot be empty");
        }
        const userId = req.user._id;
        const comment = await Comment.create({blogId, userId, content});
        const newComment = await Comment.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(comment._id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
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
                $unwind : {
                    path: "$user",
                    preserveNullAndEmptyArrays: true, // Keeps comments even if the user is missing
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    blogId:1,
                    user: 1
                }
            }
        ])
        if(!comment){
            throw new ApiError(500, "error creating comment");
        }
        res.status(201).json(new ApiResponse(201, newComment[0], "Comment created successfully"));
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error creating comment");
    }
})

const deleteComment = asyncHandler(async(req, res)=>{
    try {
        const {commentId} = req.params;
        if(!isValidObjectId(commentId)){
            throw new ApiError(400, "invalid comment id");
        }
        const comment = await Comment.findById(commentId).populate("blogId");
        
        if(!comment){
            throw new ApiError(404, "Comment not found");
        }
        if(comment.userId.toString() === req.user._id.toString() || comment.blogId.author.toString() === req.user._id.toString()){  
            await Comment.findByIdAndDelete(commentId);
            res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
        }else{
            throw new ApiError(400, "the given user is not authorized to delete this comment")
        }
        
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error deleting comment");
    }
})

const getblogComments = asyncHandler(async(req, res)=>{
    try {
        console.log("getting blogs comment runs !!")
        const {blogId} = req.params;
        if(!isValidObjectId(blogId)){
            throw new ApiError(400, "Invalid blogId!!")
        }
        
        const comments = await Comment.aggregate([
            {
                $match: {
                    blogId: new mongoose.Types.ObjectId(blogId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
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
                $unwind : {
                    path: "$user",
                    preserveNullAndEmptyArrays: true, // Keeps comments even if the user is missing
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    blogId:1,
                    user: 1
                }
            }
        ])
        res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
    } catch (error) {
        res.status(error.statusCode || 500).json( error.message || "error fetching comments");
    }
})

export {
    createComment,
    deleteComment,
    getblogComments
}