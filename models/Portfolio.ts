import mongoose, {Schema,Document} from "mongoose";


export interface IPortfolio extends Document {
    expert:mongoose.Types.ObjectId;
    title:string,
    description:string,
    imageUrl:string,
    category:string,
    link?:string,
    createdAt:Date;
}


const portfolioSchema:Schema = new Schema({
   expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // تأكد إن اسم موديل المستخدم عندك هو 'User'
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
    enum: ['Design', 'Development', 'Marketing', 'Writing', 'Other'] // حددنا خيارات معينة
  },
  link: {
    type: String // اختياري لو فيه رابط للمشروع لايف
  },
  createdAt: {
    type: Date,
    default: Date.now
  },


})


const Portfolio = mongoose.model<IPortfolio>('Portfolio',portfolioSchema);
export default Portfolio;
