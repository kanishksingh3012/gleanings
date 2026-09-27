import { ImageResponse } from "next/og";

const BG = "#2b2622";
const STEM = "#f9f7f3";
const GRAIN = "#e2c07f";

// Grain positions along the stalk (y in a 100x100 box), mirrored left/right.
const GRAIN_ROWS = [40, 52, 64];

/**
 * Gleanings mark: a single wheat stalk — gleaning is gathering the good grain
 * left after a harvest. Drawn at build time, so there are no binary icon
 * files to maintain. Glyph stays inside the maskable safe zone (~60%).
 */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <line x1="50" y1="80" x2="50" y2="30" stroke={STEM} strokeWidth="3" strokeLinecap="round" />
          {GRAIN_ROWS.map((y) => (
            <g key={y}>
              <ellipse cx="43.5" cy={y} rx="4.5" ry="8" fill={GRAIN} transform={`rotate(-35 43.5 ${y})`} />
              <ellipse cx="56.5" cy={y} rx="4.5" ry="8" fill={GRAIN} transform={`rotate(35 56.5 ${y})`} />
            </g>
          ))}
          <ellipse cx="50" cy="27" rx="4.5" ry="8" fill={GRAIN} />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
