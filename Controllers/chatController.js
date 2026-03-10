const Message = require('../models/messageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Groq = require("groq-sdk"); // تصحيح الاسم لـ Groq بالـ q

// تأكد إن الـ API Key مكتوب صح في ملف الـ .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.sendMessage = catchAsync(async (req, res, next) => {
    const { message } = req.body;

    // 1) التأكد من وجود رسالة
    if (!message) {
        return next(new AppError("يرجى كتابة رسالة", 400));
    }

    // 2) حفظ رسالة المستخدم في قاعدة البيانات
    let userMsg;
    try {
        userMsg = await Message.create({
            user: req.user.id,
            text: message,
            role: 'user'
        });
    } catch (err) {
        console.error("❌ Database Error (User Message):", err.message);
        return next(new AppError("فشل في حفظ رسالة المستخدم", 500));
    }

    // 3) طلب الرد من Groq AI
    let aiReplyText;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: message }
            ],
            // الموديل ده هو الأكثر استقراراً في 2026 للنسخة المجانية
            model: "llama-3.1-8b-instant", 
        });

        aiReplyText = chatCompletion.choices[0]?.message?.content;
        
        if (!aiReplyText) throw new Error("Groq returned an empty response");

    } catch (err) {
        console.error("❌ Groq API Error:", err.message);
        // في حالة فشل الـ AI، نرسل إشعار واضح بدلاً من انهيار السيرفر
        return next(new AppError(`خطأ من مزود الذكاء الاصطناعي: ${err.message}`, 500));
    }

    // 4) حفظ رد الـ AI في قاعدة البيانات
    try {
        const aiMsg = await Message.create({
            user: req.user.id,
            text: aiReplyText,
            role: 'assistant'
        });

        // 5) إرسال الرد النهائي للـ Frontend
        res.status(200).json({
            status: 'success',
            data: aiMsg
        });
    } catch (err) {
        console.error("❌ Database Error (AI Message):", err.message);
        return next(new AppError("فشل في حفظ رد الذكاء الاصطناعي", 500));
    }
});

exports.getChatHistory = catchAsync(async (req, res, next) => {
    const messages = await Message.find({ user: req.user.id }).sort('createdAt');
    res.status(200).json({
        status: "success",
        result: messages.length,
        data: { messages }
    });
});