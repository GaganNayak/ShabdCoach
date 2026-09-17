import { ImageResponse } from "next/og";

export const alt = "Shabd Coach — learn job English by talking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: 80,
          background: "#0b7a53",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, opacity: 0.85 }}>Shabd Coach</div>
        <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.15 }}>
          Learn English words for your job, by talking.
        </div>
        <div style={{ fontSize: 34, opacity: 0.85 }}>
          5 words · 5 minutes · English · Hinglish · Kannada
        </div>
      </div>
    ),
    size,
  );
}
