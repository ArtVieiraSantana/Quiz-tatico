import React from "react";

interface PlayerPosition {
  position: string;
  x: number;
  y: number;
  playerName?: string;
  isHidden?: boolean;
}

interface FootballPitchProps {
  formation: PlayerPosition[];
  className?: string;
  showNames?: boolean;
  highlightedIndex?: number;
}

const POSITION_COLORS: Record<string, string> = {
  GK: "#f59e0b",
  CB: "#3b82f6", RB: "#3b82f6", LB: "#3b82f6", SW: "#3b82f6",
  CM: "#8b5cf6", DM: "#8b5cf6", AM: "#8b5cf6", CDM: "#8b5cf6", CAM: "#8b5cf6",
  RM: "#06b6d4", LM: "#06b6d4", WM: "#06b6d4",
  RW: "#22c55e", LW: "#22c55e", ST: "#ef4444", CF: "#ef4444", SS: "#ef4444", FW: "#ef4444",
};

const getPositionColor = (pos: string) =>
  POSITION_COLORS[pos.toUpperCase()] || "#6b7280";

export const FootballPitch: React.FC<FootballPitchProps> = ({
  formation,
  className = "",
  showNames = true,
  highlightedIndex,
}) => {
  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox="0 0 100 130"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto rounded-xl"
        style={{ maxHeight: "480px" }}
      >
        <defs>
          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="50%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <pattern id="stripes" x="0" y="0" width="100" height="13" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100" height="6.5" fill="rgba(255,255,255,0.04)" />
          </pattern>
          <filter id="playerGlow">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Pitch background */}
        <rect x="0" y="0" width="100" height="130" fill="url(#pitchGrad)" rx="4" />
        <rect x="0" y="0" width="100" height="130" fill="url(#stripes)" rx="4" />

        {/* Outer border */}
        <rect x="3" y="3" width="94" height="124" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" rx="1"/>

        {/* Halfway line */}
        <line x1="3" y1="65" x2="97" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />

        {/* Center circle */}
        <circle cx="50" cy="65" r="9" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.6)" />

        {/* Top penalty area */}
        <rect x="18" y="3" width="64" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        {/* Top goal area */}
        <rect x="32" y="3" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        {/* Top goal */}
        <rect x="39" y="1" width="22" height="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />
        {/* Top penalty spot */}
        <circle cx="50" cy="16" r="0.6" fill="rgba(255,255,255,0.6)" />
        {/* Top penalty arc */}
        <path d="M 35 23 Q 50 30 65 23" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />

        {/* Bottom penalty area */}
        <rect x="18" y="107" width="64" height="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        {/* Bottom goal area */}
        <rect x="32" y="119" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        {/* Bottom goal */}
        <rect x="39" y="126" width="22" height="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />
        {/* Bottom penalty spot */}
        <circle cx="50" cy="114" r="0.6" fill="rgba(255,255,255,0.6)" />
        {/* Bottom penalty arc */}
        <path d="M 35 107 Q 50 100 65 107" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />

        {/* Corner arcs */}
        <path d="M 3 8 Q 8 3 8 3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
        <path d="M 97 8 Q 92 3 92 3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
        <path d="M 3 122 Q 8 127 8 127" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
        <path d="M 97 122 Q 92 127 92 127" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />

        {/* Player positions */}
        {formation.map((player, idx) => {
          const color = getPositionColor(player.position);
          const isHighlighted = highlightedIndex === idx;
          const r = 4.5;
          // Scale y from 0-100 to fit 5-125 range
          const py = 5 + (player.y / 100) * 120;
          const px = 3 + (player.x / 100) * 94;

          return (
            <g key={idx} filter="url(#playerGlow)">
              {/* Glow ring for highlighted */}
              {isHighlighted && (
                <circle
                  cx={px}
                  cy={py}
                  r={r + 2}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              )}
              {/* Shadow */}
              <ellipse cx={px} cy={py + r + 0.5} rx={r * 0.8} ry={0.8} fill="rgba(0,0,0,0.3)" />
              {/* Player circle */}
              <circle
                cx={px}
                cy={py}
                r={r}
                fill={color}
                stroke="white"
                strokeWidth="0.6"
                opacity="0.95"
              />
              {/* Position label */}
              <text
                x={px}
                y={py + 1.2}
                textAnchor="middle"
                fontSize="3.2"
                fill="white"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
                className="pointer-events-none"
                style={{ userSelect: "none" }}
              >
                {player.position}
              </text>
              {/* Player name below */}
              {showNames && player.playerName && (
                <text
                  x={px}
                  y={py + r + 3.5}
                  textAnchor="middle"
                  fontSize="2.4"
                  fill="rgba(255,255,255,0.9)"
                  fontFamily="Inter, system-ui, sans-serif"
                  className="pointer-events-none"
                  style={{ userSelect: "none" }}
                >
                  {player.playerName.split(" ").pop()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
