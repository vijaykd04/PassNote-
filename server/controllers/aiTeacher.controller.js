const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"

const buildSystemPrompt = (topic, mode, language = "English") => {
  const base = `You are Nova, a warm, enthusiastic, and patient human AI teacher in a live 1-on-1 video call session with a student.
You are teaching: "${topic}".

CRITICAL: You MUST respond ONLY in ${language}. Every word must be in ${language}.

PERSONALITY:
- Speak conversationally and naturally, as if talking face to face
- Be encouraging, supportive, and positive  
- Use simple analogies and real-world examples
- Keep every response to 2–4 short sentences max — you are in a LIVE CALL
- Never use markdown, bullet points, or headers — speak in plain natural sentences
- Feel human and relatable — use phrases like "Great question!", "Think of it this way…", "Exactly right!"`

  if (mode === 'explain') return base + `

YOUR CURRENT MODE: EXPLANATION
- Guide the student through the topic step by step
- After each concept, ask "Does that make sense?" or "Any questions so far?"
- If the student says "next" or "continue", move to the next concept
- Keep a mental map of what you've explained so far and don't repeat yourself`

  if (mode === 'doubt') return base + `

YOUR CURRENT MODE: DOUBT CLEARING
- The student has doubts and questions — answer them clearly and concisely
- Use analogies and concrete examples
- After answering, ask if they need more clarification
- Be very patient — if they still don't understand, try a different explanation`

  if (mode === 'test') return base + `

YOUR CURRENT MODE: TESTING
- You are testing the student's knowledge of ${topic}
- Ask ONE question at a time — wait for their answer before asking the next
- After each answer: give specific feedback, tell them if correct or incorrect, and explain the correct answer
- Keep score in your head, announce it at the end
- Mix easy and hard questions
- Be encouraging even for wrong answers`

  return base
}

export const aiTeacherChat = async (req, res) => {
  try {
    const { topic, message, mode = 'explain', history = [], language = 'English' } = req.body

    if (!topic || !message) {
      return res.status(400).json({ message: "Topic and message are required" })
    }

    const systemPrompt = buildSystemPrompt(topic, mode, language)

    // Build conversation history for Groq
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // last 10 messages for context
      { role: "user", content: message }
    ]

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 256, // short responses for natural conversation
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim()

    if (!reply) throw new Error("No response from AI teacher")

    return res.status(200).json({ reply, mode })
  } catch (error) {
    console.error("AI Teacher Error:", error.message)
    res.status(500).json({ error: "AI Teacher failed", message: error.message })
  }
}
