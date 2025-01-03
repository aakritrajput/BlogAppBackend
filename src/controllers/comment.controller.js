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
        if(!comment){
            throw new ApiError(500, "error creating comment");
        }
        res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error creating comment");
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
        throw new ApiError(error.statusCode || 500, error.message || "error deleting comment");
    }
})

const getblogComments = asyncHandler(async(req, res)=>{
    try {
        const {blogId} = req.params;
        if(!isValidObjectId(blogId)){
            throw new ApiError(400, "Invalid blogId!!")
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
    
        if (page <= 0 || limit <= 0) {
          return next(new ApiError(400, "Page and limit must be positive integers"));
        }
        const offset = ( page - 1 ) * limit;
        const comments = await Comment.aggregate([
            {
                $match: {
                    blogId: new mongoose.Types.ObjectId(blogId)
                }
            },
            {
                $skip: offset
            },
            {
                $limit : limit
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
        throw new ApiError(error.statusCode || 500, error.message || "error fetching comments");
    }
})

export {
    createComment,
    deleteComment,
    getblogComments
}