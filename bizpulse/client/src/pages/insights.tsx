import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_digital_data_visualization_with_holographic_charts.png";
import { motion } from "framer-motion";

// Mock Data for Charts
const PERFORMANCE_DATA = [
  { month: 'Jan', accuracy: 65, participation: 400 },
  { month: 'Feb', accuracy: 68, participation: 600 },
  { month: 'Mar', accuracy: 75, participation: 900 },
  { month: 'Apr', accuracy: 72, participation: 1100 },
  { month: 'May', accuracy: 80, participation: 1500 },
  { month: 'Jun', accuracy: 85, participation: 1800 },
];

const CATEGORY_DISTRIBUTION = [
  { name: 'Product', value: 45, color: 'hsl(160, 84%, 39%)' },
  { name: 'Strategy', value: 25, color: 'hsl(280, 84%, 60%)' },
  { name: 'Marketing', value: 20, color: 'hsl(200, 90%, 60%)' },
  { name: 'Other', value: 10, color: 'hsl(217, 33%, 30%)' },
];

const INSIGHT_CARDS = [
  {
    id: 1,
    title: "Product Roadmap alignment check",
    description: "85% of participants believe the Mobile V2 launch will be delayed. Recommendation: Re-evaluate timeline estimates.",
    type: "Risk",
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20"
  },
  {
    id: 2,
    title: "Strong confidence in Enterprise strategy",
    description: "The 'Acme Corp' deal prediction market shows a 92% probability of closing. Sales team morale is high.",
    type: "Opportunity",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20"
  },
  {
    id: 3,
    title: "Marketing message resonance",
    description: "'Build Faster' slogan is outperforming 'Dream Bigger' by 10% in A/B prediction markets.",
    type: "Optimization",
    icon: Lightbulb,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20"
  }
];

export default function Insights() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
             <img src={heroBg} alt="Insights" className="w-full h-full object-cover opacity-40" />
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
                    <Activity className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Platform Insights</h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-xl">
                    Deep dive into forecast data. Uncover hidden trends, assess risks, and validate corporate strategy with crowd intelligence.
                </p>
            </motion.div>
        </div>
      </div>

      <main className="container mx-auto px-4 -mt-16 relative z-20 space-y-8">
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
                label="Forecast Accuracy" 
                value="85.2%" 
                trend="+2.4%" 
                trendUp={true} 
                delay={0}
            />
            <MetricCard 
                label="Active Contributors" 
                value="1,842" 
                trend="+12%" 
                trendUp={true} 
                delay={0.1}
            />
            <MetricCard 
                label="Total Participation" 
                value="128.4K" 
                trend="-0.8%" 
                trendUp={false} 
                delay={0.2}
            />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Trend Chart */}
            <Card className="glass-panel lg:col-span-2 p-6 border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Forecast Accuracy</h3>
                        <p className="text-sm text-muted-foreground">Correlation between forecasts and actual outcomes</p>
                    </div>
                    <Tabs defaultValue="6m" className="w-auto">
                        <TabsList className="bg-white/5">
                            <TabsTrigger value="1m">1M</TabsTrigger>
                            <TabsTrigger value="6m">6M</TabsTrigger>
                            <TabsTrigger value="1y">1Y</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={PERFORMANCE_DATA}>
                            <defs>
                                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(222, 47%, 13%)', borderColor: 'rgba(255,255,255,0.1)' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="accuracy" 
                                stroke="hsl(160, 84%, 39%)" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorAccuracy)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Distribution Chart */}
            <Card className="glass-panel p-6 border-white/5">
                <h3 className="text-lg font-semibold text-white mb-2">Topic Distribution</h3>
                <p className="text-sm text-muted-foreground mb-6">Engagement by category</p>
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={CATEGORY_DISTRIBUTION}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {CATEGORY_DISTRIBUTION.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 13%)', borderColor: 'rgba(255,255,255,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-2xl font-bold text-white">42</span>
                        <span className="text-xs text-muted-foreground">Active Topics</span>
                    </div>
                </div>
            </Card>
        </div>

        {/* Actionable Insights List */}
        <section>
            <h2 className="text-2xl font-display font-semibold text-white mb-6">Actionable Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {INSIGHT_CARDS.map((insight, idx) => (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                    >
                        <Card className="glass-card h-full p-6 border-t-4" style={{ borderTopColor: insight.color.replace('text-', '').replace('-400', '') === 'emerald' ? '#34d399' : insight.color.replace('text-', '').replace('-400', '') === 'red' ? '#f87171' : '#fbbf24' }}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${insight.bg} ${insight.border} border`}>
                                <insight.icon className={`h-5 w-5 ${insight.color}`} />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className={`${insight.color} ${insight.bg} border-transparent`}>{insight.type}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                            <p className="text-sm text-muted-foreground mb-6">{insight.description}</p>
                            <Button variant="link" className={`p-0 h-auto ${insight.color} hover:opacity-80`}>
                                View Details <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>

      </main>
    </div>
  );
}

function MetricCard({ label, value, trend, trendUp, delay }: { label: string, value: string, trend: string, trendUp: boolean, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="glass-panel p-6 border-white/5 hover:border-primary/20 transition-colors">
                <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
                    <div className={`flex items-center text-sm font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                        {trend}
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
