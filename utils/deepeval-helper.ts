import { expect } from '@playwright/test';

/**
 * Evaluates the agent's streamed response against the input question/prompt.
 * If OPENAI_API_KEY is present in the environment, it uses DeepEval's AnswerRelevancyMetric.
 * If the key is missing or deepeval fails to load, it falls back to robust structural assertions.
 */
/**
 * Helper to call Gemini or OpenAI directly to compute metric scores.
 */
async function evaluateAnswerRelevancyWithLLM(
  apiKey: string,
  question: string,
  actualOutput: string
): Promise<{ score: number; reasoning: string }> {
  const prompt = `
You are an expert evaluator assessing the relevancy of an agent's answer to a user's question.
Please evaluate the actual output against the input question.

Input Question: "${question}"
Actual Output: "${actualOutput}"

Your task:
1. Rate the relevancy of the output to the input on a scale from 0.0 (completely irrelevant) to 1.0 (perfectly relevant and directly answers the question).
2. Provide a concise explanation for the rating.

You MUST respond with a single JSON object in the following format (no markdown formatting, no code block backticks):
{
  "score": <float between 0.0 and 1.0>,
  "reasoning": "<explanation>"
}
  `.trim();

  const isGemini = apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy');

  if (isGemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`Failed to get content from Gemini response: ${JSON.stringify(data)}`);
    }

    return JSON.parse(text);
  } else {
    // OpenAI API
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`Failed to get content from OpenAI response: ${JSON.stringify(data)}`);
    }

    return JSON.parse(text);
  }
}

export async function assertAgentResponseQuality(
  question: string,
  actualOutput: string
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn(
      '⚠️  [DeepEval] OPENAI_API_KEY is not defined in the environment. ' +
      'Skipping LLM evaluation and falling back to structural assertions.'
    );
    runStructuralAssertions(actualOutput);
    return;
  }

  // 1. Run local LLM evaluation first (using either Gemini or OpenAI API keys)
  let localLlmPassed = false;
  let score: number | undefined;
  let reasoning: string | undefined;

  try {
    console.log(`🚀 [DeepEval] Running local LLM-based AnswerRelevancy evaluation...`);
    const result = await evaluateAnswerRelevancyWithLLM(apiKey, question, actualOutput);
    score = result.score;
    reasoning = result.reasoning;
    console.log(`✅ [DeepEval] Local LLM Relevancy Score: ${score}`);
    console.log(`📝 [DeepEval] Reasoning: ${reasoning}`);
    localLlmPassed = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  [DeepEval] Local LLM evaluation API request failed:', errorMessage);
  }

  // Assert relevancy score (outside of try-catch, so low scores correctly fail the test)
  if (localLlmPassed && score !== undefined) {
    expect(score).toBeGreaterThanOrEqual(0.7);
  }

  // 2. Push to Confident AI if apiKey is present and package is installed
  try {
    const { LLMTestCase, evaluate } = require('deepeval');
    
    const testCase = new LLMTestCase({
      input: question,
      actualOutput: actualOutput,
    });
    
    await evaluate({
      metricCollection: 'Pre-Login Chat Relevancy',
      llmTestCases: [testCase]
    });
  } catch (error) {
    // Suppressed Confident AI upload warnings per user request
  }

  // 3. Fallback to structural assertions if local LLM evaluation could not run
  if (!localLlmPassed) {
    console.log('🔄 Falling back to structural assertions...');
    runStructuralAssertions(actualOutput);
  } else {
    runStructuralAssertions(actualOutput);
  }
}

/**
 * Local fallback assertions verifying the output's structure, size, and validity.
 */
function runStructuralAssertions(text: string): void {
  // 1. Length validation (must be longer than a placeholder or error note)
  expect(text.length).toBeGreaterThan(50);
  
  // 2. Negative assertions checking for common API/server failures
  const errorPatterns = [
    'internal server error',
    'failed to fetch',
    'unable to process',
    'quota exceeded',
    'rate limit',
    'something went wrong'
  ];
  
  const textLower = text.toLowerCase();
  for (const pattern of errorPatterns) {
    expect(textLower).not.toContain(pattern);
  }
  
  console.log('✅ [Structural Assertions] Passed length and error-free criteria');
}
