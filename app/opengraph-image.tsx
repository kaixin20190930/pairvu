import { ImageResponse } from "next/og";

export const alt = "Pairvu AI product image checker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f7faf9",
          color: "#162023",
          padding: "72px 84px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 760 }}>
          <div style={{ color: "#0f766e", fontSize: 30, fontWeight: 700 }}>PAIRVU</div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            Did AI change your product?
          </div>
          <div style={{ display: "flex", marginTop: 28, color: "#5d676b", fontSize: 30, lineHeight: 1.4 }}>
            Quality control for AI product photography.
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", width: 250, height: 310 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 25,
              width: 170,
              height: 240,
              borderRadius: 18,
              background: "#162023",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 170,
              height: 240,
              border: "8px solid #f7faf9",
              borderRadius: 18,
              background: "#1d4ed8",
              color: "#ffffff",
              fontSize: 90,
              fontWeight: 700,
            }}
          >
            V
          </div>
        </div>
      </div>
    ),
    size,
  );
}
