const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs');
require("dotenv").config();
const cookieParser = require('cookie-parser');

const app = express();

// 1. إعدادات الـ CORS (مهم جداً لمرور الكوكيز)
const allowedOrigins = [
  'https://venerable-flan-e22824.netlify.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // التحقق من الـ origin أو السماح بالطلبات التي ليس لها origin (مثل Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // تسمح بإرسال واستقبال الكوكيز (user_token)
  exposedHeaders: ["set-cookie"]
}));

// 2. Middlewares الأساسية (الترتيب هنا هو السر!)
app.use(express.json({ limit: '10kb' })); // لقراءة الـ JSON body
app.use(cookieParser()); // ضروري جداً لقراءة req.cookies قبل الوصول للراوتس

// 3. إعداد الملفات الاستاتيكية
app.use(express.static(path.join(__dirname, 'public')));

// تأكيد وجود مجلد الصور في الـ Terminal
const photoPath = path.join(__dirname, 'public', 'img', 'users');
if (!fs.existsSync(photoPath)) {
    fs.mkdirSync(photoPath, { recursive: true });
    console.log('📁 Created photos folder at:', photoPath);
}

// 4. استيراد الـ Routes
const globalErrorHandler = require("./Middlewares/errorMiddleware");
const serviceRoutes = require("./Routes/serviceRoutes");
const userRoutes = require("./Routes/userRoutes");
const aiRouter = require("./Routes/aiRoutes");
const chatRouter = require('./Routes/chatRoutes');
const statsRouter = require('./Routes/statsRoutes');
const portfolioRouter = require('./Routes/portfolioRoutes').default;

// 5. تعريف المسارات (Routes)
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/portfolio",portfolioRouter);
app.get('/', (req, res) => {
  res.send('Expertly AI Server is Running! 🚀');
});

// 6. معالجة الأخطاء
app.use(globalErrorHandler);

// 7. الاتصال بقاعدة البيانات
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB ✅"))
  .catch((err) => console.log("MongoDB connection error ❌", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});