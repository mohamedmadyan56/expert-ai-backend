const express = require("express");
const mongoose = require("mongoose")



const serviceSchema = new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    price:{type:Number,required:true},
    category:{type:String,required:true},
    createdAt:{type:Date,default:Date.now}
});


module.exports = mongoose.model("Service",serviceSchema);
//السطر دا عباره عن بوابه الخروج بتحول ال schema ألي model علشان علشان تقدر تستخدمها في اماكن تانيه في المشروع
//هنا بنقول لل mongoose خدي الSchema بتاع الserviceSchema وحولهالي الي model اسمه Service علشان اقدر استخدمه 
