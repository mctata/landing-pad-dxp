'use client';

import React, { useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isPrimary?: boolean;
  ctaText: string;
}

interface PricingContent {
  headline?: string;
  subheadline?: string;
  plans: PricingPlan[];
  alignment?: 'left' | 'center' | 'right';
}

interface WebsiteSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  globalStyles?: {
    borderRadius?: string;
    buttonStyle?: string;
  };
}

interface PricingElementProps {
  content: PricingContent;
  settings: WebsiteSettings;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PricingContent>) => void;
  onUpdatePlan?: (planId: string, updates: Partial<PricingPlan>) => void;
}

export function PricingElement({ 
  content, 
  settings, 
  isEditing = false, 
  onUpdate,
  onUpdatePlan 
}: PricingElementProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Get alignment class
  const getAlignmentClass = () => {
    switch (content.alignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-center';
    }
  };
  
  // Handle headline changes
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ headline: e.target.value });
    }
  };
  
  // Handle subheadline changes
  const handleSubheadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpdate) {
      onUpdate({ subheadline: e.target.value });
    }
  };
  
  // Handle plan updates
  const handlePlanChange = (planId: string, field: string, value: any) => {
    if (onUpdatePlan) {
      onUpdatePlan(planId, { [field]: value });
    }
  };
  
  // Handle feature update
  const handleFeatureChange = (planId: string, index: number, value: string) => {
    if (onUpdatePlan) {
      const plan = content.plans.find(p => p.id === planId);
      if (plan) {
        const updatedFeatures = [...plan.features];
        updatedFeatures[index] = value;
        onUpdatePlan(planId, { features: updatedFeatures });
      }
    }
  };
  
  // Determine border radius from settings
  const borderRadius = settings.globalStyles?.borderRadius || '0.5rem';
  
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: settings.colors.background }}>
      <div className={`max-w-7xl mx-auto ${getAlignmentClass()}`}>
        {/* Headline */}
        {isEditing && editingField === 'headline' ? (
          <input
            type="text"
            value={content.headline || ''}
            onChange={handleHeadlineChange}
            onBlur={() => setEditingField(null)}
            className="w-full text-3xl font-bold text-center bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 mb-4"
            style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
            autoFocus
          />
        ) : (
          <h2 
            className="text-3xl font-bold mb-4" 
            onClick={isEditing ? () => setEditingField('headline') : undefined}
            style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
          >
            {content.headline || 'Our Pricing Plans'}
          </h2>
        )}
        
        {/* Subheadline */}
        {isEditing && editingField === 'subheadline' ? (
          <input
            type="text"
            value={content.subheadline || ''}
            onChange={handleSubheadlineChange}
            onBlur={() => setEditingField(null)}
            className="w-full text-xl text-center bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 mb-12"
            style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
            autoFocus
          />
        ) : (
          <p 
            className="text-xl mb-12" 
            onClick={isEditing ? () => setEditingField('subheadline') : undefined}
            style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
          >
            {content.subheadline || 'Choose the plan that works best for your needs'}
          </p>
        )}
        
        {/* Pricing Plans */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {content.plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-lg shadow-md border ${
                plan.isPrimary 
                  ? 'border-primary-500 ring-2 ring-primary-500' 
                  : 'border-secondary-200'
              }`}
              style={{ borderRadius }}
            >
              {/* Popular Badge */}
              {plan.isPrimary && (
                <div 
                  className="absolute -top-4 inset-x-0"
                  onClick={isEditing ? () => handlePlanChange(plan.id, 'isPrimary', !plan.isPrimary) : undefined}
                >
                  <span 
                    className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase"
                    style={{ 
                      backgroundColor: settings.colors.primary,
                      color: '#ffffff',
                      fontFamily: settings.fonts.body,
                    }}
                  >
                    Most Popular
                  </span>
                </div>
              )}
              
              {/* Plan Name */}
              {isEditing && editingPlanId === plan.id && editingField === 'name' ? (
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => handlePlanChange(plan.id, 'name', e.target.value)}
                  onBlur={() => {
                    setEditingPlanId(null);
                    setEditingField(null);
                  }}
                  className="text-xl font-bold bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 mb-2"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                  autoFocus
                />
              ) : (
                <h3 
                  className="text-xl font-bold mb-2" 
                  onClick={isEditing ? () => {
                    setEditingPlanId(plan.id);
                    setEditingField('name');
                  } : undefined}
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                >
                  {plan.name}
                </h3>
              )}
              
              {/* Plan Price */}
              {isEditing && editingPlanId === plan.id && editingField === 'price' ? (
                <input
                  type="text"
                  value={plan.price}
                  onChange={(e) => handlePlanChange(plan.id, 'price', e.target.value)}
                  onBlur={() => {
                    setEditingPlanId(null);
                    setEditingField(null);
                  }}
                  className="text-3xl font-bold bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 mb-4"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                  autoFocus
                />
              ) : (
                <p 
                  className="text-3xl font-bold mb-4" 
                  onClick={isEditing ? () => {
                    setEditingPlanId(plan.id);
                    setEditingField('price');
                  } : undefined}
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.heading }}
                >
                  {plan.price}
                </p>
              )}
              
              {/* Plan Description */}
              {isEditing && editingPlanId === plan.id && editingField === 'description' ? (
                <input
                  type="text"
                  value={plan.description}
                  onChange={(e) => handlePlanChange(plan.id, 'description', e.target.value)}
                  onBlur={() => {
                    setEditingPlanId(null);
                    setEditingField(null);
                  }}
                  className="mb-6 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                  autoFocus
                />
              ) : (
                <p 
                  className="mb-6" 
                  onClick={isEditing ? () => {
                    setEditingPlanId(plan.id);
                    setEditingField('description');
                  } : undefined}
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                >
                  {plan.description}
                </p>
              )}
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg 
                      className="h-5 w-5 mt-0.5 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      style={{ color: settings.colors.primary }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    
                    {isEditing && editingPlanId === plan.id && editingField === `feature-${index}` ? (
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(plan.id, index, e.target.value)}
                        onBlur={() => {
                          setEditingPlanId(null);
                          setEditingField(null);
                        }}
                        className="ml-3 bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500 w-full"
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="ml-3 text-base"
                        onClick={isEditing ? () => {
                          setEditingPlanId(plan.id);
                          setEditingField(`feature-${index}`);
                        } : undefined}
                        style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                      >
                        {feature}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              
              {/* Call to Action Button */}
              {isEditing && editingPlanId === plan.id && editingField === 'ctaText' ? (
                <input
                  type="text"
                  value={plan.ctaText}
                  onChange={(e) => handlePlanChange(plan.id, 'ctaText', e.target.value)}
                  onBlur={() => {
                    setEditingPlanId(null);
                    setEditingField(null);
                  }}
                  className="w-full bg-transparent border border-secondary-300 px-2 py-1 focus:outline-none focus:border-primary-500"
                  style={{ color: settings.colors.text, fontFamily: settings.fonts.body }}
                  autoFocus
                />
              ) : (
                <button 
                  className={`mt-auto w-full px-4 py-2 font-medium rounded-md ${
                    plan.isPrimary 
                      ? 'text-white' 
                      : 'text-primary-700 bg-primary-50 hover:bg-primary-100'
                  }`}
                  style={plan.isPrimary ? { 
                    backgroundColor: settings.colors.primary,
                    color: '#ffffff',
                    fontFamily: settings.fonts.body,
                    borderRadius
                  } : {
                    backgroundColor: `${settings.colors.primary}10`,
                    color: settings.colors.primary,
                    fontFamily: settings.fonts.body,
                    borderRadius
                  }}
                  onClick={isEditing ? () => {
                    setEditingPlanId(plan.id);
                    setEditingField('ctaText');
                  } : undefined}
                >
                  {plan.ctaText}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}