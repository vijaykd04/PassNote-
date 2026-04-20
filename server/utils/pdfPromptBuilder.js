/**
 * Builds a Gemini prompt from extracted PDF text.
 * Returns the same JSON schema as the topic-based notes generator
 * so FinalResult.jsx can render PDF results identically.
 */
export const buildPdfPrompt = (pdfText) => {
  return `
You are a STRICT JSON generator for an exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only
- Your response is parsed using JSON.parse() — invalid JSON = system failure
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings
- Do NOT use emojis inside string values

TASK:
Read the following PDF content and generate comprehensive, exam-focused study material.

PDF CONTENT:
"""
${pdfText}
"""

WHAT TO GENERATE:
1. Identify all key concepts, topics, and sub-topics
2. Rank sub-topics by exam importance into 3 tiers
3. Write detailed exam-oriented notes in Markdown format
4. Create quick one-line revision bullet points
5. Generate important exam questions based on the content

RULES:
- "notes" → detailed Markdown with ## headings and bullet points
- "revisionPoints" → at least 10 factual one-line bullets from the document
- "questions.short" → at least 5 short-answer questions (1-2 lines)
- "questions.long" → at least 4 long/essay questions
- "questions.diagram" → relevant diagram question or ""
- "importance" → overall exam relevance of the document
- "diagram.data" → always ""
- "charts" → always []
- All 3 star categories MUST be present in subTopics

STRICT JSON FORMAT — DO NOT CHANGE STRUCTURE:

{
  "subTopics": {
    "⭐": [],
    "⭐⭐": [],
    "⭐⭐⭐": []
  },
  "importance": "⭐⭐",
  "notes": "string",
  "revisionPoints": [],
  "questions": {
    "short": [],
    "long": [],
    "diagram": ""
  },
  "diagram": {
    "type": "",
    "data": ""
  },
  "charts": []
}

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown wrapper.
`;
};
