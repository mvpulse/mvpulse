import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Share2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PollDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (!selectedOption) return;
    
    setHasVoted(true);
    toast({
      title: "Vote Submitted!",
      description: "Your vote has been recorded on the Movement network.",
    });
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Voting Area */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-primary/50 text-primary">Governance</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Ends in 2 days
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight mb-4">
              Community Governance Proposal #{id}
            </h1>
            <p className="text-muted-foreground text-lg">
              Should we allocate 20% of the treasury to the new ecosystem grant program? This vote determines the Q3 budget allocation and strategic direction for developer incentives.
            </p>
          </div>

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasVoted ? (
                <RadioGroup onValueChange={setSelectedOption} className="gap-4">
                  <div className="flex items-center space-x-2 border border-border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="r1" />
                    <Label htmlFor="r1" className="flex-1 cursor-pointer font-medium">Yes, approve allocation</Label>
                  </div>
                  <div className="flex items-center space-x-2 border border-border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="r2" />
                    <Label htmlFor="r2" className="flex-1 cursor-pointer font-medium">No, reject proposal</Label>
                  </div>
                  <div className="flex items-center space-x-2 border border-border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="abstain" id="r3" />
                    <Label htmlFor="r3" className="flex-1 cursor-pointer font-medium">Abstain</Label>
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Yes, approve allocation</span>
                      <span className="font-bold">65%</span>
                    </div>
                    <Progress value={65} className="h-2 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>No, reject proposal</span>
                      <span className="font-bold">25%</span>
                    </div>
                    <Progress value={25} className="h-2 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Abstain</span>
                      <span className="font-bold">10%</span>
                    </div>
                    <Progress value={10} className="h-2 bg-muted" />
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3 text-primary">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">You voted "Yes"</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border/50 pt-6">
              {!hasVoted ? (
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg h-12"
                  disabled={!selectedOption}
                  onClick={handleVote}
                >
                  Confirm Vote
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Copied to clipboard!" });
                }}>
                  <Share2 className="w-4 h-4 mr-2" /> Share Poll
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Trophy className="w-5 h-5" /> Reward Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pool</span>
                <span className="font-bold font-mono">5,000 MOVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Per Voter</span>
                <span className="font-bold font-mono">~5.2 MOVE</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Rewards are distributed automatically via smart contract 24h after poll closes.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voter Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Wallet Connected
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Minimum 10 MOVE Balance
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Verified Human (Gitcoin Passport)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
