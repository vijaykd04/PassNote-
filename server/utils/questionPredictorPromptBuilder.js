export const buildQuestionPredictorPrompt = (pdfText) => {
  return `
You are a STRICT JSON generator for an exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only — parsed with JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings
- Do NOT use emojis inside string values

TASK:
Read the following past year question paper content and:
1. Identify recurring topics and question patterns
2. Analyze which topics are asked most frequently
3. Predict questions likely to appear in the NEXT exam
4. Calculate topic-wise weightage (must add up to 100)

PDF CONTENT:
"""
${pdfText}
"""

ANALYSIS RULES:
- "topTopics" — list the top 5 most frequently tested topics
- "patternInsights" — list 4-6 key observations about question patterns (e.g., "Topic X appears every year", "Long questions focus on Y")
- "predictedQuestions" — predict 8 to 10 questions for the next exam
  - "probability": "High", "Medium", or "Low"
  - "type": "short", "long", or "mcq"
  - "topic": which sub-topic this belongs to
  - "basis": brief reason why this is predicted (1 sentence)
- "topicWeightage" — topic-wise percentage breakdown (all values must sum to 100)
- "examName" — infer the subject/course name from the document

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

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown wrapper.
`;
};
