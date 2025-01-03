import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    blogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog"
    },
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true});

export const Like = mongoose.model("Like", likeSchema);
