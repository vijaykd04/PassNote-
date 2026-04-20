import { PDFParse } from "pdf-parse"
import path from "path"
import { fileURLToPath } from "url"
import UserModel from "../models/user.model.js"
import { generateGeminiResponse, generateGroqVisionResponse } from "../services/gemini.services.js"
import { buildComparePrompt, buildCompareImagePrompt } from "../utils/comparePromptBuilder.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workerPath = path.resolve(__dirname, "../node_modules/pdf-parse/dist/worker/pdf.worker.mjs")
PDFParse.setWorker(new URL(`file://${workerPath}`).href)

const extractTextFromBuffer = async (buffer) => {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return result.text?.trim() ?? ""
}

export const comparePyq = async (req, res) => {
  try {
    const files = req.files
    if (!files || files.length < 2) {
      return res.status(400).json({ message: "Please upload at least 2 files to compare." })
    }
    if (files.length > 5) {
      return res.status(400).json({ message: "Maximum 5 files allowed for comparison." })
    }

    const user = await UserModel.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    const cost = files.length * 2  // 2 credits per paper
    if (user.credits < cost) {
      return res.status(403).json({ message: `Need at least ${cost} 💠 credits (${files.length} papers × 2).` })
    }

    const pdfs = files.filter(f => f.mimetype === "application/pdf")
    const images = files.filter(f => f.mimetype.startsWith("image/"))

    // Mixed file types: not allowed for simplicity
    if (pdfs.length > 0 && images.length > 0) {
      return res.status(400).json({ message: "Please upload either all PDFs or all images, not a mix." })
    }

    let aiResponse

    if (images.length >= 2) {
      // Multi-image vision call
      console.log(`✅ Comparing ${images.length} image papers`)
      const prompt = buildCompareImagePrompt(images.length)

      const contentParts = images.map((img, i) => ({
        type: "image_url",
        image_url: { url: `data:${img.mimetype};base64,${img.buffer.toString("base64")}` }
      }))
      contentParts.push({ type: "text", text: prompt })

      const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{ role: "user", content: contentParts }],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err)
      }
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content?.replace(/```json/g, "").replace(/```/g, "").trim()
      aiResponse = JSON.parse(text)

    } else {
      // Multiple PDFs — extract text from each
      console.log(`✅ Comparing ${pdfs.length} PDF papers`)
      const papersContent = []
      for (const file of pdfs) {
        try {
          const text = await extractTextFromBuffer(file.buffer)
          const trimmed = text.length > 4000 ? text.slice(0, 4000) + "...[trimmed]" : text
          papersContent.push({ label: file.originalname.replace(".pdf", ""), content: trimmed })
        } catch (e) {
          papersContent.push({ label: file.originalname, content: "[Could not extract text from this PDF]" })
        }
      }
      const prompt = buildComparePrompt(papersContent)
      aiResponse = await generateGeminiResponse(prompt)
    }

    user.credits -= cost
    if (user.credits <= 0) user.isCreditAvailable = false
    await user.save()

    return res.status(200).json({ data: aiResponse, creditsLeft: user.credits, filesAnalyzed: files.length })
  } catch (error) {
    console.error("Compare PYQ Error:", error)
    res.status(500).json({ error: "Comparison failed", message: error.message })
  }
}
