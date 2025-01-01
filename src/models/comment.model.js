import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema({
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {timestamps: true});

export const Comment = mongoose.model("Comment", commentSchema);