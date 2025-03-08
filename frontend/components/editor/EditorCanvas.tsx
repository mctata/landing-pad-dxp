'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ElementRenderer } from './ElementRenderer';

interface ElementData {
  id: string;
  type: string;
  content: any;
  settings: any;
  position: number;
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
  globalStyles: {
    borderRadius: string;
    buttonStyle: string;
  };
}

interface EditorCanvasProps {
  elements: ElementData[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<ElementData>) => void;
  onDeleteElement: (elementId: string) => void;
  onReorderElements: (startIndex: number, endIndex: number) => void;
  settings: WebsiteSettings;
}

export function EditorCanvas({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onReorderElements,
  settings,
}: EditorCanvasProps) {
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  
  // Handle drag end for reordering elements
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;
    
    onReorderElements(startIndex, endIndex);
  };
  
  return (
    <div className="min-h-full bg-secondary-50 overflow-auto">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {elements.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-secondary-300 p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-secondary-900">Add elements to your page</h3>
            <p className="mt-2 text-secondary-600 text-sm">
              Click the Elements button in the toolbar to add content to your page.
            </p>
            <button
              type="button"
              className="mt-4 btn-primary"
              onClick={() => {}}
            >
              Add Element
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="elements">
              {(provided) => (
                <div
                  className="space-y-6"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {elements
                    .sort((a, b) => a.position - b.position)
                    .map((element, index) => (
                      <Draggable
                        key={element.id}
                        draggableId={element.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
                            onMouseEnter={() => setHoveredElementId(element.id)}
                            onMouseLeave={() => setHoveredElementId(null)}
                          >
                            {/* Element controls */}
                            <div 
                              className={`absolute top-2 right-2 flex items-center space-x-1 z-10 transition-opacity duration-200 ${
                                selectedElementId === element.id || hoveredElementId === element.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            >
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="h-8 w-8 flex items-center justify-center rounded bg-white shadow cursor-move hover:bg-secondary-50"
                                title="Drag to reorder"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              
                              {/* Edit button */}
                              <button
                                type="button"
                                className={`h-8 w-8 flex items-center justify-center rounded bg-white shadow hover:bg-secondary-50 ${
                                  selectedElementId === element.id ? 'text-primary-600' : 'text-secondary-600'
                                }`}
                                onClick={() => onSelectElement(element.id)}
                                title="Edit element"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              
                              {/* Delete button */}
                              <button
                                type="button"
                                className="h-8 w-8 flex items-center justify-center rounded bg-white shadow hover:bg-error-50 hover:text-error-600 text-secondary-600"
                                onClick={() => onDeleteElement(element.id)}
                                title="Delete element"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Element content with border when selected or hovered */}
                            <div
                              className={`transition-all duration-150 ${
                                selectedElementId === element.id
                                  ? 'ring-2 ring-primary-500'
                                  : hoveredElementId === element.id
                                  ? 'ring-2 ring-primary-300 ring-opacity-50'
                                  : ''
                              }`}
                              onClick={() => onSelectElement(element.id)}
                            >
                              <ElementRenderer
                                element={element}
                                settings={settings}
                                isEditing={true}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}