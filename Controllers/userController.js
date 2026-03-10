const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const path = require('path');

// 1. وظيفة مساعدة لتصفية الـ Request Body
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * 2. إعدادات Multer لتخزين الصور في الذاكرة
 */
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

/**
 * 3. معالجة الصورة
 */
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(process.cwd(), 'public', 'img', 'users', req.file.filename));
    
  next();
});

/**
 * 4. تحديث بيانات المستخدم (البروفايل) - المعدل ✅
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log('📥 Received body:', req.body);
  console.log('📸 Received file:', req.file);

  // أ) منع تحديث الباسورد
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // ب) تصفية البيانات - ✅ أضفت كل الحقول المطلوبة!
  const filteredBody = filterObj(
    req.body, 
    'name', 
    'bio', 
    'headline',
    'location',
    'twitterLink',
    'gitHubLink',
    'website'
  );

  // ج) معالجة الـ Skills ✅
  // الفرونت بيبعت skills[] كـ array
  if (req.body['skills[]']) {
    // لو جاية كـ array من FormData
    filteredBody.skills = Array.isArray(req.body['skills[]']) 
      ? req.body['skills[]'] 
      : [req.body['skills[]']];
  } else if (req.body.skills) {
    // لو جاية كـ skills عادي
    filteredBody.skills = Array.isArray(req.body.skills) 
      ? req.body.skills 
      : JSON.parse(req.body.skills);
  }

  // د) إضافة الصورة لو موجودة
  if (req.file) {
    filteredBody.photo = req.file.filename;
    console.log("✅ File saved as:", req.file.filename);
  }

  console.log('📝 Filtered body to save:', filteredBody);

  // هـ) التحديث في قاعدة البيانات
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError('No user found with that ID', 404));
  }

  console.log("✅ Update Success! User:", updatedUser.name);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

/**
 * 5. الحصول على بياناتي
 */
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * 6. حذف الحساب
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});