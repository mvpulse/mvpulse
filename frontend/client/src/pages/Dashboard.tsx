import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PollCard } from "@/components/PollCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [location] = useLocation();
  const [role, setRole] = useState<"creator" | "participant">("creator");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "participant") setRole("participant");
  }, [location]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">
            {role === "creator" ? "Creator Dashboard" : "Explore Polls"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {role === "creator" 
              ? "Manage your active polls and analyze responses." 
              : "Participate in active polls and earn rewards."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={role === "creator" ? "default" : "outline"} 
            onClick={() => setRole("creator")}
            size="sm"
          >
            Creator View
          </Button>
          <Button 
            variant={role === "participant" ? "default" : "outline"} 
            onClick={() => setRole("participant")}
            size="sm"
          >
            Participant View
          </Button>
        </div>
      </div>

      {/* Stats Overview (Creator Only) */}
      {role === "creator" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Polls", value: "12", change: "+2 this week" },
            { label: "Total Responses", value: "1,429", change: "+15% vs last week" },
            { label: "Tokens Distributed", value: "5,200 MOVE", change: "Total rewards" },
            { label: "Avg. Completion", value: "89%", change: "Top 5% of platform" },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold font-mono mt-1">{stat.value}</p>
              <p className="text-xs text-accent mt-1">{stat.change}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search polls..." className="pl-10 bg-muted/30" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          {role === "creator" && (
            <Button className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Create Poll
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PollCard 
              id="1"
              title="Community Governance Proposal #42"
              description="Should we allocate 20% of the treasury to the new ecosystem grant program? This vote determines the Q3 budget allocation."
              votes={1240}
              timeLeft="2 days left"
              reward="50 MOVE"
              status="active"
              tags={["Governance", "Treasury"]}
            />
            <PollCard 
              id="2"
              title="DeFi User Experience Survey"
              description="Help us improve our DEX interface. We want to know what features matter most to you when trading on Movement."
              votes={450}
              timeLeft="5 days left"
              reward="NFT Whitelist"
              status="active"
              tags={["Product", "UX Research"]}
            />
            <PollCard 
              id="3"
              title="New Brand Identity Feedback"
              description="We are rebranding! Vote on your favorite logo concept for the new protocol launch."
              votes={892}
              timeLeft="12 hours left"
              reward="10 USDC"
              status="active"
              tags={["Design", "Branding"]}
            />
            <PollCard 
              id="4"
              title="Validator Performance Review"
              description="Rate the performance of current validator set based on uptime and community contribution."
              votes={320}
              timeLeft="1 week left"
              status="active"
              tags={["Technical", "Validators"]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
