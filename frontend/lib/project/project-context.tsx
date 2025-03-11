'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { projectAPI } from '../api';

interface Project {
  id: string;
  name: string;
  description?: string;
  template: string;
  published: boolean;
  publishedUrl?: string;
  customDomain?: string;
  content: any;
  styles: any;
  settings: any;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: { name: string; description?: string; templateId: string }) => Promise<Project>;
  updateProject: (id: string, data: any) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  publishProject: (id: string, customDomain?: string) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all projects
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data.projects);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a project by ID
  const fetchProjectById = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await projectAPI.getProjectById(id);
      setCurrentProject(response.data.project);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new project
  const createProject = async (data: { name: string; description?: string; templateId: string }) => {
    setIsLoading(true);
    try {
      const response = await projectAPI.createProject(data);
      const newProject = response.data.project;
      
      // Update projects list
      setProjects((prevProjects) => [...prevProjects, newProject]);
      
      toast.success('Project created successfully');
      return newProject;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a project
  const updateProject = async (id: string, data: any) => {
    setIsLoading(true);
    try {
      const response = await projectAPI.updateProject(id, data);
      const updatedProject = response.data.project;
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject.id === id) {
        setCurrentProject(updatedProject);
      }
      
      // Update projects list
      setProjects((prevProjects) =>
        prevProjects.map((project) => (project.id === id ? updatedProject : project))
      );
      
      toast.success('Project updated successfully');
      return updatedProject;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      await projectAPI.deleteProject(id);
      
      // Remove from projects list
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id));
      
      // Clear current project if it's the one being deleted
      if (currentProject && currentProject.id === id) {
        setCurrentProject(null);
      }
      
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Publish a project
  const publishProject = async (id: string, customDomain?: string) => {
    setIsLoading(true);
    try {
      const response = await projectAPI.publishProject(id, customDomain);
      const publishedProject = response.data.project;
      
      // Update current project if it's the one being published
      if (currentProject && currentProject.id === id) {
        setCurrentProject(publishedProject);
      }
      
      // Update projects list
      setProjects((prevProjects) =>
        prevProjects.map((project) => (project.id === id ? publishedProject : project))
      );
      
      toast.success('Project published successfully');
      return publishedProject;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish project');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    projects,
    currentProject,
    isLoading,
    fetchProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    publishProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
