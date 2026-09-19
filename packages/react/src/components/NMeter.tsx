import React, { ReactNode, memo } from "react";
import { Label, Meter } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NMeterProps {
  value: number;
  minValue?: number;
  maxValue?: number;
  label?: ReactNode;
  output?: ReactNode;
  showOutput?: boolean;
  color?: "default" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
  outputClassName?: string;
  trackClassName?: string;
  fillClassName?: string;
  "aria-label"?: string;
}

const NMeterComponent: React.FC<NMeterProps> = memo(
  ({
    value,
    minValue = 0,
    maxValue = 100,
    label,
    output,
    showOutput = true,
    color = "accent",
    size = "md",
    className = "",
    labelClassName = "",
    outputClassName = "",
    trackClassName = "",
    fillClassName = "",
    "aria-label": ariaLabel,
  }) => {
    const lowerBound = Math.min(minValue, maxValue);
    const upperBound = Math.max(minValue, maxValue);
    const clampedValue = Math.min(upperBound, Math.max(lowerBound, value));
    const percentage =
      upperBound === lowerBound
        ? 0
        : Math.round(((clampedValue - lowerBound) / (upperBound - lowerBound)) * 100);

    return (
      <Meter
        value={clampedValue}
        minValue={lowerBound}
        maxValue={upperBound}
        color={color}
        size={size}
        className={cn("nyn-meter", className)}
        aria-label={ariaLabel || (label ? undefined : "Meter")}
      >
        {label && <Label className={cn("nyn-meter-label", labelClassName)}>{label}</Label>}
        {showOutput && (
          <Meter.Output className={cn("nyn-meter-output", outputClassName)}>
            {output ?? `${percentage}%`}
          </Meter.Output>
        )}
        <Meter.Track className={cn(trackClassName)}>
          <Meter.Fill className={cn(fillClassName)} />
        </Meter.Track>
      </Meter>
    );
  },
);

NMeterComponent.displayName = "NMeter";

export const NMeter = NMeterComponent;
