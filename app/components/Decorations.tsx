/** Small, purely decorative scrapbook pieces. All are aria-hidden and ignore pointer events. */

export function Tape({ tone = "beige", corner = false }: { tone?: "beige" | "rose" | "sage"; corner?: boolean }) {
  const toneClass = tone === "rose" ? "tape-rose" : tone === "sage" ? "tape-sage" : "";
  return <span aria-hidden="true" className={`tape ${toneClass} ${corner ? "tape-corner" : ""}`} />;
}

export function Star({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden="true" className={`sticker ${className}`} width={size} height={size} viewBox="0 0 32 32">
      <path
        d="M16 3.5c.9 5.6 2.9 9.4 9.6 12.1-6.7 2.7-8.7 6.5-9.6 12.9-.9-6.4-2.9-10.2-9.6-12.9C13.1 12.9 15.1 9.1 16 3.5Z"
        fill="var(--color-gold)"
        fillOpacity=".85"
      />
    </svg>
  );
}

export function Flower({ className = "", size = 34 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden="true" className={`sticker ${className}`} width={size} height={size} viewBox="0 0 40 40">
      <g fill="var(--color-rose)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="20" cy="10.5" rx="5.6" ry="8.5" transform={`rotate(${r} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="20" r="4.6" fill="var(--color-gold)" />
    </svg>
  );
}

export function Stamp({ top, bottom, className = "" }: { top: string; bottom: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={`sticker ${className}`} width="104" height="104" viewBox="0 0 104 104">
      <defs>
        <path id="stamp-top" d="M18 52a34 34 0 0 1 68 0" />
        <path id="stamp-bottom" d="M14 52a38 38 0 0 0 76 0" />
      </defs>
      <g fill="none" stroke="var(--color-sage)" strokeWidth="1.6" opacity=".9">
        <circle cx="52" cy="52" r="47" strokeDasharray="3 3" />
        <circle cx="52" cy="52" r="41" />
        <circle cx="52" cy="52" r="23" />
      </g>
      <g fill="var(--color-sage)" fontFamily="var(--font-sans)" fontSize="9" fontWeight="600" letterSpacing="2.2">
        <text>
          <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">{top.toUpperCase()}</textPath>
        </text>
        <text>
          <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">{bottom.toUpperCase()}</textPath>
        </text>
      </g>
      {/* mortarboard */}
      <g fill="var(--color-sage)">
        <path d="M52 42 36 49l16 7 16-7-16-7Z" />
        <path d="M43 53v5.5c0 1.8 4 3.5 9 3.5s9-1.7 9-3.5V53l-9 4-9-4Z" />
        <path d="M66 50v8" stroke="var(--color-sage)" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

/** Hand-drawn underline for headings. */
export function Squiggle({ className = "", color = "var(--color-rose)" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" className={`sticker ${className}`} viewBox="0 0 220 14" preserveAspectRatio="none">
      <path
        d="M3 9.5c22-6 41-6 58-2.5s34 4 52 0 38-5.5 56-2 30 3.5 48 0"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Torn-paper section edge. `flip` turns it upside down for the bottom of a section. */
export function TornEdge({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`torn-edge ${className}`}
      viewBox="0 0 1200 22"
      preserveAspectRatio="none"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      <path
        fill="currentColor"
        d="M0 22V10L29 10L50 7L78 10L98 14L129 9L153 13L185 5L214 7L247 6L277 9L299 5L338 15L359 9L398 6L425 10L458 7L480 15L508 7L538 8L559 13L585 8L605 14L628 14L656 7L687 8L722 11L743 6L771 5L790 9L823 11L862 8L890 9L918 13L946 9L970 7L1004 5L1028 12L1065 15L1103 13L1137 11L1167 4L1192 8L1200 8V22Z"
      />
    </svg>
  );
}

export function PaperClip({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`sticker ${className}`} width="22" height="52" viewBox="0 0 22 52">
      <path
        d="M16 14v24a5 5 0 0 1-10 0V9a3.5 3.5 0 0 1 7 0v26a1.6 1.6 0 0 1-3.2 0V14"
        fill="none"
        stroke="var(--color-ink-soft)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
