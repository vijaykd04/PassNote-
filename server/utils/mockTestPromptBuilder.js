export const buildMockTestPrompt = (pdfText) => {
  return `
You are a STRICT JSON generator for an exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only — parsed with JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings
- Do NOT use emojis inside string values

TASK:
Read the following PDF content and generate a mock test with exactly 10 multiple-choice questions (MCQs) covering the key topics in the document.

PDF CONTENT:
"""
${pdfText}
"""

MCQ RULES:
- Questions must be based ONLY on the PDF content above
- Each question must have exactly 4 options: A, B, C, D
- Only ONE option is correct
- Provide a short explanation for the correct answer
- Cover diverse topics from across the document
- Mix difficulty: 3 easy, 5 medium, 2 hard
- "topic" is a short label for the sub-topic the question tests

STRICT JSON FORMAT — DO NOT CHANGE:

{
  "subject": "string",
  "totalQuestions": 10,
  "difficulty": "mixed",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "correctAnswer": "A",
      "explanation": "string",
      "topic": "string"
    }
  ]
}

- "subject" should be the inferred subject/topic name of the document
- "questions" array MUST have exactly 10 items
- "correctAnswer" MUST be one of: "A", "B", "C", "D"

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown wrapper.
`;
};
