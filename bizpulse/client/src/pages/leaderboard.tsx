import { Navbar } from "@/components/navbar";
import { MOCK_LEADERBOARD, UserRank } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, TrendingUp, Award, Crown } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_gold_and_platinum_trophy_geometric_background.png";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const topThree = MOCK_LEADERBOARD.slice(0, 3);
  const restOfList = MOCK_LEADERBOARD.slice(3);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
             <img src={heroBg} alt="Leaderboard" className="w-full h-full object-cover opacity-40" />
             <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 h-full flex flex-col justify-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-8 w-8 text-yellow-400" />
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Leaderboard</h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-xl">
                    Top contributors driving corporate intelligence. These strategists have the highest forecast accuracy this quarter.
                </p>
            </motion.div>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-16 relative z-20">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
            {/* 2nd Place */}
            <PodiumCard user={topThree[1]} rank={2} delay={0.2} />
            {/* 1st Place */}
            <PodiumCard user={topThree[0]} rank={1} delay={0} isWinner />
            {/* 3rd Place */}
            <PodiumCard user={topThree[2]} rank={3} delay={0.4} />
        </div>

        {/* The Rest of the List */}
        <Card className="glass-panel border-white/5 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Contributor</th>
                            <th className="px-6 py-4 text-right">Impact Score</th>
                            <th className="px-6 py-4 text-right">Accuracy</th>
                            <th className="px-6 py-4 text-right">Contrib.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {restOfList.map((user, idx) => (
                            <motion.tr 
                                key={user.rank}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                <td className="px-6 py-4 font-mono text-muted-foreground">#{user.rank}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarFallback className="bg-secondary text-xs">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{user.name}</span>
                                        {user.badge && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-white/10 text-muted-foreground border-transparent">
                                                {user.badge}
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-emerald-400">{user.impactScore}</td>
                                <td className="px-6 py-4 text-right">{user.accuracy}%</td>
                                <td className="px-6 py-4 text-right text-muted-foreground">{user.contributions}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>

      </main>
    </div>
  );
}

function PodiumCard({ user, rank, delay, isWinner = false }: { user: UserRank, rank: number, delay: number, isWinner?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
            className={`relative flex flex-col items-center p-6 rounded-2xl glass-card border-t border-white/10 ${isWinner ? 'bg-gradient-to-b from-primary/20 to-card h-[380px] border-primary/30 shadow-[0_0_40px_-10px_hsl(160,84%,39%,0.3)]' : 'bg-card/60 h-[320px]'}`}
        >
            <div className={`absolute -top-6 flex items-center justify-center w-12 h-12 rounded-full border-4 border-background font-bold text-lg shadow-lg ${
                rank === 1 ? 'bg-yellow-400 text-yellow-950' : 
                rank === 2 ? 'bg-slate-300 text-slate-900' : 
                'bg-amber-700 text-amber-100'
            }`}>
                {rank}
            </div>

            <div className={`mt-8 mb-4 relative ${isWinner ? 'scale-125' : ''}`}>
                 {isWinner && <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 h-8 w-8 animate-bounce" />}
                 <Avatar className="h-24 w-24 border-4 border-white/10 shadow-xl">
                    <AvatarFallback className="text-2xl bg-secondary">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                 </Avatar>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
            {user.badge && <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">{user.badge}</Badge>}

            <div className="mt-auto w-full space-y-3">
                <div className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                    <span className="text-muted-foreground">Impact Score</span>
                    <span className="font-bold text-emerald-400">{user.impactScore}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold text-white">{user.accuracy}%</span>
                </div>
            </div>
        </motion.div>
    );
}
