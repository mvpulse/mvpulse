import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { CreatorLayout } from "@/components/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  FolderKanban,
  BarChart3,
  Users,
  FileText,
  Vote,
  Settings,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  RefreshCcw,
  Copy,
  UserPlus,
  Crown,
  Shield,
  Pencil,
  Eye,
} from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  useProject,
  useProjectAnalytics,
  useProjectInsights,
  useUpdateProject,
  useArchiveProject,
  useRemovePollFromProject,
  useRemoveQuestionnaireFromProject,
  useInviteCollaborator,
  useRemoveCollaborator,
  useGenerateInsight,
  PROJECT_STATUS,
  PROJECT_ROLE,
  getProjectRoleLabel,
  canUserEditProject,
  canUserManageCollaborators,
  canUserDeleteProject,
} from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

// Color presets
const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

export default function ProjectDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { isConnected, address } = useWalletConnection();
  const { toast } = useToast();

  // Parse tab from URL
  const searchParams = new URLSearchParams(searchString);
  const initialTab = searchParams.get("tab") || "content";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<number>(PROJECT_ROLE.EDITOR);

  // Fetch project data
  const { data: project, isLoading, refetch } = useProject(projectId, address);
  const { data: analytics, refetch: refetchAnalytics } = useProjectAnalytics(projectId);
  const { data: insights, refetch: refetchInsights } = useProjectInsights(projectId);

  // Mutations
  const updateProjectMutation = useUpdateProject();
  const archiveProjectMutation = useArchiveProject();
  const removePollMutation = useRemovePollFromProject();
  const removeQuestionnaireMutation = useRemoveQuestionnaireFromProject();
  const inviteCollaboratorMutation = useInviteCollaborator();
  const removeCollaboratorMutation = useRemoveCollaborator();
  const generateInsightMutation = useGenerateInsight();

  // Update tab in URL
  useEffect(() => {
    if (activeTab !== "content") {
      window.history.replaceState(null, "", `/creator/projects/${projectId}?tab=${activeTab}`);
    } else {
      window.history.replaceState(null, "", `/creator/projects/${projectId}`);
    }
  }, [activeTab, projectId]);

  // Populate settings form when project loads
  useEffect(() => {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description || "");
      setEditColor(project.color || COLOR_PRESETS[0]);
    }
  }, [project]);

  // Check user permissions
  const userRole = project?.userRole ?? null;
  const canEdit = canUserEditProject(userRole);
  const canManageCollabs = canUserManageCollaborators(userRole);
  const canDelete = canUserDeleteProject(userRole);

  // Handle settings update
  const handleUpdateSettings = async () => {
    if (!projectId || !address) return;

    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        name: editName,
        description: editDescription,
        color: editColor,
        address,
      });

      toast({ title: "Project updated" });
      setIsSettingsOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to update project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!projectId || !address) return;

    try {
      await archiveProjectMutation.mutateAsync({ projectId, address });
      toast({ title: "Project archived" });
      navigate("/creator/projects");
    } catch (error) {
      toast({
        title: "Failed to archive project",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle remove poll
  const handleRemovePoll = async (pollId: number) => {
    if (!projectId || !address) return;

    try {
      await removePollMutation.mutateAsync({ projectId, pollId, address });
      toast({ title: "Poll removed from project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to remove poll",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle remove questionnaire
  const handleRemoveQuestionnaire = async (questionnaireId: string) => {
    if (!projectId || !address) return;

    try {
      await removeQuestionnaireMutation.mutateAsync({ projectId, questionnaireId, address });
      toast({ title: "Questionnaire removed from project" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to remove questionnaire",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle invite collaborator
  const handleInviteCollaborator = async () => {
    if (!projectId || !address || !inviteAddress.trim()) return;

    try {
      await inviteCollaboratorMutation.mutateAsync({
        projectId,
        walletAddress: inviteAddress.trim(),
        role: inviteRole,
        inviterAddress: address,
      });

      toast({ title: "Collaborator invited" });
      setIsInviteOpen(false);
      setInviteAddress("");
      refetch();
    } catch (error) {
      toast({
        title: "Failed to invite collaborator",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle remove collaborator
  const handleRemoveCollaborator = async (collabAddress: string) => {
    if (!projectId || !address) return;

    try {
      await removeCollaboratorMutation.mutateAsync({
        projectId,
        collabAddress,
        removerAddress: address,
      });

      toast({ title: "Collaborator removed" });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to remove collaborator",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle generate insight
  const handleGenerateInsight = async (insightType: "summary" | "trends" | "recommendations") => {
    if (!projectId || !address) return;

    try {
      await generateInsightMutation.mutateAsync({
        projectId,
        insightType,
        address,
      });

      toast({ title: "Insight generated" });
      refetchInsights();
    } catch (error) {
      toast({
        title: "Failed to generate insight",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Get role icon
  const getRoleIcon = (role: number) => {
    switch (role) {
      case PROJECT_ROLE.OWNER:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case PROJECT_ROLE.ADMIN:
        return <Shield className="w-4 h-4 text-blue-500" />;
      case PROJECT_ROLE.EDITOR:
        return <Pencil className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!isConnected) {
    return (
      <CreatorLayout>
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to view this project.
            </p>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  if (isLoading) {
    return (
      <CreatorLayout>
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-6" />
        <Skeleton className="h-96 w-full" />
      </CreatorLayout>
    );
  }

  if (!project) {
    return (
      <CreatorLayout>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              This project may have been deleted or you don't have access.
            </p>
            <Button onClick={() => navigate("/creator/projects")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => navigate("/creator/projects")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Projects
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color || COLOR_PRESETS[0] }}
          >
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {project.name}
              <Badge variant="secondary">{getProjectRoleLabel(userRole || 0)}</Badge>
            </h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>

        {canEdit && (
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Vote className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{project.polls?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Polls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{project.questionnaires?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Questionnaires</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{analytics?.totalVotes || 0}</p>
              <p className="text-sm text-muted-foreground">Total Votes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{(project.collaborators?.length || 0) + 1}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="collaborators">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="space-y-6">
            {/* Manage Content Button */}
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={() => navigate(`/creator/projects/${projectId}/manage`)}>
                  <Layers className="w-4 h-4 mr-2" />
                  Manage Content
                </Button>
              </div>
            )}

            {/* Polls Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="w-5 h-5" />
                      Polls ({project.polls?.length || 0})
                    </CardTitle>
                    <CardDescription>On-chain polls in this project</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.polls?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No polls added to this project yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {project.polls?.map((poll) => (
                      <div
                        key={poll.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {poll.cachedTitle || `Poll #${poll.pollId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {poll.cachedTotalVotes || 0} votes
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/poll/${poll.pollId}`)}
                          >
                            View
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemovePoll(poll.pollId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questionnaires Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Questionnaires ({project.questionnaires?.length || 0})
                    </CardTitle>
                    <CardDescription>Questionnaires in this project</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.questionnaires?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No questionnaires added to this project yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {project.questionnaires?.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{q.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {q.pollCount} polls - {q.completionCount} completions
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/questionnaire/${q.id}`)}
                          >
                            View
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveQuestionnaire(q.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Analytics</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchAnalytics()}>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{analytics?.totalPolls || 0}</p>
                  <p className="text-muted-foreground">Total Polls</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{analytics?.totalQuestionnaires || 0}</p>
                  <p className="text-muted-foreground">Total Questionnaires</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{analytics?.totalVotes || 0}</p>
                  <p className="text-muted-foreground">Total Votes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{analytics?.totalCompletions || 0}</p>
                  <p className="text-muted-foreground">Total Completions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Generate insights from your poll and questionnaire data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateInsight("summary")}
                    disabled={generateInsightMutation.isPending || !canEdit}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateInsight("trends")}
                    disabled={generateInsightMutation.isPending || !canEdit}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze Trends
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateInsight("recommendations")}
                    disabled={generateInsightMutation.isPending || !canEdit}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </Button>
                </div>

                {insights?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No insights generated yet. Click a button above to generate insights.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {insights?.map((insight) => (
                      <Card key={insight.id}>
                        <CardHeader>
                          <CardTitle className="text-lg capitalize">
                            {insight.insightType}
                          </CardTitle>
                          <CardDescription>
                            Generated on {new Date(insight.generatedAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {insight.content.split("\n").map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People who have access to this project</CardDescription>
                </div>
                {canManageCollabs && (
                  <Button onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Owner */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(PROJECT_ROLE.OWNER)}
                    <div>
                      <p className="font-medium font-mono text-sm">
                        {project.ownerAddress?.slice(0, 8)}...{project.ownerAddress?.slice(-6)}
                      </p>
                      <Badge variant="outline">Owner</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(project.ownerAddress || "");
                      toast({ title: "Address copied" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Collaborators */}
                {project.collaborators?.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getRoleIcon(collab.role)}
                      <div>
                        <p className="font-medium font-mono text-sm">
                          {collab.walletAddress.slice(0, 8)}...{collab.walletAddress.slice(-6)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getProjectRoleLabel(collab.role)}</Badge>
                          {!collab.acceptedAt && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(collab.walletAddress);
                          toast({ title: "Address copied" });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {canManageCollabs && collab.role > PROJECT_ROLE.OWNER && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveCollaborator(collab.walletAddress)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>Update your project details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>

            {canDelete && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button
                    variant="destructive"
                    onClick={handleArchive}
                    disabled={archiveProjectMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Archive Project
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
            <DialogDescription>
              Add a team member to this project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-address">Wallet Address</Label>
              <Input
                id="invite-address"
                placeholder="0x..."
                value={inviteAddress}
                onChange={(e) => setInviteAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole.toString()}
                onValueChange={(v) => setInviteRole(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRole === PROJECT_ROLE.OWNER && (
                    <SelectItem value={PROJECT_ROLE.ADMIN.toString()}>
                      Admin - Can manage project and team
                    </SelectItem>
                  )}
                  <SelectItem value={PROJECT_ROLE.EDITOR.toString()}>
                    Editor - Can add/remove content
                  </SelectItem>
                  <SelectItem value={PROJECT_ROLE.VIEWER.toString()}>
                    Viewer - Read-only access
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteCollaborator}
              disabled={!inviteAddress.trim() || inviteCollaboratorMutation.isPending}
            >
              {inviteCollaboratorMutation.isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
}
