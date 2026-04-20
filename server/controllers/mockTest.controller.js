import { PDFParse } from "pdf-parse"
import path from "path"
import { fileURLToPath } from "url"
import UserModel from "../models/user.model.js"
import { generateGeminiResponse } from "../services/gemini.services.js"
import { buildMockTestPrompt } from "../utils/mockTestPromptBuilder.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workerPath = path.resolve(__dirname, "../node_modules/pdf-parse/dist/worker/pdf.worker.mjs")
PDFParse.setWorker(new URL(`file://${workerPath}`).href)

const extractText = async (buffer) => {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return { text: result.text?.trim() ?? "", numPages: result.total ?? 0 }
}

export const generateMockTest = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" })

    const user = await UserModel.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.credits < 5) return res.status(403).json({ message: "Insufficient credits. Mock test generation costs 5 credits." })

    let pdfText, numPages
    try {
      const result = await extractText(req.file.buffer)
      pdfText = result.text
      numPages = result.numPages
      console.log(`✅ Mock test PDF: ${numPages} pages, ${pdfText.length} chars`)
    } catch (err) {
      console.error("PDF parse error:", err.message)
      return res.status(422).json({ message: "Could not read PDF. Make sure it contains selectable text." })
    }

    if (!pdfText || pdfText.length < 50) {
      return res.status(422).json({ message: "PDF appears to be empty or image-only." })
    }

    const trimmedText = pdfText.length > 12000 ? pdfText.slice(0, 12000) + "\n...[trimmed]" : pdfText
    const prompt = buildMockTestPrompt(trimmedText)
    const aiResponse = await generateGeminiResponse(prompt)

    user.credits -= 5
    if (user.credits <= 0) user.isCreditAvailable = false
    await user.save()

    return res.status(200).json({ data: aiResponse, creditsLeft: user.credits, pageCount: numPages })
  } catch (error) {
    console.error("Mock Test Error:", error)
    res.status(500).json({ error: "Mock test generation failed", message: error.message })
  }
}
