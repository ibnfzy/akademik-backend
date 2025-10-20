// Middleware untuk handle error global di Express
export const errorHandler = (err, req, res, next) => {
  console.error("Error Middleware:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    code: err.code || "SERVER_ERROR",
  });
};

// Middleware untuk handle route yang tidak ditemukan
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
