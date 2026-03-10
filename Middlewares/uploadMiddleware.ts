import multer from 'multer';

// هنا احنا بنقول للمالتر بدل ما تسيف الصوره في ال هارد دسك بتاع الجهاز 
//سيفها في الرام بما اننا كدا كدا هنرفعها علي سحابه بشكل مؤقت لان دا احسن واسرع بكتير 
const storage = multer.memoryStorage();

// نحدد إعدادات Multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // الحد الأقصى للملف 5MB
  },
  fileFilter: (req, file, cb) => {
    // يسمح بس الصور فقط
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
});

export default upload;  