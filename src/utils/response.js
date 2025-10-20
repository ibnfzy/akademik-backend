// Helper untuk response sukses
export const successResponse = (res, data = {}, message = "", meta = {}) => {
  return res.status(200).json({
    success: true,
    data: {
      success: true,
      ...data,
    },
    message,
    meta,
  });
};

// Helper untuk response error
export const errorResponse = (
  res,
  statusCode = 500,
  message = "Internal Server Error",
  errors = [],
  code = "SERVER_ERROR"
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    code,
  });
};
