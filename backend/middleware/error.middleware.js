import multer from "multer";

export const errorHandler = (error, _req, res, _next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ code: "PAYLOAD_TOO_LARGE", message: "حجم الطلب أكبر من المسموح" });
  }

  if (error instanceof multer.MulterError) {
    const status = error.code.startsWith("LIMIT_") ? 413 : 400;
    return res.status(status).json({ code: error.code, message: "ملف الإيصال غير صالح" });
  }

  if (error?.code === "INVALID_RECEIPT_TYPE") {
    return res.status(400).json({ code: error.code, message: error.message });
  }

  console.error("Unhandled request error", error);
  return res.status(500).json({ code: "INTERNAL_ERROR", message: "حدث خطأ في الخادم" });
};
