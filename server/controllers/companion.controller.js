const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.3-70b-versatile"

const buildPrompt = (companion, language) => {
  const personas = {
    blaze: `You are BLAZE — a fast-talking, sarcastic, hilariously witty male superhero companion. Think Iron Man meets a stand-up comedian.`,
    luna:  `You are LUNA — a powerful, funny, emotionally intelligent female superhero companion. Think Captain Marvel meets a best friend who always knows what to say.`,
  }
  return `${personas[companion] || personas.blaze}

You are in a LIVE VIDEO CALL with a student who might be stressed, anxious, depressed, or just needs a friend.

CRITICAL: Respond ONLY in ${language}. Every word must be in ${language}.

YOUR STYLE:
- Talk like a cool, funny elder sibling — NOT like a therapist
- Use humor, light sarcasm, and real wit (not forced jokes)
- Be genuinely warm and caring underneath the humor
- Keep every response SHORT — 2-4 sentences max (live call!)
- Use casual language: "Okay listen...", "Here's the thing...", "No no no wait..."
- Add ONE funny quip, joke, or sarcastic remark per response when appropriate
- You believe in this student MORE than they believe in themselves
- NEVER lecture, preach, or use therapy-speak
- If they share sadness, first acknowledge it genuinely, THEN lift them up
- End with something encouraging OR a light-hearted one-liner
- Occasionally reference your superhero powers in a funny way
- React to success with over-the-top celebration

FORBIDDEN:
- Generic advice like "believe in yourself" without a twist
- Long paragraphs
- Being too serious for more than 1 sentence
- Sounding like a robot or a textbook`
}

export const companionChat = async (req, res) => {
  try {
    const { message, companion = 'blaze', history = [], language = 'English' } = req.body

    if (!message) return res.status(400).json({ message: "Message is required" })

    const systemPrompt = buildPrompt(companion, language)
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-12),
      { role: "user", content: message }
    ]

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.85, max_tokens: 200 }),
    })

    if (!response.ok) throw new Error(await response.text())
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error("No reply from companion")

    return res.status(200).json({ reply })
  } catch (error) {
    console.error("Companion error:", error.message)
    res.status(500).json({ error: "Companion failed", message: error.message })
  }
}
