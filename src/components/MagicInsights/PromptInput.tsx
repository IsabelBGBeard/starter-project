import React, { useState } from 'react';
import type { UserPrompt, Insight } from '../../types';

interface PromptInputProps {
  onSubmit: (prompt: UserPrompt) => void;
  isProcessing?: boolean;
  insightsGenerated?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isProcessing = false, insightsGenerated = false }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const userPrompt: UserPrompt = {
      text: prompt.trim(),
      type: prompt.toLowerCase().includes('?') ? 'specific' : 'open-ended'
    };

    onSubmit(userPrompt);
    setPrompt('');
  };

  const suggestedPrompts = [
    "What insights can you share?",
    "Show me the trends",
    "Which performs best?",
    "What are the key patterns?",
    "Summarize my data"
  ];

  const handleSuggestedPrompt = (suggestedPrompt: string) => {
    setPrompt(suggestedPrompt);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What would you like to know?"
          disabled={isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isProcessing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            'Analyze'
          )}
        </button>
      </form>

      {/* Suggested Prompts - Hide when processing or when insights are generated */}
      {!isProcessing && !insightsGenerated && (
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-2">💡 Suggested Questions</h3>
          <div className="space-y-1">
            {suggestedPrompts.map((suggestedPrompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(suggestedPrompt)}
                disabled={isProcessing}
                className="w-full text-left px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {suggestedPrompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 