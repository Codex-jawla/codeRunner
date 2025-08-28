'use client';
import { Copy, Sparkles, Lightbulb, Code, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AISuggestionsProps {
  output?: any;
  code?: string;
  language?: string;
  onCodeGenerated?: (generatedCode: string) => void; // Callback to update the main code editor
}

export default function AISuggestions({ output, code, language, onCodeGenerated }: AISuggestionsProps) {
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Function to generate improved code
  const generateImprovedCode = async () => {
    if (!code?.trim()) {
      setError("Please write some code first!");
      return;
    }
    
    if (!customPrompt?.trim()) {
      setError("Please describe what improvements or changes you want!");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedCode("");
    
    try {
      console.log("Sending request with:", { 
        codeLength: code.length, 
        language, 
        customPrompt: customPrompt.substring(0, 100) + "..." 
      });
      
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, customPrompt }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
        if (data.fallback) {
          setError("Using fallback code generation - AI service may be unavailable");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      setError(error instanceof Error ? error.message : "Failed to generate improved code");
    } finally {
      setLoading(false);
    }
  };

  const applyGeneratedCode = () => {
    if (generatedCode && onCodeGenerated) {
      onCodeGenerated(generatedCode);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="flex items-center space-x-2 ml-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-lg">AI Code Generator</h2>
          </div>
        </div>
        {generatedCode && (
          <button 
            onClick={() => copyToClipboard(generatedCode)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Copy generated code"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Custom Prompt Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Describe what you want to improve or add:
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Add error handling, optimize performance, add new feature, refactor to use async/await..."
            className="w-full h-20 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Generate Code Button */}
        <button
          onClick={generateImprovedCode}
          disabled={loading || !code?.trim() || !customPrompt?.trim()}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 mb-4 ${
            loading || !code?.trim() || !customPrompt?.trim()
              ? "bg-gray-600 cursor-not-allowed" 
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transform hover:scale-105"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Code className="w-4 h-4" />
              <span>Generate Improved Code</span>
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Generated Code Display */}
        {generatedCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Code className="w-4 h-4 text-green-400" />
                <span>Generated Code:</span>
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={applyGeneratedCode}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  Apply Code
                </button>
                <button 
                  onClick={() => copyToClipboard(generatedCode)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-3 max-h-96 overflow-auto">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono">
                {generatedCode}
              </pre>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Quick Actions:</h3>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setCustomPrompt("Add comprehensive error handling with try-catch blocks")}
              className="text-left p-2 hover:bg-gray-700/30 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <span>🛡️</span>
              <span>Add Error Handling</span>
            </button>
            <button 
              onClick={() => setCustomPrompt("Optimize this code for better performance and efficiency")}
              className="text-left p-2 hover:bg-gray-700/30 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <span>⚡</span>
              <span>Optimize Performance</span>
            </button>
            <button 
              onClick={() => setCustomPrompt("Refactor this code to use modern JavaScript/TypeScript features and best practices")}
              className="text-left p-2 hover:bg-gray-700/30 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <span>🔧</span>
              <span>Modernize Code</span>
            </button>
            <button 
              onClick={() => setCustomPrompt("Add detailed comments and documentation to explain the code logic")}
              className="text-left p-2 hover:bg-gray-700/30 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Add Documentation</span>
            </button>
          </div>
        </div>
      </div>
    </div>   
  );
}