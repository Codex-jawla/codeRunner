import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, customPrompt } = body;

    console.log("Received request:", { 
      codeLength: code?.length, 
      language,
      customPromptLength: customPrompt?.length
    });

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (!customPrompt || !customPrompt.trim()) {
      return NextResponse.json(
        { error: 'Custom prompt/requirements are required' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for code generation/improvement
    const prompt = `You are an expert ${language || 'software'} developer and code architect. Your task is to analyze the existing code and generate an improved version based on the user's specific requirements.

EXISTING CODE:
\`\`\`${language || 'text'}
${code}
\`\`\`

USER'S REQUIREMENTS/MODIFICATIONS:
${body.customPrompt || 'Improve this code with best practices'}

INSTRUCTIONS:
1. Carefully analyze the existing code structure, functionality, and patterns
2. Understand exactly what the user wants to achieve or modify
3. Generate improved code that:
   - Maintains the original functionality unless explicitly asked to change it
   - Incorporates the user's specific requirements
   - Follows ${language || 'programming'} best practices
   - Includes proper error handling and edge cases
   - Has clean, readable, and maintainable structure
   - Includes relevant comments for complex logic

4. If the user's request involves adding new features, integrate them seamlessly with the existing code
5. If the user's request involves refactoring, maintain backward compatibility unless told otherwise

RESPONSE FORMAT:
Provide ONLY the complete, improved code without any explanations, markdown formatting, or additional text. The code should be production-ready and directly usable.

Generate the improved code now:`;

    console.log("Making Gemini API call...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt
    });

    console.log("Gemini API response received:", {
      responseContent: response.text?.substring(0, 500) + "..."
    });

    const generatedCode = response.text;
    
    if (!generatedCode) {
      throw new Error("No code generated from Gemini API");
    }

    // Clean up the response - remove any markdown formatting if present
    const cleanedCode = generatedCode
      .replace(/```[\w]*\n?/g, '') // Remove code block markers
      .trim();

    console.log("Generated code length:", cleanedCode.length);

    return NextResponse.json({
      generatedCode: cleanedCode,
      success: true,
      originalCodeLength: code.length,
      generatedCodeLength: cleanedCode.length
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return fallback code generation if Gemini fails
    return NextResponse.json({
      generatedCode: `// Error occurred while generating code
// Original code with basic improvements:

// TODO: Apply the following improvements based on your request:
// - || 'General improvements needed'}
// - Add proper error handling
// - Optimize performance
// - Improve code structure`,
      fallback: true,
      error: errorMessage
    });
  }
}