/**
 * Hooks for project management
 * Handles projects, collaborators, content management, and insights
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PROJECT_STATUS,
  PROJECT_ROLE,
  PROJECT_ROLE_NAMES,
  type Project,
  type ProjectCollaborator,
  type ProjectPoll,
  type ProjectQuestionnaire,
  type ProjectInsight,
  type Questionnaire,
} from "@shared/schema";

// ============================================
// Types
// ============================================

export interface ProjectWithContent extends Project {
  polls: ProjectPoll[];
  questionnaires: Questionnaire[];
  collaborators: ProjectCollaborator[];
  userRole: number | null;
}

export interface ProjectWithRole extends Project {
  userRole: number;
}

export interface ProjectAnalytics {
  totalPolls: number;
  totalQuestionnaires: number;
  totalVotes: number;
  totalCompletions: number;
  lastUpdated: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  ownerAddress: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  address: string;
}

export interface AddPollsInput {
  projectId: string;
  pollIds: number[];
  address: string;
  cachedTitles?: string[];
}

export interface AddQuestionnairesInput {
  projectId: string;
  questionnaireIds: string[];
  address: string;
}

export interface InviteCollaboratorInput {
  projectId: string;
  walletAddress: string;
  role: number;
  inviterAddress: string;
}

export interface GenerateInsightInput {
  projectId: string;
  insightType: "summary" | "trends" | "recommendations";
  address: string;
}

// ============================================
// Helper Functions
// ============================================

export function getProjectRoleLabel(role: number): string {
  return PROJECT_ROLE_NAMES[role as keyof typeof PROJECT_ROLE_NAMES] || "Unknown";
}

export function getProjectStatusLabel(status: number): string {
  switch (status) {
    case PROJECT_STATUS.ACTIVE:
      return "Active";
    case PROJECT_STATUS.ARCHIVED:
      return "Archived";
    default:
      return "Unknown";
  }
}

export function canUserEditProject(role: number | null): boolean {
  if (role === null) return false;
  return role <= PROJECT_ROLE.EDITOR;
}

export function canUserManageCollaborators(role: number | null): boolean {
  if (role === null) return false;
  return role <= PROJECT_ROLE.ADMIN;
}

export function canUserDeleteProject(role: number | null): boolean {
  if (role === null) return false;
  return role === PROJECT_ROLE.OWNER;
}

// ============================================
// useProjects Hook - List all user's projects
// ============================================

export function useProjects(ownerAddress: string | null | undefined) {
  return useQuery<ProjectWithRole[]>({
    queryKey: ["projects", ownerAddress],
    queryFn: async () => {
      if (!ownerAddress) return [];

      const res = await fetch(`/api/projects?owner=${ownerAddress}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch projects: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!ownerAddress,
  });
}

// ============================================
// useProject Hook - Get single project with content
// ============================================

export function useProject(projectId: string | undefined, userAddress?: string | null) {
  return useQuery<ProjectWithContent | null>({
    queryKey: ["project", projectId, userAddress],
    queryFn: async () => {
      if (!projectId) return null;

      const params = new URLSearchParams();
      if (userAddress) {
        params.set("address", userAddress);
      }

      const url = `/api/projects/${projectId}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch project: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!projectId,
  });
}

// ============================================
// useProjectAnalytics Hook
// ============================================

export function useProjectAnalytics(projectId: string | undefined) {
  return useQuery<ProjectAnalytics | null>({
    queryKey: ["projectAnalytics", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const res = await fetch(`/api/projects/${projectId}/analytics`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!projectId,
  });
}

// ============================================
// useProjectInsights Hook
// ============================================

export function useProjectInsights(projectId: string | undefined, type?: string) {
  return useQuery<ProjectInsight[]>({
    queryKey: ["projectInsights", projectId, type],
    queryFn: async () => {
      if (!projectId) return [];

      const params = new URLSearchParams();
      if (type) {
        params.set("type", type);
      }

      const url = `/api/projects/${projectId}/insights${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch insights: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!projectId,
  });
}

// ============================================
// useProjectCollaborators Hook
// ============================================

export function useProjectCollaborators(projectId: string | undefined) {
  return useQuery<{ owner: string; collaborators: ProjectCollaborator[] } | null>({
    queryKey: ["projectCollaborators", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch collaborators: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || null;
    },
    enabled: !!projectId,
  });
}

// ============================================
// usePendingInvites Hook
// ============================================

export function usePendingInvites(walletAddress: string | undefined) {
  return useQuery<{ invite: ProjectCollaborator; project: Project }[]>({
    queryKey: ["pendingInvites", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];

      const res = await fetch(`/api/projects/pending-invites/${walletAddress}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch invites: ${res.statusText}`);
      }

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!walletAddress,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create project");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.ownerAddress] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, ...input }: UpdateProjectInput & { projectId: string }) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update project");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, address }: { projectId: string; address: string }) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to archive project");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ============================================
// Content Management Mutations
// ============================================

export function useAddPollsToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, pollIds, address, cachedTitles }: AddPollsInput) => {
      const res = await fetch(`/api/projects/${projectId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pollIds, address, cachedTitles }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add polls");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", variables.projectId] });
    },
  });
}

export function useRemovePollFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, pollId, address }: { projectId: string; pollId: number; address: string }) => {
      const res = await fetch(`/api/projects/${projectId}/polls/${pollId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove poll");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", variables.projectId] });
    },
  });
}

export function useAddQuestionnairesToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, questionnaireIds, address }: AddQuestionnairesInput) => {
      const res = await fetch(`/api/projects/${projectId}/questionnaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionnaireIds, address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add questionnaires");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", variables.projectId] });
    },
  });
}

export function useRemoveQuestionnaireFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, questionnaireId, address }: { projectId: string; questionnaireId: string; address: string }) => {
      const res = await fetch(`/api/projects/${projectId}/questionnaires/${questionnaireId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove questionnaire");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectAnalytics", variables.projectId] });
    },
  });
}

// ============================================
// Collaborator Mutations
// ============================================

export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, walletAddress, role, inviterAddress }: InviteCollaboratorInput) => {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletAddress, role, inviterAddress }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to invite collaborator");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectCollaborators", variables.projectId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, walletAddress }: { projectId: string; walletAddress: string }) => {
      const res = await fetch(`/api/projects/${projectId}/collaborators/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletAddress }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept invite");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvites", variables.walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.walletAddress] });
    },
  });
}

export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, collabAddress, role, updaterAddress }: { projectId: string; collabAddress: string; role: number; updaterAddress: string }) => {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${collabAddress}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, updaterAddress }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectCollaborators", variables.projectId] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, collabAddress, removerAddress }: { projectId: string; collabAddress: string; removerAddress: string }) => {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${collabAddress}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ removerAddress }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove collaborator");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectCollaborators", variables.projectId] });
    },
  });
}

// ============================================
// Insights Mutations
// ============================================

export function useGenerateInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, insightType, address }: GenerateInsightInput) => {
      const res = await fetch(`/api/projects/${projectId}/insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ insightType, address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate insight");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projectInsights", variables.projectId] });
    },
  });
}

// Re-export constants for convenience
export { PROJECT_STATUS, PROJECT_ROLE, PROJECT_ROLE_NAMES };
