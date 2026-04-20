import { PDFParse } from "pdf-parse"
import { fileURLToPath } from "url"
import path from "path"
import UserModel from "../models/user.model.js"
import { generateGeminiResponse } from "../services/gemini.services.js"
import { buildPdfPrompt } from "../utils/pdfPromptBuilder.js"

// Point pdf-parse to its bundled worker file (required for Node.js env)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workerPath = path.resolve(__dirname, "../node_modules/pdf-parse/dist/worker/pdf.worker.mjs")
PDFParse.setWorker(new URL(`file://${workerPath}`).href)

/**
 * Extract plain text from a PDF buffer using pdf-parse v2 class API
 */
const extractTextFromPdf = async (buffer) => {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return {
    text: result.text?.trim() ?? "",
    numPages: result.total ?? 0,
  }
}

export const analyzePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" })
    }

    const user = await UserModel.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.credits < 5) {
      return res.status(403).json({ message: "Insufficient credits. PDF analysis costs 5 credits." })
    }

    // Extract text from PDF buffer
    let pdfText, numPages
    try {
      const result = await extractTextFromPdf(req.file.buffer)
      pdfText = result.text
      numPages = result.numPages
      console.log(`✅ PDF extracted: ${numPages} pages, ${pdfText.length} chars`)
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr.message)
      return res.status(422).json({
        message: "Could not read PDF. Make sure it contains selectable text (not a scanned image).",
      })
    }

    if (!pdfText || pdfText.length < 50) {
      return res.status(422).json({
        message: "PDF appears to be empty or image-only. Please upload a text-based PDF.",
      })
    }

    // Trim to ~12000 chars to stay within Gemini token limits
    const trimmedText =
      pdfText.length > 12000
        ? pdfText.slice(0, 12000) + "\n...[content trimmed for length]"
        : pdfText

    // Build prompt + call the same Gemini model used for notes generation
    const prompt = buildPdfPrompt(trimmedText)
    const aiResponse = await generateGeminiResponse(prompt)

    // Deduct 5 credits
    user.credits -= 5
    if (user.credits <= 0) user.isCreditAvailable = false
    await user.save()

    return res.status(200).json({
      data: aiResponse,
      creditsLeft: user.credits,
      pageCount: numPages,
    })
  } catch (error) {
    console.error("PDF Analyze Error:", error)
    res.status(500).json({
      error: "PDF analysis failed",
      message: error.message,
    })
  }
}
