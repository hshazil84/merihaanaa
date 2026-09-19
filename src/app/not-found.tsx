import Link from "next/link";

const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const RED = "#ba2a31";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";

export default function NotFound() {
  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }} dir="rtl">
      <div style={{ textAlign: "center", maxWidth: "28rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(3rem,10vw,5rem)", color: RED, lineHeight: 1.2, fontWeight: 400, margin: 0 }}>404</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
        </div>
        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "18px", color: TEXT, lineHeight: 2, margin: "0 0 8px" }}>
          މި ސަފުހާ ނެތް
        </h2>
        <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, lineHeight: 2, margin: "0 0 24px" }}>
          ތިޔަ ހޯއްދަވާ ސަފުހާ ފެންނާކަށް ނެތް. ލިންކު ގޯސް ވެފައި ވެދާނެ، ނުވަތަ ސަފުހާ ބަދަލުވެފައި ވެދާނެ.
        </p>
        <Link href="/" style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: "white", textDecoration: "none", padding: "10px 24px", borderRadius: "999px", backgroundColor: TEXT, display: "inline-block" }}>
          {"ފުރަތަމަ ސަފުހާ އަށް ←"}
        </Link>
      </div>
    </div>
  );
}
