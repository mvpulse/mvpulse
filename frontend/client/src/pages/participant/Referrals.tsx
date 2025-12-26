import { useState } from "react";
import { ParticipantLayout } from "@/components/layouts/ParticipantLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Copy,
  Check,
  Users,
  Trophy,
  TrendingUp,
  Gift,
  RefreshCcw,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useReferral, useReferralLeaderboard, type RefereeInfo } from "@/hooks/useReferral";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/contract";
import {
  REFERRAL_STATUS,
  REFERRAL_TIER_NAMES,
  REFERRAL_TIER_THRESHOLDS,
  REFERRAL_TIERS,
} from "@shared/schema";

const STATUS_LABELS: Record<number, string> = {
  [REFERRAL_STATUS.PENDING]: "Pending",
  [REFERRAL_STATUS.WALLET_CONNECTED]: "Connected",
  [REFERRAL_STATUS.FIRST_VOTE]: "Active",
  [REFERRAL_STATUS.COMPLETED]: "Completed",
};

const STATUS_COLORS: Record<number, string> = {
  [REFERRAL_STATUS.PENDING]: "bg-gray-500/20 text-gray-500 border-gray-500/50",
  [REFERRAL_STATUS.WALLET_CONNECTED]: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
  [REFERRAL_STATUS.FIRST_VOTE]: "bg-green-500/20 text-green-500 border-green-500/50",
  [REFERRAL_STATUS.COMPLETED]: "bg-blue-500/20 text-blue-500 border-blue-500/50",
};

const TIER_ICONS: Record<number, React.ReactNode> = {
  [REFERRAL_TIERS.NONE]: null,
  [REFERRAL_TIERS.BRONZE]: <Medal className="w-4 h-4 text-amber-600" />,
  [REFERRAL_TIERS.SILVER]: <Medal className="w-4 h-4 text-gray-400" />,
  [REFERRAL_TIERS.GOLD]: <Award className="w-4 h-4 text-yellow-500" />,
  [REFERRAL_TIERS.PLATINUM]: <Crown className="w-4 h-4 text-purple-500" />,
};

const TIER_COLORS: Record<number, string> = {
  [REFERRAL_TIERS.NONE]: "text-muted-foreground",
  [REFERRAL_TIERS.BRONZE]: "text-amber-600",
  [REFERRAL_TIERS.SILVER]: "text-gray-400",
  [REFERRAL_TIERS.GOLD]: "text-yellow-500",
  [REFERRAL_TIERS.PLATINUM]: "text-purple-500",
};

export default function Referrals() {
  const { isConnected, address } = useWalletConnection();
  const {
    referralCode,
    referralCodeLoading,
    stats,
    statsLoading,
    referees,
    refereesLoading,
    getReferralUrl,
    refetchStats,
    refetchReferees,
  } = useReferral(address);

  const { leaderboard, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useReferralLeaderboard(10);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = getReferralUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetchStats();
    refetchReferees();
    refetchLeaderboard();
  };

  if (!isConnected) {
    return (
      <ParticipantLayout title="Referrals" description="Invite friends and earn rewards">
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to view your referrals.
            </p>
          </CardContent>
        </Card>
      </ParticipantLayout>
    );
  }

  // Calculate progress to next tier
  const currentTier = stats?.currentTier || 0;
  const activeReferrals = stats?.activeReferrals || 0;
  const nextTierThreshold = stats?.nextTierThreshold || REFERRAL_TIER_THRESHOLDS[REFERRAL_TIERS.BRONZE];
  const currentTierThreshold = REFERRAL_TIER_THRESHOLDS[currentTier as keyof typeof REFERRAL_TIER_THRESHOLDS] || 0;
  const progressToNextTier = nextTierThreshold
    ? Math.min(100, ((activeReferrals - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100)
    : 100;

  return (
    <ParticipantLayout title="Referrals" description="Invite friends and earn rewards">
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Referral Link Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralCodeLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : referralCode ? (
              <div className="flex gap-2">
                <Input
                  value={getReferralUrl() || ""}
                  readOnly
                  className="font-mono text-sm bg-background"
                />
                <Button onClick={handleCopyLink} className="shrink-0">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Unable to generate referral code</p>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              Share this link with friends. When they connect and vote, you both earn points!
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.activeReferrals || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points Earned</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalPointsEarned?.toLocaleString() || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {TIER_ICONS[currentTier]}
              <span className={TIER_COLORS[currentTier]}>
                {stats?.tierName || "None"} Tier
              </span>
              <Badge variant="outline" className="ml-2">
                {stats?.tierMultiplier || 1}x Multiplier
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : stats?.nextTierName ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Progress to {stats.nextTierName}
                  </span>
                  <span className="font-mono">
                    {activeReferrals}/{nextTierThreshold} active referrals
                  </span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
              </div>
            ) : (
              <p className="text-muted-foreground">
                Maximum tier reached! Enjoy 3x point multiplier on all referral rewards.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Referees List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referees</CardTitle>
          </CardHeader>
          <CardContent>
            {refereesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : referees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No referrals yet. Share your link to start earning!
              </p>
            ) : (
              <div className="space-y-3">
                {referees.map((referee: RefereeInfo) => (
                  <div
                    key={referee.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-sm">
                          {truncateAddress(referee.refereeAddress)}
                        </p>
                        <Badge className={STATUS_COLORS[referee.status]}>
                          {STATUS_LABELS[referee.status]}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        +{referee.totalPointsEarned} pts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {referee.milestones.length} milestones
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Referral Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No referrers yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.walletAddress.toLowerCase() === address?.toLowerCase();
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/30 border border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? "bg-yellow-500/20 text-yellow-500"
                              : index === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : index === 2
                              ? "bg-amber-600/20 text-amber-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-mono text-sm">
                            {truncateAddress(entry.walletAddress)}
                            {isCurrentUser && (
                              <span className="ml-2 text-primary text-xs">(You)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {TIER_ICONS[entry.currentTier]}
                            <span className={TIER_COLORS[entry.currentTier]}>
                              {entry.tierName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {entry.totalPointsEarned.toLocaleString()} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.activeReferrals} active
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ParticipantLayout>
  );
}
