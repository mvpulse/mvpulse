import { Pulse } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RefreshCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PulseGridCardProps {
  pulse: Pulse;
  image?: string;
}

export function PulseGridCard({ pulse, image }: PulseGridCardProps) {
  const isBinary = pulse.type === "binary";

  return (
    <Card className="flex flex-col h-full bg-card/50 hover:bg-card border-white/10 transition-all duration-200 group overflow-hidden">
      {/* Header */}
      <div className="p-3 pb-0 flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded bg-muted/50 overflow-hidden">
            {image ? (
                <img src={image} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {pulse.category[0]}
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {pulse.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col justify-end">
        {isBinary ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
                {/* Yes Button */}
                <button className="flex flex-col items-start justify-center px-3 py-1.5 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 transition-colors border border-[#10B981]/20 group/btn">
                    <span className="text-xs font-medium text-[#10B981] group-hover/btn:text-[#34D399]">Yes</span>
                    <span className="text-sm font-bold text-[#10B981]">{pulse.options[0].percentage}%</span>
                </button>
                {/* No Button */}
                <button className="flex flex-col items-start justify-center px-3 py-1.5 rounded bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-colors border border-[#EF4444]/20 group/btn">
                    <span className="text-xs font-medium text-[#EF4444] group-hover/btn:text-[#F87171]">No</span>
                    <span className="text-sm font-bold text-[#EF4444]">{pulse.options[1].percentage}%</span>
                </button>
            </div>
        ) : (
            <div className="mt-2 space-y-1.5">
                {pulse.options.slice(0, 3).map((opt, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate max-w-[60%]">{opt.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{opt.percentage}%</span>
                            <div className="flex gap-0.5">
                                <div className="w-8 h-6 rounded bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xs cursor-pointer hover:bg-[#10B981]/20">Y</div>
                                <div className="w-8 h-6 rounded bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center text-xs cursor-pointer hover:bg-[#EF4444]/20">N</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground/60">
        <span className="font-medium text-muted-foreground">{pulse.engagement} Votes</span>
        <div className="flex items-center gap-3">
            <MessageSquare className="w-3.5 h-3.5 hover:text-foreground cursor-pointer" />
            <RefreshCcw className="w-3.5 h-3.5 hover:text-foreground cursor-pointer" />
            <Star className="w-3.5 h-3.5 hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </Card>
  );
}
