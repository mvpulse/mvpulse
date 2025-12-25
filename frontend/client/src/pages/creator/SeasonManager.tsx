/**
 * SeasonManager - Admin page for managing seasons
 * Create, start, end, and distribute seasons
 */

import { useState, useMemo } from "react";
import { CreatorLayout } from "@/components/layouts/CreatorLayout";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  useSeasons,
  useSeasonSnapshots,
  useCreateSeason,
  useStartSeason,
  useEndSeason,
  useDistributeSeason,
  useCopyQuests,
  getSeasonStatusLabel,
  getSeasonStatusColor,
  SEASON_STATUS,
  type SeasonWithStats,
} from "@/hooks/useSeasons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Calendar,
  Play,
  Square,
  Trophy,
  Users,
  Coins,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
} from "lucide-react";

export default function SeasonManager() {
  const { address, isConnected } = useWalletConnection();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [snapshotsDialogOpen, setSnapshotsDialogOpen] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  // Form state for create season
  const [seasonName, setSeasonName] = useState("");
  const [seasonDescription, setSeasonDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pulsePool, setPulsePool] = useState("");
  const [copyFromSeasonId, setCopyFromSeasonId] = useState<string>("");

  // Fetch all seasons
  const { data: allSeasons, isLoading } = useSeasons();
  const { data: snapshots, isLoading: snapshotsLoading } = useSeasonSnapshots(selectedSeasonId || undefined);

  // Mutations
  const createMutation = useCreateSeason();
  const startMutation = useStartSeason();
  const endMutation = useEndSeason();
  const distributeMutation = useDistributeSeason();
  const copyQuestsMutation = useCopyQuests();

  // Filter seasons by status
  const filteredSeasons = useMemo(() => {
    if (!allSeasons) return [];
    if (activeTab === "all") return allSeasons;
    const statusMap: Record<string, number> = {
      pending: SEASON_STATUS.PENDING,
      active: SEASON_STATUS.ACTIVE,
      ended: SEASON_STATUS.ENDED,
      distributed: SEASON_STATUS.DISTRIBUTED,
    };
    return allSeasons.filter((s) => s.status === statusMap[activeTab]);
  }, [allSeasons, activeTab]);

  // Get ended/distributed seasons for copy dropdown
  const pastSeasons = useMemo(() => {
    if (!allSeasons) return [];
    return allSeasons.filter(
      (s) => s.status === SEASON_STATUS.ENDED || s.status === SEASON_STATUS.DISTRIBUTED
    );
  }, [allSeasons]);

  // Handle create season
  const handleCreateSeason = async () => {
    if (!address || !seasonName || !startDate || !endDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: seasonName,
        description: seasonDescription || undefined,
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString(),
        totalPulsePool: pulsePool || "0",
        creatorAddress: address,
      });

      // If copy quests is selected
      if (copyFromSeasonId && result.data?.id) {
        await copyQuestsMutation.mutateAsync({
          targetSeasonId: result.data.id,
          fromSeasonId: copyFromSeasonId,
        });
      }

      toast({
        title: "Season Created",
        description: `Season "${seasonName}" has been created.`,
      });

      // Reset form
      setSeasonName("");
      setSeasonDescription("");
      setStartDate("");
      setEndDate("");
      setPulsePool("");
      setCopyFromSeasonId("");
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create season",
        variant: "destructive",
      });
    }
  };

  // Handle start season
  const handleStartSeason = async (seasonId: string) => {
    try {
      await startMutation.mutateAsync(seasonId);
      toast({
        title: "Season Started",
        description: "The season is now active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start season",
        variant: "destructive",
      });
    }
  };

  // Handle end season
  const handleEndSeason = async (seasonId: string) => {
    try {
      await endMutation.mutateAsync(seasonId);
      toast({
        title: "Season Ended",
        description: "User snapshots have been created. You can now distribute rewards.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end season",
        variant: "destructive",
      });
    }
  };

  // Handle mark distributed
  const handleDistribute = async (seasonId: string) => {
    try {
      await distributeMutation.mutateAsync(seasonId);
      toast({
        title: "Season Distributed",
        description: "The season has been marked as distributed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as distributed",
        variant: "destructive",
      });
    }
  };

  // View snapshots
  const handleViewSnapshots = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setSnapshotsDialogOpen(true);
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (endTime: Date | string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!isConnected) {
    return (
      <CreatorLayout
        title="Season Manager"
        description="Create and manage seasons"
      >
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground">
              Connect your wallet to manage seasons.
            </p>
          </CardContent>
        </Card>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout
      title="Season Manager"
      description="Create and manage seasons for point accumulation"
    >
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Seasons</h2>
            <p className="text-muted-foreground">
              Manage season lifecycle: create, start, end, and distribute rewards
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Season
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Season</DialogTitle>
                <DialogDescription>
                  Set up a new season for users to earn points.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Season Name *</Label>
                  <Input
                    id="name"
                    placeholder="Season 1"
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    value={seasonDescription}
                    onChange={(e) => setSeasonDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pulsePool">PULSE Reward Pool</Label>
                  <Input
                    id="pulsePool"
                    type="number"
                    placeholder="0"
                    value={pulsePool}
                    onChange={(e) => setPulsePool(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total PULSE to distribute to participants
                  </p>
                </div>

                {pastSeasons.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="copyQuests">Copy Quests From</Label>
                    <Select
                      value={copyFromSeasonId || "none"}
                      onValueChange={(value) => setCopyFromSeasonId(value === "none" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a season (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {pastSeasons.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSeason}
                  disabled={createMutation.isPending || !seasonName || !startDate || !endDate}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Season"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
            <TabsTrigger value="distributed">Distributed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredSeasons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Seasons Found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "all"
                      ? "Create your first season to get started."
                      : `No ${activeTab} seasons found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSeasons.map((season) => (
                  <SeasonCard
                    key={season.id}
                    season={season}
                    onStart={handleStartSeason}
                    onEnd={handleEndSeason}
                    onDistribute={handleDistribute}
                    onViewSnapshots={handleViewSnapshots}
                    isStarting={startMutation.isPending}
                    isEnding={endMutation.isPending}
                    isDistributing={distributeMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Snapshots Dialog */}
        <Dialog open={snapshotsDialogOpen} onOpenChange={setSnapshotsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Season Snapshots</DialogTitle>
              <DialogDescription>
                Final rankings and points for this season
              </DialogDescription>
            </DialogHeader>

            {snapshotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : snapshots && snapshots.length > 0 ? (
              <div className="space-y-2">
                {snapshots.map((snapshot, index) => (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm w-8">
                        #{snapshot.finalRank}
                      </span>
                      <span className="font-mono text-sm truncate max-w-[200px]">
                        {snapshot.walletAddress.slice(0, 8)}...{snapshot.walletAddress.slice(-6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        {snapshot.totalPoints.toLocaleString()} pts
                      </span>
                      <span className="text-muted-foreground">
                        {snapshot.questsCompleted} quests
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No snapshots found for this season.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CreatorLayout>
  );
}

// Season Card Component
interface SeasonCardProps {
  season: SeasonWithStats;
  onStart: (id: string) => void;
  onEnd: (id: string) => void;
  onDistribute: (id: string) => void;
  onViewSnapshots: (id: string) => void;
  isStarting: boolean;
  isEnding: boolean;
  isDistributing: boolean;
}

function SeasonCard({
  season,
  onStart,
  onEnd,
  onDistribute,
  onViewSnapshots,
  isStarting,
  isEnding,
  isDistributing,
}: SeasonCardProps) {
  const daysRemaining =
    season.status === SEASON_STATUS.ACTIVE
      ? Math.ceil(
          (new Date(season.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

  const isExpired =
    season.status === SEASON_STATUS.ACTIVE &&
    new Date(season.endTime) < new Date();

  return (
    <Card className={isExpired ? "border-destructive" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{season.name}</CardTitle>
            <Badge className={getSeasonStatusColor(season.status)}>
              {getSeasonStatusLabel(season.status)}
            </Badge>
            {isExpired && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Season #{season.seasonNumber}
          </span>
        </div>
        {season.description && (
          <CardDescription>{season.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(season.startTime).toLocaleDateString()} -{" "}
              {new Date(season.endTime).toLocaleDateString()}
            </span>
          </div>

          {season.participantCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{season.participantCount} participants</span>
            </div>
          )}

          {season.totalPulsePool && season.totalPulsePool !== "0" && (
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span>{BigInt(season.totalPulsePool) / BigInt(1e8)} PULSE</span>
            </div>
          )}

          {daysRemaining !== null && !isExpired && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Ends today"}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {season.status === SEASON_STATUS.PENDING && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Start Season
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start Season?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make the season active. Users will be able to earn
                    points and complete quests.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onStart(season.id)}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {season.status === SEASON_STATUS.ACTIVE && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant={isExpired ? "destructive" : "outline"}>
                  <Square className="h-4 w-4 mr-2" />
                  End Season
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Season?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create snapshots for all users and reset their
                    season points. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onEnd(season.id)}
                    disabled={isEnding}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isEnding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "End Season"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {season.status === SEASON_STATUS.ENDED && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewSnapshots(season.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Snapshots
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Distributed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark as Distributed?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Only mark this after you have manually distributed the
                      PULSE rewards to participants.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDistribute(season.id)}
                      disabled={isDistributing}
                    >
                      {isDistributing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {season.status === SEASON_STATUS.DISTRIBUTED && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewSnapshots(season.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Snapshots
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
