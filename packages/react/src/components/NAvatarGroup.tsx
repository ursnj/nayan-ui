import React, { ReactNode, memo } from "react";
import { AvatarGroup } from "@heroui/react";
import { cn } from "../lib/utils";
import { NAvatar } from "./NAvatar";

export interface NAvatarGroupItem {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
}

export interface NAvatarGroupProps {
  items: NAvatarGroupItem[];
  /** Avatars shown before the rest are collapsed into a count. */
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "default" | "accent" | "success" | "warning" | "danger";
  variant?: "default" | "soft";
  /** How the avatars meet: overlapping with a ring, or clipped into each other. */
  overlap?: "clip" | "ring";
  /** Lays the avatars out in a grid instead of an overlapping row. */
  isGrid?: boolean;
  className?: string;
  avatarClassName?: string;
}

const NAvatarGroupComponent: React.FC<NAvatarGroupProps> = memo(
  ({
    items,
    max,
    size = "md",
    color = "default",
    variant = "default",
    overlap = "ring",
    isGrid = false,
    className = "",
    avatarClassName = "",
  }) => {
    return (
      <AvatarGroup
        max={max}
        size={size}
        color={color}
        variant={variant}
        overlap={overlap}
        isGrid={isGrid}
        className={cn("nyn-avatar-group", className)}
      >
        {items.map((item, index) => (
          <NAvatar
            key={`${item.src ?? ""}-${index}`}
            src={item.src}
            alt={item.alt}
            fallback={item.fallback}
            size={size}
            color={color}
            variant={variant}
            className={avatarClassName}
          />
        ))}
      </AvatarGroup>
    );
  },
);

NAvatarGroupComponent.displayName = "NAvatarGroup";

export const NAvatarGroup = NAvatarGroupComponent;
