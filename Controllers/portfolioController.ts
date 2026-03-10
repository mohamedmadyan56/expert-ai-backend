import { Request, Response, NextFunction } from 'express';
import Portfolio from '../models/Portfolio'; // الموديل اللي عملناه
import cloudinary from '../utils/cloudinary'; // الملف اللي عملناه

export const createPortfolio = async (req: any, res: Response, next: NextFunction) => {
    try {
        // 1. تشيك الملف
        if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'برجاء رفع صوره'
            });
        }

        // 2. سحب الـ ID (تأكد إنه بنفس الاسم في Postman)
        const expertId = req.get('userid');

        if (!expertId) {
            return res.status(401).json({
                status: 'fail',
                message: 'User ID is required in headers (userid)'
            });
        }

        // 3. تحويل ورفع الصورة (السطر ده عبقري ومختصر)
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
            folder: 'expertly_portfolio',
        });

        // 4. الحفظ في الداتابيز
        const newWork = await Portfolio.create({
            expert: expertId,
            title: req.body.title,
            description: req.body.description,
            imageUrl: uploadResponse.secure_url,
            category: req.body.category,
            link: req.body.link
        });

        // 5. الرد
        res.status(201).json({
            status: 'success',
            data: newWork
        });

    } catch (error) {
        // الـ Error handling بتاعك ممتاز جداً
        if (error instanceof Error) {
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        } else {
            res.status(400).json({
                status: 'fail',
                message: 'Unknown error occurred'
            });
        }
    }
};

export const getAllPortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expertId = req.get('userid');


        const works = await Portfolio.find({ expert: expertId }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            results: works.length,
            data: works
        })


    } catch (erorr) {
        res.status(400).json({
            status: 'fail',
            message: 'حدث خطأ اثناء جلب البيانات'
        })
    }
}

export const deletePortfolio = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // ID المشروع اللي عايزين نمسحه
        const expertId = req.get('userid'); // ID الشخص اللي بيحاول يمسح

        // 1. بندور على المشروع ونشوف صاحبه مين
        const portfolioItem = await Portfolio.findById(id);

        if (!portfolioItem) {
            return res.status(404).json({ status: 'fail', message: 'المشروع غير موجود' });
        }

        // 2. حماية الخصوصية: هل الـ ID اللي في الهيدر هو صاحب المشروع؟
        if (portfolioItem.expert.toString() !== expertId) {
            return res.status(403).json({
                status: 'fail',
                message: 'غير مسموح لك بمسح هذا المشروع، لست أنت صاحبه!'
            });
        }

        // 3. المسح
        await Portfolio.findByIdAndDelete(id);

        res.status(204).json({
            status: 'success',
            data: null
        });

    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error instanceof Error ? error.message : 'حدث خطأ أثناء المسح'
        });
    }
};







