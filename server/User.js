const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
    id: Number,
    username: String, 
    password: String,
    phoneNumber: String,

    level: Number,
    pieces: [Number],
    rating: [Number],
    questProgress: [Number],
    achivementProgress: [Number],

    isAdmin: Boolean,
    lastLogin: Date,
    language: String,
});
const User = mongoose.model("User", userSchema);
module.exports = User;