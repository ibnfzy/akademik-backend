import { markStudentsAbsentForDate } from "../models/attendance.js";
import { successResponse, errorResponse } from "../utils/response.js";

const parseDateQuery = (queryDate) => {
  if (!queryDate) {
    return null;
  }

  const trimmed = String(queryDate).trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
};

export const autoAlphaStudents = async (req, res) => {
  try {
    const dateInput = parseDateQuery(req.query.date);
    const result = await markStudentsAbsentForDate(dateInput);

    const message =
      result.inserted > 0
        ? `${result.inserted} catatan kehadiran berhasil ditandai alfa`
        : "Tidak ada siswa yang perlu ditandai alfa";

    return successResponse(res, result, message);
  } catch (err) {
    if (err.code === "INVALID_DATE") {
      return errorResponse(res, 400, "Format tanggal tidak valid");
    }

    return errorResponse(res, 500, err.message);
  }
};
