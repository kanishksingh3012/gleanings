import { ImageResponse } from "next/og";

/**
 * Generated at build time so there are no binary icon files to maintain.
 * Full-bleed square with the glyph inside the maskable safe zone (~60%).
 */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b2622",
          color: "#f9f7f3",
          fontSize: size * 0.5,
          fontWeight: 700,
          letterSpacing: -size * 0.02,
        }}
      >
        P
      </div>
    ),
    { width: size, height: size },
  );
}
