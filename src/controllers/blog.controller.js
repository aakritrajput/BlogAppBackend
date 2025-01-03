import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js"

// Create a new blog
// getusersblogs
// update blog 
// deleteBlog
// searchblogs  
// getallblogs
// getBlogByID

const createBLog = asyncHandler(async(req, res)=>{
    try {
        const {title, content, tags=[""]} =  req.body
        const coverImageLocal = req.file.path
        console.log("req.file :", req.file)
        const requiredFields = {title, content, coverImageLocal}
        const missingFields = Object.keys(requiredFields).filter(([key, value])=>!value || value.trim().length === 0).map(([key])=>key)
        if (missingFields.length > 0) {
            throw new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`);
        }
        const coverImage = await uploadOnCloudinary(coverImageLocal)
        console.log("coverImage : ", coverImage)
        const blog = await Blog.create({
            title,
            content,
            tags : tags.split(","),
            coverImage: coverImage.secure_url,
            author: req.user._id
        })
        if(!blog){
            throw new ApiError(500, " error creating new blog ")
        }
        res.status(200).json(new ApiResponse(200, blog, "blog created successfully!!"))
    } catch (error) {
        throw new ApiError(500, error.message || "error creating new blog")
    }

})

const getUserBlogs = asyncHandler(async(req, res)=>{
    try {
        const userBlogs = await Blog.find({
            author: req.user._id
        }) 
        if(!userBlogs){
            throw new ApiError(500, "error getting userBlogs")
        }
        res.status(200).json(new ApiResponse(200, userBlogs, "user blogs fetched successfully !!"))
    } catch (error) {
        throw new ApiError(500, error.message || " error getting userBlogs !")
    }
})

const updateBlog = asyncHandler(async(req, res)=>{
    try {
        const {blogId} = req.params
        const {title, content , tags } = req.body
        const newCoverImage = req.file? req.file.path : "" ;   
        const blog = await Blog.findById(blogId)
        if(!blog){
            throw new ApiError(400, "no user found by the given id")
        }
        if(blog.author.toString() !== req.user._id.toString()){
            throw new ApiError(403, "You are not authorized to update this blog")
        }
        if(newCoverImage.length > 0){
            await deleteFromCloudinary(blog.coverImage)
        } 
        const coverImage = newCoverImage.length > 0 ? await uploadOnCloudinary(newCoverImage) : ""
        blog.title = title ? title : blog.title;
        blog.content = content ? content : blog.content;
        blog.tags = tags ? tags : blog.tags;
        blog.coverImage = coverImage == "" ? blog.coverImage : coverImage.secure_url;
        await blog.save({validateBeforeSave:false})
    
        res.status(200).json(new ApiResponse(200, blog, "blog updated successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "error updating blog")
    }
})

const deleteBlog = asyncHandler(async(req, res)=> {
     const {blogId} = req.params
    try {
        const deletedBlog = await Blog.findByIdAndDelete(blogId)
        if(!deletedBlog){
            throw new ApiError(400, "No blog exists with the given blogId:", blogId)
        }
        await deleteFromCloudinary(deleteBlog.coverImage)
        res.status(200).json(new ApiResponse(200, {}, "blog deleted successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "Error deleting the blog with the given blogId:", blogId)
    }
})

const searchBlogs = asyncHandler(async(req, res)=>{
    try {
        const {query} = req.query;
        if(!query || query.trim().length === 0){
            throw new ApiError(400, "invalid or empty query" )
        }
        const words = query.split(" "); 
        const regexPatterns = words.map(word => new RegExp(word, "i")); // Create regex for each word

        const matchedBlogs = await Blog.find({
            $or: [
                { title: { $in: regexPatterns } },
                { tags: { $in: regexPatterns } } 
            ]
        });

        res.status(200).json(new ApiResponse(200, matchedBlogs, "fetched matched blogs successfully !!"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error getting matched blogs")
    }
})

const getBlogs = asyncHandler(async(req, res)=> {
    try {
        const {page= 1, limit = 10} = req.query
        const offset = ( page - 1 ) * limit
        const blogs = await Blog.find().skip(offset).limit(limit).populate({
            path: 'author',
            select: 'profilePic username fullname _id',
          })
        if(blogs.length === 0){
            throw new ApiError(500, "No blogs to show")
        }
        res.status(200).json(new ApiResponse(200, blogs, `successfully fetched ${limit} blogs of page ${page}`))
    } catch (error) {
        throw new ApiError(error.statusCode || 500 , error.message || "error fetching blogs")
    }
})

const getBlogById = asyncHandler(async(req, res)=> {
    try {
        const {blogId} = req.params
        if(!blogId){
            throw new ApiError(400, "Please provide a vaid blogId")
        }
        const blog = await Blog.findById(blogId)
        if(!blog){
            throw new ApiError(500, "no blog found with the given blogId ")
        }
    
        res.status(200).json(new ApiResponse(200, blog, "blog with given blog id fetched successfully"))
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error fetching the blog with given blogId")
    }
})

export {
    createBLog,
    getUserBlogs,
    updateBlog,
    deleteBlog,
    searchBlogs,
    getBlogs,
    getBlogById
}