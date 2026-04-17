# Expertly AI — شرح مفصّل للكود وما الذي تراجعه أولاً

**المشروع:** منصة تربط المستخدمين بخبراء وخدمات، مع شات ذكاء اصطناعي (Groq)، وملف تعريف، وخدمات، وبورتفوليو مع رفع صور (Cloudinary).

**التقنيات الأساسية:** Node.js + Express 5 + MongoDB/Mongoose، وواجهة React 19 + Vite + Tailwind في مجلد `expert-ai-client`.

---

## 1. هيكل المجلدات (ماذا يعني كل جزء؟)

| المسار | الوظيفة |
|--------|---------|
| `server.js` | نقطة تشغيل السيرفر: إعداد Express، CORS، الميدلوير، المسارات، الاتصال بـ MongoDB. |
| `Routes/` | تعريف عناوين الـ API وربطها بدوال الـ Controller (فصل التوجيه عن المنطق). |
| `Controllers/` | منطق الطلبات: قراءة `req`، التحدث مع قاعدة البيانات أو APIs خارجية، إرسال `res`. |
| `models/` | مخططات Mongoose (شكل المستندات في MongoDB + تحقق + خطافات pre-save). |
| `Middlewares/` | دوال تشتغل بين الطلب والـ Controller (رفع ملفات، معالجة أخطاء عامة). |
| `utils/` | أدوات مشتركة: `catchAsync`, `AppError`, إعداد Cloudinary. |
| `public/` | ملفات ثابتة (مثل صور المستخدمين بعد المعالجة بـ Sharp). |
| `expert-ai-client/` | تطبيق React: صفحات، سياق مصادقة، استدعاءات axios للـ API. |

---

## 2. الملف الرئيسي: `server.js`

### 2.1 إنشاء التطبيق والـ CORS

- **`express()`:** إنشاء تطبيق HTTP.
- **`allowedOrigins`:** قائمة بالنطاقات المسموح لها تستدعي الـ API (Netlify + localhost للتطوير).
- **`cors({ origin, credentials: true })`:**  
  - **لزومه:** المتصفح يمنع موقع على دومين من طلب موقع على دومين آخر إلا بقواعد CORS صحيحة.  
  - **`credentials: true`:** ضروري لأنك تستخدم **كوكيز** (`user_token`)؛ بدونها المتصفح لن يرسل الكوكي مع الطلبات من الفرونت.

### 2.2 الميدلوير الأساسية

- **`express.json({ limit: '10kb' })`:** تحويل جسم الطلب JSON إلى `req.body`، مع حد حجم يقلل هجمات إرسال أجسام ضخمة.
- **`cookie-parser`:** يملأ `req.cookies` حتى يقرأ `protect` التوكن من الكوكي.

### 2.3 الملفات الثابتة ومجلد الصور

- **`express.static('public')`:** تقديم ملفات من `public` مباشرة عبر HTTP.
- **إنشاء `public/img/users`:** يضمن أن `sharp` يستطيع حفظ صورة المستخدم بعد الرفع بدون خطأ "المجلد غير موجود".

### 2.4 تسجيل المسارات

كل مجموعة تحت بادئة واضحة (`/api/v1/...`) لتسهيل الإصدار لاحقاً وفصل الـ API عن أي مسارات مستقبلية.

### 2.5 معالج الأخطاء العام

- **`globalErrorHandler`:** آخر ميدلوير؛ أي خطأ يُمرَّر بـ `next(err)` يصل هنا ويُرجع JSON موحّد.

### 2.6 Mongoose و `listen`

- **`mongoose.connect(DATABASE_URL)`:** الاتصال بقاعدة البيانات قبل/أثناء استقبال الطلبات.
- **`app.listen(PORT)`:** بدء السيرفر على المنفذ من `PORT` أو 5000.

**ما تراجعه هنا:** ترتيب الميدلوير (CORS → json → cookie → routes → error handler)، وقائمة `allowedOrigins` عند النشر على دومين جديد.

---

## 3. المصادقة والأمان — `Controllers/authController.js`

### `signToken(id)`

