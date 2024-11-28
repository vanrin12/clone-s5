import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    private: {
        type: Boolean,
        default: false,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: "https://www.kindpng.com/picc/m/22-223863_no-avatar-png-circle-transparent-png.png",
    },
    bio: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    bookmarks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    featuredNote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
    },
    lastActiveAt: { type: Date, default: Date.now }, // Thời gian hoạt động cuối cùng

}, { timestamps: true });

// Khai báo biến User
const User = mongoose.model('User', userSchema);

// Export default sau khi khai báo User
export default User;
