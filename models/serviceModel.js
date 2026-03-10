const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'الخدمة لازم يكون ليها عنوان (Title)'],
      trim: true,
      maxlength: [100, 'عنوان الخدمة ميزيدش عن 100 حرف'],
    },
    description: {
      type: String,
      required: [true, 'لازم تكتب وصف تفصيلي للخدمة'],
      minlength: [20, 'وصف الخدمة ملقلش عن 20 حرف'],
    },
    price: {
      type: Number,
      required: [true, 'حدد سعر الخدمة'],
    },
    category: {
      type: String,
      required: [true, 'اختار مجال الخدمة'],
      enum: {
        values: ['AI Consulting', 'Development', 'Design', 'Marketing', 'Writing', 'Other'],
        message: 'التصنيف غير صحيح',
      },
    },
    deliveryTime: {
      type: Number, // عدد الأيام
      required: [true, 'حدد وقت التسليم المتوقع بالأيام'],
    },
    expert: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // ربط الخدمة بموديل اليوزر
      required: [true, 'الخدمة لازم تكون تابعة لخبير'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'التقييم يبدأ من 1'],
      max: [5, 'التقييم أقصاه 5'],
      set: (val) => Math.round(val * 10) / 10, // تقريب الرقم (مثل 4.6666 إلى 4.7)
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware عشان يعمل Populate لبيانات الخبير تلقائياً لما تطلب الخدمات
serviceSchema.pre(/^find/, function () {
  this.populate({
    path: 'expert',
    select: 'name photo headline', // هنجيب بس الاسم والصورة والـ Headline بتاع الخبير
  });
 
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