- **الوظيفة:** إنشاء JWT يحتوي `id` المستخدم، موقّع بـ `JWT_SECRET`، بمدة `JWT_EXPIRES_IN` أو 90 يوماً افتراضياً.
- **لزومه:** هوية المستخدم في الطلبات اللاحقة بدون إرسال كلمة المرور في كل مرة.

### `signup`

- ينشئ مستخدماً من `req.body` عبر `User.create`.
- يولّد توكناً ويضعه في كوكي `user_token` (`httpOnly` يقلل خطر سرقة التوكن بسكربت XSS).
- يرجع أيضاً التوكن في JSON (مفيد لـ Postman أو لو الفرونت يخزّن التوكن في `localStorage`).

### `login`

- يتحقق من وجود `email` و`password`.
- يجلب المستخدم مع `+password` لأن الحقل مخفي افتراضياً في الموديل.
- يقارن كلمة المرور بـ `correctPassword` (bcrypt).
- يضع نفس الكوكي ويرجع التوكن والمستخدم.

### `protect` (ميدلوير حماية)

- يبحث عن التوكن بالترتيب: **Header `Authorization: Bearer ...`** ثم **كوكي `user_token`**.
- يتحقق من التوكن بـ `jwt.verify`.
- يتأكد أن المستخدم موجود و`active !== false`.
- يستدعي `changePasswordAfter` لرفض توكنات قديمة بعد تغيير كلمة المرور.
- يضع **`req.user`** للمسارات التالية.

### `restrictTo(...roles)`

- يعيد ميدلويراً يتحقق من `req.user.role`؛ مفيد لاحقاً لمسارات الأدمن فقط (حالياً جزء من الخدمات يعتمد على فحص الدور داخل الـ Controller).

**ما تراجعه:** في الإنتاج غالباً `secure: true` للكوكي مع HTTPS؛ إزالة أو تقليل `console.log` للتوكن في الإنتاج.

---

## 4. المستخدم والصورة — `Controllers/userController.js`

### `filterObj(obj, ...allowedFields)`

- **الوظيفة:** نسخ حقول محددة فقط من `req.body`.
- **لزومه:** منع المستخدم من تحديث حقول حساسة مثل `role` أو `password` عبر نفس مسار البروفايل.

### إعداد Multer (`multerStorage`, `multerFilter`, `upload`)

- **الذاكرة:** الصورة تُقرأ كـ `buffer` (مناسب لـ Sharp قبل الحفظ على القرص).
- **`fileFilter`:** يرفض أي ملف ليس صورة.

### `uploadUserPhoto`

- **`upload.single('photo')`:** ميدلوير يتوقع حقل الملف اسمه `photo` في الـ multipart.

### `resizeUserPhoto`

- **Sharp:** تغيير مقاس الصورة إلى 500×500، JPEG بجودة 90، وحفظها في `public/img/users` باسم فريد.
- **لزومه:** توحيد حجم الصور وتقليل المساحة وتحسين الأداء.

### `updateMe`

- يرفض تحديث كلمة المرور من هذا المسار.
- يبني `filteredBody` من الحقول المسموحة (الاسم، bio، headline، روابط، إلخ).
- يتعامل مع `skills` سواء من FormData كـ `skills[]` أو JSON.
- إن وُجد ملف، يضيف `photo` باسم الملف المحفوظ.
- **`findByIdAndUpdate`** مع `runValidators: true`.

### `getMe`

- يرجع المستخدم الحالي اعتماداً على `req.user.id` من `protect`.

### `deleteMe`

- **حذف منطقي:** `active: false` بدلاً من مسح السجل (يحافظ على البيانات ويمنع الدخول حسب منطقك).

**ما تراجعه:** أي حقل جديد في الموديل يظهر في البروفايل يجب إضافته لـ `filterObj` إن كان مسموحاً.

---

## 5. الخدمات — `Controllers/serviceController.js`

### `addService`

- يربط `req.body.expert` بـ `req.user.id`.
- يسمح بإضافة الخدمة لـ `expert` أو `admin` فقط.
- ينشئ مستند `Service`.

### `getAllServices`

