import { Navbar } from "@/components/navbar";
import { PulseCard } from "@/components/market-card";
import { CATEGORIES, MOCK_PULSES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import heroBg from "@assets/generated_images/abstract_digital_data_flow_background_for_business_intelligence_header.png";
import { ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredPulses = activeCategory === "all" 
    ? MOCK_PULSES 
    : MOCK_PULSES.filter(m => m.category.toLowerCase() === activeCategory);

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 py-16 md:py-24">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Data Background" 
            className="h-full w-full object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,11%)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222,47%,11%)] via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                Live Feedback Data
              </div>
              <h1 className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                The Hub for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-200">
                  Business Intelligence
                </span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                Stop guessing. Start forecasting. Gather internal feedback and validate product decisions with real-time crowd intelligence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-12 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_20px_hsl(160,84%,39%,0.3)] hover:bg-primary/90">
                  Create a Pulse
                </Button>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="h-12 border-white/10 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-sm hover:bg-white/10">
                    Explore Topics
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto mt-12 px-4">
        {/* Categories */}
        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "ghost"}
                onClick={() => setActiveCategory(cat.id)}
                className={`gap-2 rounded-full border px-6 transition-all ${
                  activeCategory === cat.id 
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured / Trending */}
        {activeCategory === "all" && (
            <div className="mb-16">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-white">
                        <TrendingUp className="h-6 w-6 text-primary" /> 
                        Trending Pulses
                    </h2>
                    <Button variant="link" className="text-primary hover:text-primary/80">
                        View all <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {MOCK_PULSES.slice(0, 3).map((pulse) => (
                        <PulseCard key={pulse.id} pulse={pulse} />
                    ))}
                </div>
            </div>
        )}

        {/* All Markets Grid */}
        <div>
           <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-white">
                    {activeCategory === "all" ? "New & Active" : CATEGORIES.find(c => c.id === activeCategory)?.label}
                </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPulses.map((pulse) => (
                    <PulseCard key={pulse.id} pulse={pulse} />
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}
