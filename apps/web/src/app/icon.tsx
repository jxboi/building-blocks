import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          background: "rgb(77 214 177)",
          color: "rgb(7 21 19)",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        BB
      </div>
    ),
    size,
  );
}
