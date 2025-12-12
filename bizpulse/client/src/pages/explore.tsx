import { Navbar } from "@/components/navbar";
import { PulseGridCard } from "@/components/polymarket-card";
import { CATEGORIES, MOCK_PULSES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, ChevronDown, ListFilter, Activity } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import officeImg from "@assets/stock_images/stock_photo_1741818167683.jpg"; // These will be replaced by actual fetches if available, or just placeholders
import meetingImg from "@assets/stock_images/stock_photo_1741818167683.jpg"; 

// Using a small list of images to rotate
const STOCK_IMAGES = [
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&h=150&fit=crop", // Meeting
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&h=150&fit=crop", // Data
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&h=150&fit=crop", // Office
    "https://images.unsplash.com/photo-1553877615-2f3315797725?w=150&h=150&fit=crop", // Strategy
];

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredPulses = activeCategory === "all" 
    ? MOCK_PULSES 
    : MOCK_PULSES.filter(m => m.category.toLowerCase() === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      
      {/* Sub-header Filter Bar */}
      <div className="border-b border-white/5 sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                 {/* Search in Explore */}
                 <div className="relative flex-1 min-w-[200px] max-w-sm mr-4">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search topics" 
                        className="h-8 pl-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary text-sm"
                    />
                 </div>

                 <div className="h-6 w-px bg-white/10 mx-2" />

                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className={activeCategory === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}
                    onClick={() => setActiveCategory("all")}
                >
                    <ListFilter className="mr-2 h-3.5 w-3.5" />
                    All
                 </Button>

                 {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                     <Button 
                        key={cat.id}
                        variant="ghost"
                        size="sm"
                        className={activeCategory === cat.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                    </Button>
                 ))}
                 
                 <div className="flex-1" />
                 
                 <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filter
                 </Button>
            </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Ticker / Highlights (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card/30 border border-white/5 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Engagement</div>
                    <div className="text-xl font-bold font-display">128,402</div>
                </div>
                <Activity className="text-primary h-8 w-8 opacity-50" />
            </div>
            {/* Add more stats if needed */}
        </div>

        {/* Categories / Sections */}
        <div className="space-y-10">
            {/* New & Trending */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">New & Trending</h2>
                    <div className="ml-auto text-xs text-muted-foreground cursor-pointer hover:text-primary">View all</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredPulses.map((pulse, idx) => (
                        <PulseGridCard 
                            key={pulse.id} 
                            pulse={pulse} 
                            image={STOCK_IMAGES[idx % STOCK_IMAGES.length]}
                        />
                    ))}
                </div>
            </section>
            
            {/* Just Another Section to show depth */}
             <section>
                <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold">Strategic Questions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredPulses.slice().reverse().map((pulse, idx) => (
                        <PulseGridCard 
                            key={`rev-${pulse.id}`} 
                            pulse={pulse} 
                            image={STOCK_IMAGES[(idx + 2) % STOCK_IMAGES.length]}
                        />
                    ))}
                </div>
            </section>
        </div>
      </main>
    </div>
  );
}

// Simple icon component for section headers
function Target(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
