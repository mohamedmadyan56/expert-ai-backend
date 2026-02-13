const axios = require('axios');
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Consultation = require('../models/consultationModel');
exports.getAIResponse = catchAsync(async (req, res, next) => {
  const { prompt } = req.body;

  // 1) التأكد من وجود الـ prompt
  if (!prompt) {
    return next(new AppError("Please provide a prompt!", 400));
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    // 2) إرسال الطلب لـ Groq باستخدام أحدث موديل في 2026
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        // استخدام Llama 3.3 النسخة الاحترافية
        model: "llama-3.3-70b-versatile", 
        messages: [
          {
            role: "system",
            content: "You are a professional AI assistant. Respond clearly and concisely."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 3) استخراج الرد من Groq
    const aiReply = response.data.choices[0].message.content;

    // 4) إرسال الرد للـ Client
    await Consultation.create({
      userPrompt: prompt,
      aiReply: aiReply
    });
    res.status(200).json({
      status: "success",
      data: {
        reply: aiReply
      }
    });

  } catch (err) {
    // طباعة الخطأ في Terminal للمطور
    console.error("Groq API Error:", err.response ? JSON.stringify(err.response.data) : err.message);

    // إرسال تفاصيل الخطأ لـ Postman عشان لو فيه حاجة نعرفها فوراً
    const errorDetail = err.response?.data?.error?.message || err.message;
    
    return res.status(err.response?.status || 500).json({
      status: "error",
      message: "AI Service Error (Groq)",
      details: errorDetail
    });
  }
});