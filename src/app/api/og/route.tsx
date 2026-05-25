// app/api/og/route.tsx
// Dynamic OG image generator

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title    = searchParams.get("title")    ?? "މެރިހާނާ";
  const excerpt  = searchParams.get("excerpt")  ?? "";
  const image    = searchParams.get("image")    ?? "";
  const category = searchParams.get("category") ?? "";

  const logoUrl = new URL("/logo-mark.png", req.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F5F3EF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cover image */}
        {image ? (
          <div style={{ display: "flex", width: "100%", height: "370px", overflow: "hidden", position: "relative" }}>
            <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Fade to background */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "140px",
              background: "linear-gradient(to bottom, transparent, #F5F3EF)",
              display: "flex",
            }} />
          </div>
        ) : (
          <div style={{ width: "100%", height: "370px", backgroundColor: "#e8e5de", display: "flex" }} />
        )}

        {/* Text content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          padding: "16px 64px 0",
          flex: 1,
          direction: "rtl",
        }}>
          {/* Category pill */}
          {category && (
            <div style={{ display: "flex", marginBottom: "10px" }}>
              <span style={{
                fontSize: "11px",
                color: "rgb(120,118,112)",
                backgroundColor: "rgb(228,225,218)",
                padding: "3px 14px",
                borderRadius: "999px",
                fontFamily: "sans-serif",
              }}>
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: title.length > 55 ? "21px" : "25px",
            fontWeight: 700,
            color: "rgb(26,26,26)",
            lineHeight: 1.6,
            fontFamily: "sans-serif",
            marginBottom: "8px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {title}
          </div>

          {/* Excerpt */}
          {excerpt && (
            <div style={{
              fontSize: "13px",
              color: "rgb(110,108,102)",
              lineHeight: 1.6,
              fontFamily: "sans-serif",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}>
              {excerpt}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 64px 28px",
          direction: "ltr",
        }}>
          <span style={{
            fontSize: "12px",
            color: "rgb(160,158,152)",
            fontFamily: "sans-serif",
          }}>
            merihaanaa.com
          </span>

          {/* Logo mark */}
          <img
            src={logoUrl}
            alt="މެރިހާނާ"
            style={{ width: "40px", height: "40px", objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
