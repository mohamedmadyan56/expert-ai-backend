const Portfolio = require('../models/Portfolio');
const cloudinary = require('../utils/cloudinary');

const createPortfolio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'برجاء رفع صوره'
      });
    }

    const expertId = req.get('userid');

    if (!expertId) {
      return res.status(401).json({
        status: 'fail',
        message: 'User ID is required in headers (userid)'
      });
    }

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'expertly_portfolio',
    });

    const newWork = await Portfolio.create({
      expert: expertId,
      title: req.body.title,
      description: req.body.description,
      imageUrl: uploadResponse.secure_url,
      category: req.body.category,
      link: req.body.link
    });

    res.status(201).json({
      status: 'success',
      data: newWork
    });

  } catch (error) {
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

const getAllPortfolio = async (req, res, next) => {
  try {
    const expertId = req.get('userid');

    const works = await Portfolio.find({ expert: expertId }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: works.length,
      data: works
    });

  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: 'حدث خطأ اثناء جلب البيانات'
    });
  }
};

const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const expertId = req.get('userid');

    const portfolioItem = await Portfolio.findById(id);

    if (!portfolioItem) {
      return res.status(404).json({ status: 'fail', message: 'المشروع غير موجود' });
    }

    if (portfolioItem.expert.toString() !== expertId) {
      return res.status(403).json({
        status: 'fail',
        message: 'غير مسموح لك بمسح هذا المشروع، لست أنت صاحبه!'
      });
    }

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

module.exports = { createPortfolio, getAllPortfolio, deletePortfolio };
