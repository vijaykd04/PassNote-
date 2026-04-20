import express from "express"
import multer from "multer"
import isAuth from "../middleware/isAuth.js"
import { pdfDownload } from "../controllers/pdf.controller.js"
import { analyzePdf } from "../controllers/pdfAnalyze.controller.js"
import { generateMockTest } from "../controllers/mockTest.controller.js"
import { predictQuestions } from "../controllers/questionPredictor.controller.js"
import { analyzeImage } from "../controllers/imageAnalyze.controller.js"
import { predictQuestionsFromImage } from "../controllers/questionPredictorImage.controller.js"
import { comparePyq } from "../controllers/comparePyq.controller.js"

const pdfRouter = express.Router()

// PDF upload — memory storage, PDF only, max 10 MB
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true)
    else cb(new Error("Only PDF files are allowed"))
  },
})

// Image upload — memory storage, images only, max 5 MB
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error("Only JPG, PNG, and WEBP images are allowed"))
  },
})

// Mixed upload — accepts PDFs and images, max 5 files × 10 MB each
const uploadMixed = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error("Only PDF, JPG, PNG, or WEBP files are allowed"))
  },
})

pdfRouter.post("/generate-pdf", isAuth, pdfDownload)
pdfRouter.post("/analyze-pdf", isAuth, uploadPdf.single("pdf"), analyzePdf)
pdfRouter.post("/mock-test", isAuth, uploadPdf.single("pdf"), generateMockTest)
pdfRouter.post("/predict-questions", isAuth, uploadPdf.single("pdf"), predictQuestions)
pdfRouter.post("/analyze-image", isAuth, uploadImage.single("image"), analyzeImage)
pdfRouter.post("/predict-questions-image", isAuth, uploadImage.single("image"), predictQuestionsFromImage)
pdfRouter.post("/compare-pyq", isAuth, uploadMixed.array("files", 5), comparePyq)

export default pdfRouter
