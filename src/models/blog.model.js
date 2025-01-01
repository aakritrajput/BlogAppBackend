import mongoose, {mongo, Schema} from "mongoose";

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content : {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tags: {
        type: [String],
        required: false
    },
    coverImage: {
        type: String,
        required: false
    }
}, {timestamps: true})

export const Blog = mongoose.model("Blog", blogSchema)