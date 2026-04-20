// Groq API — OpenAI-compatible, free tier, powered by Llama 3.3 70B
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

/**
 * Sends a text prompt to Groq (Llama 3.3 70B) and returns parsed JSON.
 */
export const generateGeminiResponse = async (prompt) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Groq API Error:", err)
      throw new Error(err)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) throw new Error("No text returned from Groq")

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    return JSON.parse(cleanText)
  } catch (error) {
    console.error("Groq Fetch Error:", error.message)
    throw new Error("AI API fetch failed")
  }
}

/**
 * Sends an image (as base64) + prompt to Groq's vision model (Llama 4 Scout).
 * Returns parsed JSON in the same schema as text-based analysis.
 */
export const generateGroqVisionResponse = async (prompt, imageBuffer, mimeType) => {
  try {
    const base64Image = imageBuffer.toString("base64")

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Groq Vision API Error:", err)
      throw new Error(err)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) throw new Error("No text returned from Groq Vision")

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    return JSON.parse(cleanText)
  } catch (error) {
    console.error("Groq Vision Error:", error.message)
    throw new Error("AI image analysis failed")
  }
}