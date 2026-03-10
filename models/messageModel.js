const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'الرساله يجب ان تنتمي للمستخدم'],
    },
    text: String,
    role: {
        type: String,
        enum: ['user', 'assistant'], // لاحظ اننا عدلنا assistant عشان تطابق كود الـ React
        default: 'user'
    },
    createdAt: { type: Date, default: Date.now }
});

// هنا بنعرف الموديل ونخزنه في متغير وبعدين نصدره
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;