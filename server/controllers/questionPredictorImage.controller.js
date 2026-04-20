import UserModel from "../models/user.model.js"
import { generateGroqVisionResponse } from "../services/gemini.services.js"
import { buildQuestionPredictorPrompt } from "../utils/questionPredictorPromptBuilder.js"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Build image-specific version of the prediction prompt (no PDF text — the image IS the content)
const buildImagePredictorPrompt = () => `
You are a STRICT JSON generator for a student exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only — parsed with JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings

TASK:
Look at this image. It is a photograph of a past year question paper.
Read every visible question in the image. Then:
1. Identify recurring topics and patterns
2. Analyze which topics appear most
3. Predict questions likely to appear in the NEXT exam
4. Calculate topic-wise weightage (must sum to 100)

STRICT JSON FORMAT — DO NOT CHANGE:
{
  "examName": "string",
  "topTopics": [],
  "patternInsights": [],
  "predictedQuestions": [
    {
      "question": "string",
      "probability": "High",
      "type": "long",
      "topic": "string",
      "basis": "string"
    }
  ],
  "topicWeightage": [
    { "topic": "string", "percentage": 25 }
  ]
}

- "predictedQuestions" must have 8-10 items
- "topicWeightage" values must sum to 100
- "probability" must be exactly "High", "Medium", or "Low"
- "examName" should be inferred from visible paper heading or content

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown.
`

export const predictQuestionsFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file uploaded" })

    const mimeType = req.file.mimetype
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ message: "Only JPG, PNG, and WEBP images are supported" })
    }

    const user = await UserModel.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.credits < 5) {
      return res.status(403).json({ message: "Insufficient credits. Question prediction costs 5 credits." })
    }

    console.log(`✅ Predictor image: ${req.file.originalname}, ${(req.file.size/1024).toFixed(1)} KB`)

    const prompt = buildImagePredictorPrompt()
    const aiResponse = await generateGroqVisionResponse(prompt, req.file.buffer, mimeType)

    user.credits -= 5
    if (user.credits <= 0) user.isCreditAvailable = false
    await user.save()

    return res.status(200).json({ data: aiResponse, creditsLeft: user.credits })
  } catch (error) {
    console.error("Image Predictor Error:", error)
    res.status(500).json({ error: "Image prediction failed", message: error.message })
  }
}
