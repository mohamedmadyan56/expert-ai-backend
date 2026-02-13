const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./Middlewares/errorMiddleware");
const serviceRoutes = require("./Routes/serviceRoutes");
const userRoutes = require("./Routes/userRoutes");
const aiRouter = require("./Routes/aiRoutes");

// 1. إعدادات الـ CORS (لازم تكون أول حاجة وقبل الـ Routes)
app.use(cors({
  origin: 'https://venerable-flan-e22824.netlify.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

// 2. Middlewares الأساسية
app.use(express.json());

// 3. المسارات (Routes)
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai", aiRouter);

// مسار افتراضي للتأكد من عمل السيرفر
app.get('/', (req, res) => {
  res.send('Expertly AI Server is Running! 🚀');
});

// 4. معالجة الأخطاء
app.use(globalErrorHandler);

// 5. الاتصال بقاعدة البيانات
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("connected to MongoDB"))
  .catch((err) => console.log("Mongodb connection error", err));

// 6. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});