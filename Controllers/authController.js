const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { promisify } = require('util');


const signToken = (id) => {
  // يفضل دائمًا التأكد أن الـ id المارر هو string
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d' 
  });
};



exports.signup = catchAsync(async (req, res, next) => {
  // 1) إنشاء المستخدم الجديد
  const newUser = await User.create(req.body);

  // 2) إنشاء التوكن
  const token = signToken(newUser._id);

  // 3) إرسال التوكن في الكوكي (عشان الـ Protect يشوفه فوراً)
  res.cookie('user_token', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false, // خليها false للـ localhost
    sameSite: 'Lax'
  });

  // 4) الرد
  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser
    }
  });
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) التأكد من وجود الإيميل والباسورد في الـ Request
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // 2) البحث عن اليوزر والتأكد من صحة الباسورد
  // استخدمنا .select('+password') لأننا في الموديل غالباً عاملين له select: false
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) إنشاء التوكن (JWT)
  const token = signToken(user._id);

  // 4) إرسال التوكن في الكوكيز (الخطوة الأهم لربطها بالـ Protect)
  res.cookie('user_token', token, {
    expires: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 يوم كما في الكود السابق
    ),
    httpOnly: true, // حماية ضد هجمات XSS
    secure: false,  // اجعلها false لأنك تعمل على localhost
    sameSite: 'Lax', // ضرورية لضمان إرسال الكوكيز بين بورت 5173 و 5000
  });

  // 5) إرسال الرد للعميل
  // بنبعت التوكن برضه في الـ JSON عشان لو حبيت تستخدمه في الهيدرز (Postman)
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});



exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) البحث في الهيدرز (للموبايل أو الـ Postman)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2) البحث في الكوكيز (للمتصفح والفرونت إيند بتاعك)
  else if (req.cookies.user_token) { // استخدمنا الاسم اللي في الصورة بالظبط
    token = req.cookies.user_token;
  }

  console.log("Token detected:", token); // لو طلع لك Token هنا يبقى إحنا في السليم

  if (!token) {
    return next(new AppError("You are not logged in please log in to get access", 401));
  }

  // الباقي زي ما هو سليم جداً
  const decoded = await promisify(jwt.verify).call(jwt, token, process.env.JWT_SECRET);
  
  const currentUser = await User.findById(decoded.id).select('+active');
  if (!currentUser || currentUser.active === false) {
    return next(new AppError("the token belonging to this does no longer exist", 401));
  }

  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError("Password recently changed. Please log in again", 401));
  }

  req.user = currentUser;
  next();
});




exports.restrictTo =(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError("you don't have permisstion to perform this action",403))
        }
        next()
    }
}