"use client";

import { cn } from "@/lib/utils";
import {
  Footprints,
  Shield,
  Mountain,
  Moon,
  Crown,
  Sun,
  BookOpen,
  Cross,
  Bird,
  Scroll,
  BookHeart,
  Sprout,
  CircleDot,
  Loader,
  CircleDotDashed,
  Trophy,
  BookOpenCheck,
  Library,
  LucideIcon,
} from "lucide-react";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  shield: Shield,
  mountain: Mountain,
  moon: Moon,
  crown: Crown,
  sun: Sun,
  "book-open": BookOpen,
  cross: Cross,
  bird: Bird,
  scroll: Scroll,
  "book-heart": BookHeart,
  sprout: Sprout,
  "circle-dot": CircleDot,
  loader: Loader,
  "circle-dot-dashed": CircleDotDashed,
  trophy: Trophy,
  "book-open-check": BookOpenCheck,
  library: Library,
};

const SIZE_CLASSES = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
};

const ICON_SIZE_CLASSES = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-9 h-9",
};

export function AchievementBadge({
  icon,
  name,
  description,
  unlocked,
  size = "md",
  showLabel = false,
}: AchievementBadgeProps) {
  const IconComponent = ICON_MAP[icon] || Trophy;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          SIZE_CLASSES[size],
          unlocked
            ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20"
            : "bg-muted/50 opacity-40"
        )}
        title={unlocked ? `${name}: ${description}` : `Locked: ${name}`}
      >
        <IconComponent
          className={cn(
            ICON_SIZE_CLASSES[size],
            unlocked ? "text-white" : "text-muted-foreground"
          )}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs text-center max-w-[80px] leading-tight",
            unlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {name}
        </span>
      )}
    </div>
  );
}
