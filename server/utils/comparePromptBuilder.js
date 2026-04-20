export const buildComparePrompt = (papersContent) => {
  const sections = papersContent.map((p, i) =>
    `--- PAPER ${i + 1}: ${p.label} ---\n${p.content}\n`
  ).join('\n')

  return `
You are a STRICT JSON generator for an exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only — parsed with JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings

TASK:
You have been given ${papersContent.length} past year question papers. Analyze ALL of them together.
Compare which topics appear REPEATEDLY across multiple years, identify trends, and predict the most likely questions for the NEXT exam.

PAPERS:
${sections}

ANALYSIS RULES:
- "yearlyBreakdown": for each paper, list the 3-4 dominant topics
- "recurringTopics": topics that appear in 2 or more papers — MOST IMPORTANT for prediction
- "trendAnalysis": 4-6 observations about how the exam has evolved (difficulty, topic shifts, question types)
- "patternInsights": 4-6 key patterns found across papers
- "predictedQuestions": 10 predicted questions based on cross-year patterns
  - "probability": "High" (appeared in 3+ papers), "Medium" (2 papers), "Low" (1 paper trend)
  - "appearedInYears": list of paper labels where this topic appeared
- "topicWeightage": combined topic % across all papers (sum to 100)
- "hotTopics": top 3 topics most likely to appear, with reason

STRICT JSON FORMAT:
{
  "examName": "string",
  "papersAnalyzed": ${papersContent.length},
  "yearlyBreakdown": [
    {
      "paper": "string",
      "dominantTopics": ["string"]
    }
  ],
  "recurringTopics": ["string"],
  "trendAnalysis": ["string"],
  "patternInsights": ["string"],
  "hotTopics": [
    { "topic": "string", "reason": "string", "years": ["string"] }
  ],
  "predictedQuestions": [
    {
      "question": "string",
      "probability": "High",
      "type": "long",
      "topic": "string",
      "appearedInYears": ["string"],
      "basis": "string"
    }
  ],
  "topicWeightage": [
    { "topic": "string", "percentage": 25 }
  ]
}

- "predictedQuestions" must have exactly 10 items
- "topicWeightage" must sum to 100
- "probability" must be exactly "High", "Medium", or "Low"

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown.
`
}

export const buildCompareImagePrompt = (count) => `
You are a STRICT JSON generator for an exam preparation system.

CRITICAL RULES:
- Output MUST be valid JSON only — parsed with JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas, NO markdown code blocks
- Escape newlines as \\n inside strings

TASK:
You have been given ${count} images of past year question papers. Read ALL of them.
Compare all papers together. Identify recurring topics across all years and predict future questions.

STRICT JSON FORMAT:
{
  "examName": "string",
  "papersAnalyzed": ${count},
  "yearlyBreakdown": [
    {
      "paper": "Paper 1",
      "dominantTopics": ["string"]
    }
  ],
  "recurringTopics": ["string"],
  "trendAnalysis": ["string"],
  "patternInsights": ["string"],
  "hotTopics": [
    { "topic": "string", "reason": "string", "years": ["string"] }
  ],
  "predictedQuestions": [
    {
      "question": "string",
      "probability": "High",
      "type": "long",
      "topic": "string",
      "appearedInYears": ["string"],
      "basis": "string"
    }
  ],
  "topicWeightage": [
    { "topic": "string", "percentage": 25 }
  ]
}

- "predictedQuestions" must have exactly 10 items
- "topicWeightage" must sum to 100
- "probability" must be "High", "Medium", or "Low"

RETURN ONLY THE JSON OBJECT. NO explanation. NO markdown.
`
