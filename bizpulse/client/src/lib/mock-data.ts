import { LucideIcon, TrendingUp, Users, Activity, Briefcase, Zap, Globe, Megaphone, Target, Cpu } from "lucide-react";

export interface PulseOption {
  label: string;
  percentage: number; // 0-100
  color?: string;
}

export interface Pulse {
  id: string;
  title: string;
  description: string;
  category: "Product" | "Marketing" | "Strategy" | "Design" | "Finance" | "HR";
  endDate: string;
  engagement: string; // Replaces volume
  consensus?: number; // Replaces chance
  trend: "up" | "down" | "neutral";
  participants: number;
  image?: string;
  type: "binary" | "multiple";
  options: PulseOption[];
}

export interface UserRank {
  rank: number;
  name: string;
  impactScore: string; // Replaces profit
  accuracy: number; // Replaces winRate
  contributions: string; // Replaces volume
  avatar?: string;
  badge?: string;
}

export const CATEGORIES = [
  { id: "all", label: "All", icon: Globe },
  { id: "product", label: "Product", icon: Zap },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "strategy", label: "Strategy", icon: Target },
  { id: "design", label: "Design", icon: Activity },
  { id: "finance", label: "Finance", icon: TrendingUp },
  { id: "hr", label: "HR", icon: Users },
];

export const MOCK_PULSES: Pulse[] = [
  {
    id: "1",
    title: "Will 'Dark Mode' feature increase Q3 retention >5%?",
    description: "Impact of dark mode on retention.",
    category: "Product",
    endDate: "Oct 1",
    engagement: "12K",
    consensus: 78,
    trend: "up",
    participants: 1420,
    type: "binary",
    options: [
      { label: "Yes", percentage: 78 },
      { label: "No", percentage: 22 },
    ]
  },
  {
    id: "2",
    title: "Which Q4 campaign slogan will have higher CTR?",
    description: "A/B testing prediction.",
    category: "Marketing",
    endDate: "Nov 15",
    engagement: "8.5K",
    consensus: 45,
    trend: "down",
    participants: 890,
    type: "binary",
    options: [
      { label: "Build Faster", percentage: 55 },
      { label: "Dream Bigger", percentage: 45 },
    ]
  },
  {
    id: "3",
    title: "Enterprise deal with Acme Corp closed by EOY?",
    description: "Sales team confidence interval.",
    category: "Strategy",
    endDate: "Dec 31",
    engagement: "45K",
    consensus: 92,
    trend: "up",
    participants: 350,
    type: "binary",
    options: [
      { label: "Yes", percentage: 92 },
      { label: "No", percentage: 8 },
    ]
  },
  {
    id: "4",
    title: "Preferred Navigation Style",
    description: "Design team feedback.",
    category: "Design",
    endDate: "Sep 20",
    engagement: "3.2K",
    participants: 2100,
    type: "multiple",
    trend: "neutral",
    options: [
      { label: "Sidebar", percentage: 60 },
      { label: "Top Nav", percentage: 30 },
      { label: "Hybrid", percentage: 10 },
    ]
  },
  {
    id: "5",
    title: "AI Assistant: Support ticket reduction target met?",
    description: "Operational efficiency impact.",
    category: "Product",
    endDate: "Jan 1",
    engagement: "18K",
    consensus: 34,
    trend: "down",
    participants: 560,
    type: "binary",
    options: [
      { label: "Yes", percentage: 34 },
      { label: "No", percentage: 66 },
    ]
  },
  {
    id: "6",
    title: "Pivot Q1 roadmap to Mobile First?",
    description: "Strategic alignment check.",
    category: "Strategy",
    endDate: "Oct 15",
    engagement: "15K",
    consensus: 88,
    trend: "up",
    participants: 120,
    type: "binary",
    options: [
      { label: "Yes", percentage: 88 },
      { label: "No", percentage: 12 },
    ]
  },
  {
    id: "7",
    title: "Highest priority feature for V2?",
    description: "Feature prioritization.",
    category: "Product",
    endDate: "Dec 1",
    engagement: "22K",
    participants: 4500,
    type: "multiple",
    trend: "neutral",
    options: [
      { label: "Analytics", percentage: 45 },
      { label: "Collaboration", percentage: 35 },
      { label: "Mobile App", percentage: 20 },
    ]
  },
  {
    id: "8",
    title: "Competitor X acquisition impact on churn?",
    description: "Market analysis.",
    category: "Strategy",
    endDate: "Nov 30",
    engagement: "9K",
    consensus: 15,
    trend: "down",
    participants: 300,
    type: "binary",
    options: [
      { label: "High Impact", percentage: 15 },
      { label: "Low Impact", percentage: 85 },
    ]
  }
];

export const MOCK_LEADERBOARD: UserRank[] = [
  { rank: 1, name: "Sarah Chen", impactScore: "42,500", accuracy: 88, contributions: "120K", badge: "Oracle" },
  { rank: 2, name: "Mike Ross", impactScore: "38,200", accuracy: 75, contributions: "95K", badge: "Strategist" },
  { rank: 3, name: "Jessica P.", impactScore: "31,000", accuracy: 82, contributions: "88K" },
  { rank: 4, name: "David Kim", impactScore: "28,400", accuracy: 65, contributions: "150K", badge: "Whale" },
  { rank: 5, name: "Alex V.", impactScore: "22,100", accuracy: 70, contributions: "60K" },
  { rank: 6, name: "Emily R.", impactScore: "19,800", accuracy: 79, contributions: "45K" },
  { rank: 7, name: "Tom H.", impactScore: "15,300", accuracy: 62, contributions: "72K" },
  { rank: 8, name: "Lisa W.", impactScore: "12,900", accuracy: 74, contributions: "38K" },
  { rank: 9, name: "Ryan G.", impactScore: "10,500", accuracy: 68, contributions: "42K" },
  { rank: 10, name: "Kevin B.", impactScore: "9,200", accuracy: 55, contributions: "80K" },
];
