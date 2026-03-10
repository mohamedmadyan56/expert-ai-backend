const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please tell us your name!'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Please provide your email'], 
    unique: true, 
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: { 
    type: String, 
    default: 'default.jpg' 
  },
  role: { 
    type: String, 
    enum: ['user', 'expert', 'admin'], 
    default: 'user' 
  },
  // --- الحقول الجديدة للـ Dashboard ---
  headline: { 
    type: String, 
    maxlength: [60, 'Headline must be less than 60 characters'],
    placeholder: 'e.g. Graphic Designer or AI Enthusiast'
  },
  bio: { 
    type: String, 
    maxlength: [150, 'Bio must be less than 150 characters'] 
  },
  location: { type: String },
  twitterLink: { type: String },
  gitHubLink: { type: String },
  website: { type: String },
  skills: {
    type: [String], // مصفوفة لتخزين المهارات مثل ["React", "AI"]
    default: []
  },
  // --- حقول الأمان ---
  password: { 
    type: String, 
    required: [true, 'Please provide a password'], 
    minlength: 8,
    select: false 
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // هذا يعمل فقط عند الحفظ (SAVE) أو الإنشاء (CREATE)
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // تفعيل الـ Virtuals لتظهر في الـ JSON والـ Objects
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- Middlewares ---

// 1) تشفير الباسورد قبل الحفظ
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // مسح حقل التأكيد
});

// 2) تحديث وقت تغيير الباسورد
userSchema.pre('save', function() {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
  
});

// 3) فلترة المستخدمين غير النشطين (اختياري)

// --- Methods ---

// التأكد من صحة الباسورد عند تسجيل الدخول
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// التأكد إذا تم تغيير الباسورد بعد صدور التوكن
userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// --- Virtual Fields ---

// حساب عدد الأيام التي قضاها المستخدم على المنصة
userSchema.virtual('daysOnPlatform').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const User = mongoose.model('User', userSchema);
module.exports = User;