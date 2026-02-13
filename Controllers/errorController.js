const AppError = require("../Utils/appError");

// ================= SEND ERROR DEV =================
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// ================= SEND ERROR PROD =================
const sendErrorProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
const handleJWTError = () => {
  return new AppError('Invalid token, please login again', 401);
};

// ================= GLOBAL ERROR =================
const globalErrorHandler = (err, req, res, next) => {

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
if(err.name === 'JsonWebTokenError'){
          err = handleJWTError();

    }
  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      name: err.name
    })
    

  } else if (process.env.NODE_ENV === "production") {
    sendErrorProd(err, res);
  }
};

  
 
module.exports = globalErrorHandler;