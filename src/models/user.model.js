import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullname : {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    isVarified: {
        type: Boolean,
        default: false
    },
    profilePic: {
        type: String,
    },
    bannerPic: {
        type: String
    },
    savedBlogs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Blog"
    },
    bio: {
        type: String
    },
    otp: {
        type: Number
    },
    otpExpiry: {
        type: Date
    }
}, {timestamps: true})

userSchema.pre("save", async function(next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign({_id: this._id, email: this.email, username: this.username, fullname: this.fullname}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({_id: this._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}

const User = mongoose.model("User", userSchema)