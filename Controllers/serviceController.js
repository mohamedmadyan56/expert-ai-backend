const Service = require("../models/serviceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// ✅ إضافة خدمة
exports.addService = catchAsync(async(req, res, next) => {
    req.body.expert = req.user.id;
    
    if (req.user.role !== 'expert' && req.user.role !== 'admin') {
        return next(new AppError("Only experts and admins can add services", 403));
    }
    
    const newService = await Service.create(req.body);
    
    res.status(201).json({
        status: "success",
        message: 'Service added successfully',
        data: { service: newService }
    });
});

// ✅ جلب كل الخدمات
exports.getAllServices = catchAsync(async(req, res, next) => {
    const services = await Service.find();
    
    res.status(200).json({
        status: 'success',
        results: services.length,
        data: { services }
    });
});

// ✅ تحديث خدمة
exports.updateService = catchAsync(async(req, res, next) => {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
        return next(new AppError('No service found with this ID', 404));
    }
    
    if (service.expert.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError("You don't have permission to update this service", 403));
    }
    
    const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            runValidators: true,
            new: true
        }
    );
    
    res.status(200).json({
        status: 'success',
        data: { service: updatedService }
    });
});

exports.deleteService = catchAsync(async(req, res, next) => {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
        return next(new AppError("No service found with this ID", 404));
    }
    
    if (service.expert.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You don't have permission to delete this service", 403));
    }
    
    await Service.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});