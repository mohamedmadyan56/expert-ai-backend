module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // الـ stack بيعرفك الغلطة في أنهي سطر بالظبط (بيظهر في وقت التطوير بس)
    stack: err.stack 
  });
};