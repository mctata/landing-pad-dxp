'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AIProvider } from '@/lib/ai/ai-context';
import { 
  AIAssistButton, 
  AIEnhanceToolbar, 
  AISuggestionPanel, 
  AIContentEditor 
} from '@/components/ai';

/**
 * Demo page for showcasing AI content generation and editing functionality
 */
export default function AIEditorExamplePage() {
  const [currentContent, setCurrentContent] = useState<string>('Welcome to our website. We offer a range of services to help your business grow.');
  const [isEditing, setIsEditing] = useState(false);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  
  // Demo website and page IDs (in a real app these would be based on actual data)
  const websiteId = 'demo-website';
  const pageId = 'demo-page';

  const handleContentGenerated = (content: any) => {
    // Handle different types of content from AI
    if (content.heading && content.subheading) {
      setCurrentContent(`# ${content.heading}\n\n## ${content.subheading}\n\n${content.body || ''}`);
    } else if (content.headline) {
      setCurrentContent(`# ${content.headline}\n\n## ${content.subheadline}\n\n${content.ctaText ? `Call to action: ${content.ctaText}` : ''}`);
    } else {
      setCurrentContent(content.body || content.content || JSON.stringify(content));
    }
  };

  const handleContentSave = (editedContent: string) => {
    setCurrentContent(editedContent);
    setIsEditing(false);
  };
  
  const handleContentCancel = () => {
    setIsEditing(false);
  };
  
  const handleApplySuggestion = (suggestionContent: any) => {
    // Apply suggestion to current content
    handleContentGenerated(suggestionContent);
    setIsSuggestionPanelOpen(false);
  };

  return (
    <AIProvider>
      <div className="container mx-auto py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">AI-Powered Content Editor</h1>
          
          <div className="flex gap-2">
            <AIAssistButton 
              elementType="text" 
              onContentGenerated={handleContentGenerated}
              variant="primary"
              size="default"
            />
            
            <Button
              variant="outline"
              onClick={() => setIsSuggestionPanelOpen(!isSuggestionPanelOpen)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                />
              </svg>
              AI Suggestions
            </Button>
          </div>
        </div>
        
        <div className="flex">
          <div className={`flex-1 transition-all duration-300 ${isSuggestionPanelOpen ? 'mr-96' : ''}`}>
            <div className="bg-white border border-secondary-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Content</h2>
                
                <div className="flex gap-2">
                  {!isEditing && (
                    <AIEnhanceToolbar 
                      content={currentContent}
                      onUpdate={setCurrentContent}
                      className="mr-2"
                    />
                  )}
                  
                  {!isEditing ? (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </div>
              </div>
              
              {isEditing ? (
                <AIContentEditor 
                  content={currentContent}
                  onSave={handleContentSave}
                  onCancel={handleContentCancel}
                />
              ) : (
                <div className="prose max-w-none">
                  {currentContent.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line.startsWith('# ') ? (
                        <h1 className="text-2xl font-bold my-2">{line.substring(2)}</h1>
                      ) : line.startsWith('## ') ? (
                        <h2 className="text-xl font-semibold my-2">{line.substring(3)}</h2>
                      ) : (
                        <p className="my-2">{line}</p>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-8 flex gap-4">
              <div className="flex-1 border border-secondary-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Heading Generator</h3>
                <p className="text-sm text-secondary-600 mb-3">Generate a compelling headline for your page.</p>
                <AIAssistButton 
                  elementType="heading" 
                  onContentGenerated={content => {
                    if (content.heading) {
                      setCurrentContent(currentContent.replace(/^# .*$/m, `# ${content.heading}`));
                    }
                  }}
                  variant="secondary"
                />
              </div>
              
              <div className="flex-1 border border-secondary-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">CTA Generator</h3>
                <p className="text-sm text-secondary-600 mb-3">Generate a call-to-action that converts.</p>
                <AIAssistButton 
                  elementType="cta" 
                  onContentGenerated={content => {
                    setCurrentContent(currentContent + '\n\n' + (content.ctaText || content.content));
                  }}
                  variant="secondary"
                />
              </div>
              
              <div className="flex-1 border border-secondary-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Full Page Structure</h3>
                <p className="text-sm text-secondary-600 mb-3">Generate a complete page layout and content.</p>
                <AIAssistButton 
                  elementType="page" 
                  onContentGenerated={handleContentGenerated}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
          
          {isSuggestionPanelOpen && (
            <div className="fixed right-0 top-0 h-screen">
              <AISuggestionPanel 
                isOpen={isSuggestionPanelOpen} 
                onClose={() => setIsSuggestionPanelOpen(false)}
                websiteId={websiteId}
                pageId={pageId}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          )}
        </div>
      </div>
    </AIProvider>
  );
}
