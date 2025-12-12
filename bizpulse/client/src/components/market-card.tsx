import { Pulse } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface PulseCardProps {
  pulse: Pulse;
}

export function PulseCard({ pulse }: PulseCardProps) {
  const isTrendingUp = pulse.trend === "up";
  const primaryOption = pulse.options?.[0];
  const secondaryOption = pulse.options?.[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-card group relative h-full cursor-pointer overflow-hidden p-0">
        <div className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 bg-white/5 text-xs font-normal text-muted-foreground">
                {pulse.category}
              </Badge>
              {pulse.trend === "up" && (
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-xs font-normal text-primary">
                  Trending <TrendingUp className="ml-1 h-3 w-3" />
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{pulse.endDate}</span>
          </div>

          {/* Title */}
          <h3 className="mb-2 font-display text-lg font-medium leading-tight text-white group-hover:text-primary transition-colors">
            {pulse.title}
          </h3>
          <p className="mb-6 line-clamp-2 text-sm text-muted-foreground">
            {pulse.description}
          </p>

          {/* Probability Bar */}
          <div className="mb-4">
             <div className="flex justify-between text-sm font-medium mb-2">
               <span className="text-primary">{primaryOption?.label}</span>
               <span className="text-primary">{primaryOption?.percentage}%</span>
             </div>
             <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
               <div 
                 className="h-full bg-primary transition-all duration-500 ease-out"
                 style={{ width: `${primaryOption?.percentage}%` }}
               />
             </div>
             {secondaryOption && (
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                   <span>{secondaryOption.label}</span>
                   <span>{secondaryOption.percentage}%</span>
                </div>
             )}
          </div>

          {/* Stats Footer */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold text-sm">{pulse.engagement}</span> Votes
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {pulse.participants}
              </span>
            </div>
            <BarChart3 className="h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100 transition-all" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