- **`Service.find()`** — مع ملاحظة أن الموديل يعمل `populate` تلقائياً لبيانات الخبير في استعلامات `find` (انظر الموديل).

### `updateService` / `deleteService`

- يتحققان أن الخدمة موجودة.
- يسمحان للمالك (`service.expert`) أو للـ `admin` بالتعديل/الحذف.

**ما تراجعه:** توافق أسماء الحقول مع ما يرسله الفرونت؛ صلاحيات الأدمن مقابل الخبير.

---

## 6. الشات مع Groq — `Controllers/chatController.js`

### إعداد `Groq`

- عميل SDK يستخدم `GROQ_API_KEY` من البيئة.

### `sendMessage`

1. التحقق من وجود `message`.
2. حفظ رسالة المستخدم في `Message` مع `role: 'user'`.
3. استدعاء Groq (`llama-3.1-8b-instant`) والحصول على النص.
4. حفظ رد المساعد في MongoDB بـ `role: 'assistant'`.
5. إرجاع آخر رسالة (كائن الـ AI) للفرونت.

### `getChatHistory`

- جلب كل رسائل `req.user.id` مرتبة زمنياً.

**ما تراجعه:** اختلاف الموديل هنا عن `aiController` (موديل أخف للشات السريع مقابل موديل أثقل للاستشارة) — هل هذا مقصود؟ معالجة الأخطاء من Groq ورسائل المستخدم بالعربية واضحة.

---

## 7. استشارة AI (مسار منفصل) — `Controllers/aiController.js`

### `getAIResponse`

- يتوقع `prompt` في الـ body.
- يستدعي **REST** لـ Groq (`axios.post` إلى `chat/completions`) بموديل **`llama-3.3-70b-versatile`**.
- يرجع `{ reply }` في JSON.
- في الخطأ: يرجع حالة HTTP من الاستجابة إن وُجدت مع `details`.

**ملاحظة للمراجعة:** يوجد استيراد `Consultation` في الملف لكن **لا يُستخدم** في الكود الحالي — يمكن حذفه أو إكمال ميزة حفظ الاستشارات في `consultationModel`.

---

## 8. إحصائيات — `Controllers/statsController.js`

### `getPlatformStats`

- **`User.countDocuments()`** لعدد المستخدمين.
- باقي الحقول (`totalQueries`, `aiModelsActive`, `serverUptime`) **قيم تجريبية/ثابتة** وليست من قاعدة البيانات — مفيدة لواجهة "أرقام تقريبية" لكن يجب توثيق ذلك.

### `getAboutStats`

- آخر 3 مستخدمين (`sort` بـ `createdAt`) مع `name` و`createdAt`.
- إجمالي المستخدمين.

**ما تراجعه:** إن أردت أرقاماً حقيقية للاستعلامات، تحتاج جمعاً من موديل الرسائل أو سجلات منفصلة.

---

## 9. البورتفوليو — `Controllers/portfolioController.js`

### `createPortfolio`

- يتطلب ملف صورة (`req.file`).
- يقرأ **`userid` من الهيدر** (ليس JWT من `protect`).
- يحوّل الصورة إلى Data URL base64 ويرفعها لـ Cloudinary تحت مجلد `expertly_portfolio`.
- ينشئ سجل `Portfolio` مع `imageUrl` من Cloudinary.

### `getAllPortfolio`

- يجلب أعمال الخبير حسب `userid` في الهيدر، مرتبة من الأحدث.

### `deletePortfolio`

- يتحقق من الملكية: `portfolioItem.expert` يجب أن يساوي `userid` من الهيدر.

**ما تراجعه (مهم جداً):** الاعتماد على هيدر `userid` **سهل تزويره** إن لم يكن الطلب محمياً بطبقة أخرى؛ الأفضل ربط البورتفوليو بـ `protect` واستخدام `req.user.id` بدلاً من ثقة الهيدر اليدوي.

---

## 10. المسارات `Routes/*`

