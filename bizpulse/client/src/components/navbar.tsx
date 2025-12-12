import { Link } from "wouter";
import { Search, Bell, Menu, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              BizPulse
            </a>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/"><a className="transition-colors hover:text-primary">Home</a></Link>
            <Link href="/explore"><a className="transition-colors hover:text-primary">Explore Markets</a></Link>
            <Link href="/leaderboard"><a className="transition-colors hover:text-primary">Leaderboard</a></Link>
            <Link href="/insights"><a className="transition-colors hover:text-primary">Insights</a></Link>
            <Link href="/upgrade"><a className="text-accent hover:text-accent/80 transition-colors">Upgrade</a></Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="relative hidden w-64 md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search markets..." 
              className="h-9 w-full rounded-full bg-secondary/50 pl-9 text-sm focus-visible:ring-primary"
            />
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="outline" className="hidden md:flex gap-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
             <span className="font-bold">1,250</span> pts
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/80 hover:bg-secondary">
            <User className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
