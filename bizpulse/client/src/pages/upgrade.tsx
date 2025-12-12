import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, BarChart3, Globe, Building2 } from "lucide-react";
import heroBg from "@assets/generated_images/abstract_premium_diamond_and_glass_geometric_background.png";
import { motion } from "framer-motion";

const TIERS = [
  {
    name: "Observer",
    price: "$0",
    description: "For individuals exploring the forecasts.",
    features: [
      "Access to public topics",
      "Basic voting rights",
      "Standard community support",
      "View public leaderboard"
    ],
    cta: "Current Plan",
    featured: false,
    icon: Globe
  },
  {
    name: "Strategist",
    price: "$29",
    period: "/month",
    description: "For power users who need data-backed confidence.",
    features: [
      "Everything in Observer",
      "Access to 'Insights' dashboard",
      "Advanced topic filters",
      "Real-time trend alerts",
      "Priority support",
      "Export CSV data"
    ],
    cta: "Upgrade to Strategist",
    featured: true,
    icon: Zap,
    color: "emerald"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations building their own intelligence networks.",
    features: [
      "Everything in Strategist",
      "Create private internal topics",
      "SSO & Role-based access",
      "API Access",
      "Dedicated Success Manager",
      "Custom integration support"
    ],
    cta: "Contact Sales",
    featured: false,
    icon: Building2
  }
];

export default function Upgrade() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 z-0">
             <img src={heroBg} alt="Upgrade" className="w-full h-full object-cover opacity-20" />
             <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary px-3 py-1">
                    Unlock Full Potential
                </Badge>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                    Power Your Decisions with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-200">
                        Corporate Intelligence
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                    Gain access to the Insights dashboard, create private topics for your team, and validate strategy with data, not guesswork.
                </p>
            </motion.div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
                {TIERS.map((tier, idx) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (idx * 0.1), duration: 0.5 }}
                        className="h-full"
                    >
                        <Card className={`relative h-full flex flex-col p-8 transition-all duration-300 ${tier.featured ? 'glass-card border-primary/50 shadow-[0_0_40px_-10px_hsl(160,84%,39%,0.15)] scale-105 z-10' : 'glass-panel border-white/5 bg-card/30 hover:border-white/10'}`}>
                            {tier.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground hover:bg-primary px-4 py-1 shadow-lg">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${tier.featured ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                                    <tier.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{tier.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-display font-bold text-white">{tier.price}</span>
                                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <Check className={`h-5 w-5 shrink-0 ${tier.featured ? 'text-primary' : 'text-white/20'}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                variant={tier.featured ? "default" : "outline"} 
                                className={`w-full h-12 text-base font-medium ${tier.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                            >
                                {tier.cta}
                            </Button>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Trust Badges */}
            <div className="mt-20 pt-10 border-t border-white/5">
                <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">Trusted by strategy teams at</p>
                <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale">
                     {/* Using text for logos to keep it simple but implying brands */}
                     <span className="text-xl font-bold font-display">ACME Corp</span>
                     <span className="text-xl font-bold font-display">Globex</span>
                     <span className="text-xl font-bold font-display">Soylent</span>
                     <span className="text-xl font-bold font-display">Umbrella</span>
                     <span className="text-xl font-bold font-display">Cyberdyne</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