| الملف | الوظيفة |
|-------|---------|
| `userRoutes.js` | `signup`, `login`؛ `updateMe` + رفع صورة + `getMe`, `deleteMe` تحت `protect`. |
| `serviceRoutes.js` | `router.use(protect)` — كل المسارات تتطلب تسجيل الدخول. |
| `aiRoutes.js` | `POST /consult` محمي بـ `protect`. |
| `chatRoutes.js` | `router.use(protect)` ثم GET/POST على `/`. |
| `statsRoutes.js` | إحصائيات عامة بدون `protect` في الملف الحالي. |
| `portfolioRoutes.js` | GET/POST/DELETE **بدون** `protect` — يعتمد على هيدر `userid`. |

**ما تراجعه:** توحيد سياسة الحماية (JWT/cookie لكل شيء يخص مستخدماً معيّناً).

---

## 11. الموديلات `models/*`

### `userModel.js`

- حقول الملف الشخصي، الدور، كلمة المرور، `active`, `passwordChangedAt`.
- **`pre('save')`:** تشفير كلمة المرور بـ bcrypt عند التعديل.
- **`correctPassword` / `changePasswordAfter`:** للدخول وإبطال التوكن بعد تغيير كلمة المرور.
- **`virtual daysOnPlatform`:** عمر الحساب بالأيام (حساب من `createdAt`).

### `serviceModel.js`

- حقول الخدمة (عنوان، وصف، سعر، تصنيف، مدة تسليم، خبير، تقييمات).
- **`pre(/^find/)`:** populate للخبير مع حقول محددة.

### `messageModel.js`

- رسالة مرتبطة بمستخدم، نص، دور `user` أو `assistant`.

### `consultationModel.js`

- مخطط لاستشارات (prompt/reply) — **جاهز لاستخدام** لكن غير مربوط بـ `aiController` حالياً.

### `Portfolio.js`

- عمل مرتبط بخبير، عنوان، وصف، `imageUrl`, تصنيف، رابط اختياري.

### `Service.js` (جذر `models/`)

- **تكرار محتمل:** يعرّف موديلاً باسم `Service` بسيطاً؛ التطبيق الفعلي للخدمات يستخدم **`serviceModel.js`**. راجع أيهما تريد الاحتفاظ به لتجنب الالتباس.

---

## 12. الميدلوير والأدوات المساعدة

### `Middlewares/errorMiddleware.js`

- معالج أخطاء بسيط: يضبط `statusCode` الافتراضي 500 ويرجع `message` و`stack` دائماً.

### `Middlewares/uploadMiddleware.js`

- Multer ذاكرة، حد 5MB، صور فقط — لمسار البورتفوليو.

### `utils/catchAsync.js`

- يلف الدالة غير المتزامنة ويمرّر أي `reject` إلى `next` — يقلل `try/catch` المتكرر.

### `utils/appError.js`

- خطأ تشغيلي متوقع برسالة وحالة HTTP و`isOperational`.

### `utils/cloudinary.js`

- تهيئة Cloudinary من متغيرات البيئة.

### `Controllers/errorController.js`

- معالج أخطاء أكثر تفصيلاً (dev vs prod) ومعالجة `JsonWebTokenError` — **ملاحظة:** المسار المستورد `../Utils/appError` قد يفشل على أنظمة حساسة لحالة الأحرف؛ والسيرفر الحالي يستخدم **`errorMiddleware.js`** وليس هذا الملف. راجع أي ملف تريده فعلياً كمعالج مركزي.

---

## 13. الواجهة الأمامية `expert-ai-client`

### `main.jsx`

- **`BrowserRouter`:** تفعيل React Router.
- **`AuthProvider`:** يوفّر حالة المستخدم لكل الشجرة.

### `App.jsx`

- حماية المسارات: مثلاً `/chat`, `/profile`, `/portfolio` تتطلب `user`؛ غير المسجلين يُوجَّهون لـ `/login`.
- **ملاحظة:** مسار `/service` يستخدم `Navigate to="/service"` عند عدم وجود مستخدم — قد يسبب حلقة؛ المراجعة المنطقية تقترح التوجيه إلى `/login` مثل الصفحات الأخرى.

### `context/AuthContext.jsx`

- عند التحميل: يقرأ `token` و`user` من `localStorage`.
- `login` / `logout` لتحديث التخزين والحالة.

