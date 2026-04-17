const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'العمل يجب أن ينتمي لخبير']
  },
  title: {
    type: String,
    required: [true, 'برجاء إدخال عنوان العمل'],
    trim: true,
    maxlength: [100, 'العنوان لا يمكن أن يزيد عن 100 حرف']
  },
  description: {
    type: String,
    required: [true, 'برجاء إدخال وصف للعمل']
  },
  imageUrl: {
    type: String,
    required: [true, 'يجب رفع صورة للعمل']
  },
  category: {
    type: String,
    required: [true, 'برجاء تحديد قسم العمل (مثلاً: تصميم، برمجة)'],
    enum: ['Design', 'Development', 'Marketing', 'Writing', 'Other']
  },
  link: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
