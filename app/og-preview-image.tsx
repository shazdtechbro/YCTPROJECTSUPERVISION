import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "YABATECH HND Project Supervision System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#f7f8f2",
          color: "#064b35",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -135,
            width: 560,
            height: 560,
            borderRadius: 280,
            backgroundColor: "#0b6b43",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: -190,
            width: 430,
            height: 430,
            borderRadius: 215,
            border: "52px solid #e6bd3a",
            opacity: 0.95,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 72px 48px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "13px 20px",
                borderRadius: 8,
                backgroundColor: "#087246",
                color: "#ffffff",
                fontSize: 25,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              YABATECH
            </div>
            <div style={{ width: 4, height: 44, backgroundColor: "#e6bd3a" }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 17, fontWeight: 800, letterSpacing: 1 }}>
              <span>PROJECT</span>
              <span>SUPERVISION</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 790 }}>
            <div
              style={{
                display: "flex",
                width: "fit-content",
                padding: "10px 16px",
                borderRadius: 6,
                backgroundColor: "#f1d564",
                color: "#124b36",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: 1.1,
              }}
            >
              HND · FINAL-YEAR PROJECTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 67, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
              <span>Supervise projects</span>
              <span>without the chaos.</span>
            </div>
            <div style={{ display: "flex", maxWidth: 720, color: "#52665c", fontSize: 24, lineHeight: 1.35 }}>
              Track milestones, review submissions and keep students, supervisors and the HOD in sync.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, color: "#ffffff", fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            {[
              ["STUDENTS", "#087246"],
              ["SUPERVISORS", "#087246"],
              ["HOD", "#e6bd3a"],
            ].map(([label, color]) => (
              <div
                key={label}
                style={{ display: "flex", padding: "12px 18px", borderRadius: 6, backgroundColor: color, color: label === "HOD" ? "#124b36" : "#ffffff" }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