### `Login.jsx` (مراجعة دقيقة)

- يرسل طلباً مع `withCredentials: true` (مناسب للكوكي).
- يجب التأكد أن استدعاء `login(user, token)` يمرّر **`response.data.token`** وليس حقلاً خاطئاً من الاستجابة — وإلا لن يعمل Bearer في الشات.

### `Chat.jsx`

- جلب التاريخ: `GET /api/v1/chat` مع `Authorization: Bearer`.
- إرسال رسالة: `POST` بنفس الهيدر.
- عرض الرسائل مع تمرير تلقائي للأسفل.

### `portfolioPage.tsx`

- يستخدم `EXPERT_ID` ثابتاً وهيدر `userid` — مناسب للتجربة لكن للإنتاج يجب ربطه بـ `user._id` من السياق بعد تسجيل الدخول.

### مجلد `Node&Express&Mongodb` داخل `src/components/`

- يبدو **نسخاً تعليمية/قديمة** من باكند وليست جزءاً من تشغيل التطبيق الفعلي؛ يمكن أرشفتها لتقليل الالتباس.

---

## 14. متغيرات البيئة (ما تحتاجه)

- **`DATABASE_URL`:** اتصال MongoDB.
- **`JWT_SECRET`**, **`JWT_EXPIRES_IN`** (اختياري).
- **`GROQ_API_KEY`:** لشات الاستشارة ومسار الـ AI.
- **`CLOUDINARY_*`:** لرفع صور البورتفوليو.
- **`PORT`:** منفذ السيرفر.

ملف `.env.example` في المشروع **ناقص** لهذه المتغيرات؛ يُفضّل توسيعه لتوثيق كل المفاتيح دون كشف القيم الحقيقية.

---

## 15. أهم ما تراجع عليه (قائمة تحقق سريعة)

1. **أمان البورتفوليو:** استبدال هيدر `userid` بمصادقة JWT و`req.user.id`.
2. **اتساق معالجة الأخطاء:** `errorMiddleware` vs `errorController` — واحد فقط كمصدر حقيقة.
3. **تكرار موديل `Service`:** احذف أو ادمج مع `serviceModel.js`.
4. **تسجيل الدخول والتوكن:** تطابق حقول `axios` مع استجابة السيرفر (`token` في JSON).
5. **مسار `/service` في `App.jsx`:** منطق التوجيه عند عدم تسجيل الدخول.
6. **إحصائيات المنصة:** هل الأرقام تجريبية أم يجب ربطها ببيانات حقيقية؟
7. **كوكي `secure`:** false مناسب لـ localhost فقط؛ عند النشر على HTTPS غيّر إلى true.
8. **`aiController`:** إزالة استيراد `Consultation` غير المستخدم أو تفعيل الحفظ في قاعدة البيانات.
9. **موديلان/مساران لـ Groq:** فهم الفرق بين شات سريع (`chatController`) واستشارة بموديل أكبر (`aiController`).
10. **CORS:** إضافة أي دومين إنتاج جديد لـ `allowedOrigins`.

---

## 16. خريطة الـ API (مرجع سريع)

- `POST /api/v1/users/signup` — تسجيل  
- `POST /api/v1/users/login` — دخول  
- `GET /api/v1/users/getMe` — بياناتي (محمي)  
- `PATCH /api/v1/users/updateMe` — تحديث البروفايل + صورة (محمي)  
- `DELETE /api/v1/users/deleteMe` — تعطيل الحساب (محمي)  
- `GET|POST|PATCH|DELETE /api/v1/services/...` — خدمات (كلها محمية)  
- `POST /api/v1/ai/consult` — استشارة AI (محمي)  
- `GET|POST /api/v1/chat` — تاريخ الشات وإرسال رسالة (محمي)  
- `GET /api/v1/stats` و `GET /api/v1/stats/about-info` — إحصائيات  
- `GET|POST|DELETE /api/v1/portfolio` — بورتفوليو (هيدر `userid` حالياً)

---

*آخر تحديث للوثيقة: أبريل 2026 — مبني على نسخة المشروع الحالية في المستودع.*
