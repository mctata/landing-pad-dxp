'use client';

import { useState, useEffect } from 'react';
import { aiService } from '@/lib/ai-service';
import { toast } from 'react-toastify';

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface FontPairing {
  heading: string;
  body: string;
}

interface AIStyleSuggestionProps {
  websiteType: string;
  currentColors: ColorScheme;
  currentFonts: FontPairing;
  onApplyColorScheme: (colors: ColorScheme) => void;
  onApplyFontPairing: (fonts: FontPairing) => void;
}

export function AIStyleSuggestion({
  websiteType,
  currentColors,
  currentFonts,
  onApplyColorScheme,
  onApplyFontPairing,
}: AIStyleSuggestionProps) {
  const [isGeneratingColors, setIsGeneratingColors] = useState(false);
  const [isGeneratingFonts, setIsGeneratingFonts] = useState(false);
  const [colorSuggestions, setColorSuggestions] = useState<ColorScheme[]>([]);
  const [fontSuggestions, setFontSuggestions] = useState<FontPairing[]>([]);
  const [industry, setIndustry] = useState<string>('');
  const [mood, setMood] = useState<string>('');

  // Generate color scheme suggestions
  const handleGenerateColorSchemes = async () => {
    setIsGeneratingColors(true);
    
    try {
      // This would call the backend API in production
      // const response = await apiHelpers.post('/ai/color-schemes', {
      //   industry,
      //   mood,
      //   baseColor: currentColors.primary
      // });
      
      // Mock response for development
      const mockResponse = {
        schemes: [
          {
            primary: '#3366FF',
            secondary: '#66A3FF',
            accent: '#FF5C5C',
            background: '#FFFFFF',
            text: '#333333',
          },
          {
            primary: '#4CAF50',
            secondary: '#8BC34A',
            accent: '#FF9800',
            background: '#F5F5F5',
            text: '#212121',
          },
          {
            primary: '#9C27B0',
            secondary: '#CE93D8',
            accent: '#FFEB3B',
            background: '#FFFFFF',
            text: '#3A3A3A',
          },
        ]
      };
      
      setColorSuggestions(mockResponse.schemes);
      
    } catch (error) {
      console.error('Error generating color schemes:', error);
      toast.error('Failed to generate color schemes');
    } finally {
      setIsGeneratingColors(false);
    }
  };

  // Generate font pairing suggestions
  const handleGenerateFontPairings = async () => {
    setIsGeneratingFonts(true);
    
    try {
      // This would call the backend API in production
      // const response = await apiHelpers.post('/ai/font-pairings', {
      //   industry,
      //   style: mood
      // });
      
      // Mock response for development
      const mockResponse = {
        pairings: [
          { heading: 'Playfair Display', body: 'Source Sans Pro' },
          { heading: 'Montserrat', body: 'Open Sans' },
          { heading: 'Roboto Slab', body: 'Roboto' },
        ]
      };
      
      setFontSuggestions(mockResponse.pairings);
      
    } catch (error) {
      console.error('Error generating font pairings:', error);
      toast.error('Failed to generate font pairings');
    } finally {
      setIsGeneratingFonts(false);
    }
  };

  // Apply selected color scheme
  const handleApplyColorScheme = (scheme: ColorScheme) => {
    onApplyColorScheme(scheme);
    toast.success('Color scheme applied');
  };

  // Apply selected font pairing
  const handleApplyFontPairing = (pairing: FontPairing) => {
    onApplyFontPairing(pairing);
    toast.success('Font pairing applied');
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-secondary-900 mb-4">AI Style Suggestions</h3>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Website Industry
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select an industry</option>
            <option value="technology">Technology</option>
            <option value="ecommerce">E-commerce</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="finance">Finance</option>
            <option value="creative">Creative</option>
            <option value="hospitality">Hospitality</option>
            <option value="real-estate">Real Estate</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Desired Mood
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a mood</option>
            <option value="professional">Professional</option>
            <option value="modern">Modern</option>
            <option value="creative">Creative</option>
            <option value="minimalist">Minimalist</option>
            <option value="bold">Bold</option>
            <option value="elegant">Elegant</option>
            <option value="playful">Playful</option>
            <option value="trustworthy">Trustworthy</option>
          </select>
        </div>
      </div>
      
      {/* Color Schemes */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-secondary-900">Color Schemes</h4>
          <button
            onClick={handleGenerateColorSchemes}
            disabled={isGeneratingColors || !industry || !mood}
            className="px-3 py-1 text-sm font-medium bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingColors ? 'Generating...' : 'Generate'}
          </button>
        </div>
        
        {colorSuggestions.length > 0 ? (
          <div className="space-y-4">
            {colorSuggestions.map((scheme, index) => (
              <div
                key={index}
                className="border border-secondary-200 rounded-md p-3 hover:bg-secondary-50 cursor-pointer"
                onClick={() => handleApplyColorScheme(scheme)}
              >
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: scheme.primary }}
                    title="Primary"
                  />
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: scheme.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: scheme.accent }}
                    title="Accent"
                  />
                  <div
                    className="h-8 rounded border border-secondary-200"
                    style={{ backgroundColor: scheme.background }}
                    title="Background"
                  />
                  <div
                    className="h-8 rounded"
                    style={{ backgroundColor: scheme.text }}
                    title="Text"
                  />
                </div>
                <div className="text-right">
                  <button
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyColorScheme(scheme);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary-50 rounded-md border border-dashed border-secondary-300">
            <p className="text-sm text-secondary-600">
              {isGeneratingColors
                ? 'Generating color schemes...'
                : 'Select an industry and mood to generate color schemes'}
            </p>
          </div>
        )}
      </div>
      
      {/* Font Pairings */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-secondary-900">Font Pairings</h4>
          <button
            onClick={handleGenerateFontPairings}
            disabled={isGeneratingFonts || !industry || !mood}
            className="px-3 py-1 text-sm font-medium bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingFonts ? 'Generating...' : 'Generate'}
          </button>
        </div>
        
        {fontSuggestions.length > 0 ? (
          <div className="space-y-4">
            {fontSuggestions.map((pairing, index) => (
              <div
                key={index}
                className="border border-secondary-200 rounded-md p-3 hover:bg-secondary-50 cursor-pointer"
                onClick={() => handleApplyFontPairing(pairing)}
              >
                <div className="mb-2">
                  <p
                    className="text-lg mb-1"
                    style={{ fontFamily: pairing.heading }}
                  >
                    {pairing.heading}
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: pairing.body }}
                  >
                    {pairing.body}
                  </p>
                </div>
                <div className="text-right">
                  <button
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyFontPairing(pairing);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary-50 rounded-md border border-dashed border-secondary-300">
            <p className="text-sm text-secondary-600">
              {isGeneratingFonts
                ? 'Generating font pairings...'
                : 'Select an industry and mood to generate font pairings'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
