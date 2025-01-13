import mongoose,  {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const followingSchema = new Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    blogger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

followingSchema.plugin(mongooseAggregatePaginate);

export const Following = mongoose.model("Following", followingSchema)