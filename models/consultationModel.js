const mongoose = require('mongoose')

const consultationSchema = new mongoose.Schema({
    userPrompt:{type:String,required:true},
    aiReply:{type:String,required:true},
    category:{type:String,default:'Genetal'},
    createdAt:{type:Date,default:Date.now}
})



module.exports=mongoose.model('Consultation',consultationSchema);
