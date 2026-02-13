const Service = require("../models/Service");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync"); 

exports.addService =catchAsync( async (req,res,next)=>{
  
       

        const newService = await Service.create(req.body)
          
    

        res.status(201).json({
            success:true,
            massage:"Service Added Successfully ✅",
            data:newService
        })



   
})


exports.getAllServices=catchAsync( async (req,res)=>{
   
        const services = await Service.find();
        res.status(200).json({
            success: true,
            count:services.length,
            data:{
                services
            }
        })
   
    })




exports.deleteService=catchAsync (async(req,res)=>{

const id = req.params.id;
const deleteService = await Service.findByIdAndDelete(id);
if(!deleteService){
    return next(new AppError("Service not found",404))
}
res.status(200).json({
    success:true,
    message:"Service deleted successfully! 🗑️"
})



})



exports.updateService=catchAsync(async(req,res,next)=>{

        const id =req.params.id;
        const updateService= await Service.findByIdAndUpdate(id,req.body,{
            new:true,
            runValidators:true
        });
        if(!updateService){
            return next(new AppError("Service Not Found",404))
        }
        res.status(200).json({
            success:true,
            message:"service Updated Successfylly ! "
        })
  
})