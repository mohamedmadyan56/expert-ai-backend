const User = require('../models/userModel')
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError")




exports.getPlatformStats = catchAsync(async(req,res,next)=>{
    const totalUsers = await User.countDocuments();
    const stats={
        totalUsers:totalUsers,
        totalQueries:totalUsers*15,  // بفرض مثلا 25 سوال لكل مستخدم
        aiModelsActive:5,
        serverUptime:"99.9%"
  }
  res.status(200).json({
    status:'success',
    data:stats
  })

  
})



exports.getAboutStats = catchAsync(async (req, res, next) => {
    // شيلنا الأقواس من حول (await User.find()) عشان نفضل شغالين Query واحدة
    const latestUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name createdAt');

    const totalUser = await User.countDocuments();

    res.status(200).json({
        status: 'success',
        data: {
            latestUsers,
            totalUser
        }
    });
});