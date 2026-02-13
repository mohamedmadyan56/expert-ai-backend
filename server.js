const express = require("express");
const mongoose = require("mongoose")
const cors = require ("cors");
require("dotenv").config();             //تفعيل قراءه ملفات ال env
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./Middlewares/errorMiddleware");
const serviceRoutes = require("./Routes/serviceRoutes");
const userRoutes = require("./Routes/userRoutes");
const aiRouter = require("./Routes/aiRoutes")
// Middlewares
app.use(cors()); // بيسمح للفرونت انه يكلم الباك اند
app.use(express.json()) //بيخلي السيرفر يفهم البيانات الي جايه بصيغه ال json


app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai",aiRouter)

app.get('/',(req,res)=>{
    res.send('Expertly AI Server is Running! 🚀');

})






app.use(globalErrorHandler);
 mongoose.connect(process.env.DATABASE_URL)
 .then(()=>console.log("connected to MongoDB"))
 .catch((err)=>console.log("Mongodb connection error",err) )





const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
    
})


 
