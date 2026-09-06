"use client";

import React from "react";

interface SolarSightLogoProps {
  className?: string;
  size?: number;
}

export function SolarSightLogo({ className = "w-8 h-8", size }: SolarSightLogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="solarSunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>

      {/* Sun Core Semi-Circle */}
      <path
        d="M 40 120 A 60 60 0 0 1 160 120 Z"
        fill="url(#solarSunGradient)"
      />

      {/* Wave Horizon Line at Base */}
      <path
        d="M 10 128 Q 100 140 190 128 Q 100 134 10 128 Z"
        fill="url(#solarSunGradient)"
      />

      {/* Center Top Vertical Ray */}
      <path
        d="M 100 15 Q 104 42 100 70 Q 96 42 100 15 Z"
        fill="url(#solarSunGradient)"
      />

      {/* Left Rays */}
      <path
        d="M 70 28 Q 80 50 82 77 Q 72 54 70 28 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 42 45 Q 60 64 68 88 Q 50 72 42 45 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 22 72 Q 45 82 58 102 Q 36 94 22 72 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 10 105 Q 35 106 52 118 Q 30 116 10 105 Z"
        fill="url(#solarSunGradient)"
      />

      {/* Right Rays */}
      <path
        d="M 130 28 Q 130 54 118 77 Q 120 50 130 28 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 158 45 Q 150 72 132 88 Q 140 64 158 45 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 178 72 Q 164 94 142 102 Q 155 82 178 72 Z"
        fill="url(#solarSunGradient)"
      />
      <path
        d="M 190 105 Q 170 116 148 118 Q 165 106 190 105 Z"
        fill="url(#solarSunGradient)"
      />
    </svg>
  );
}
