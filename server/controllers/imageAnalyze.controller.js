import UserModel from "../models/user.model.js"
import { generateGroqVisionResponse } from "../services/gemini.services.js"
import { buildImageAnalysisPrompt } from "../utils/imagePromptBuilder.js"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" })
    }

    const mimeType = req.file.mimetype
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ message: "Only JPG, PNG, and WEBP images are supported" })
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Image must be smaller than 5 MB" })
    }

    const user = await UserModel.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.credits < 5) {
      return res.status(403).json({ message: "Insufficient credits. Image analysis costs 5 credits." })
    }

    console.log(`✅ Image upload: ${req.file.originalname}, ${(req.file.size / 1024).toFixed(1)} KB, ${mimeType}`)

    const prompt = buildImageAnalysisPrompt()
    const aiResponse = await generateGroqVisionResponse(prompt, req.file.buffer, mimeType)

    user.credits -= 5
    if (user.credits <= 0) user.isCreditAvailable = false
    await user.save()

    return res.status(200).json({
      data: aiResponse,
      creditsLeft: user.credits,
      fileName: req.file.originalname,
    })
  } catch (error) {
    console.error("Image Analyze Error:", error)
    res.status(500).json({
      error: "Image analysis failed",
      message: error.message,
    })
  }
}
