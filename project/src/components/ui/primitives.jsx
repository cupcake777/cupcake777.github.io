import { uiTokens } from "./tokens"

export function AppFrame({ children, style = {} }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: uiTokens.color.base,
        color: uiTokens.color.textStrong,
        fontFamily: uiTokens.font.body,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Container({ children, width = 1120, style = {} }) {
  return (
    <div
      style={{
        width: "min(100%, 100%)",
        maxWidth: width,
        margin: "0 auto",
        paddingInline: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Surface({ children, style = {}, tint = false, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: tint ? uiTokens.color.accentSoft : uiTokens.color.surface,
        border: `1px solid ${tint ? uiTokens.color.accentBorder : uiTokens.color.surfaceBorder}`,
        borderRadius: uiTokens.radius.lg,
        boxShadow: uiTokens.shadow.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionEyebrow({ children, style = {} }) {
  return (
    <div
      style={{
        fontFamily: uiTokens.font.mono,
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: uiTokens.color.accent,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PageTitle({ children, style = {} }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: uiTokens.font.heading,
        fontSize: "clamp(2rem, 4vw, 3.8rem)",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: uiTokens.color.textStrong,
        ...style,
      }}
    >
      {children}
    </h1>
  )
}

export function SectionTitle({ children, style = {} }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: uiTokens.font.heading,
        fontSize: 24,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: uiTokens.color.textStrong,
        ...style,
      }}
    >
      {children}
    </h2>
  )
}

export function BodyText({ children, style = {} }) {
  return (
    <p
      style={{
        margin: 0,
        color: uiTokens.color.textMuted,
        fontSize: 16,
        lineHeight: 1.6,
        ...style,
      }}
    >
      {children}
    </p>
  )
}

export function Badge({ children, tone = "accent", style = {} }) {
  const accent = tone === "muted" ? uiTokens.color.surfaceBorder : uiTokens.color.accentBorder
  const color = tone === "muted" ? uiTokens.color.textMuted : uiTokens.color.accentStrong
  const background = tone === "muted" ? uiTokens.color.surface : uiTokens.color.accentSoft

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: uiTokens.radius.pill,
        border: `1px solid ${accent}`,
        background,
        color,
        fontFamily: uiTokens.font.mono,
        fontSize: 12,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function buttonBase(full) {
  return {
    width: full ? "100%" : undefined,
    minHeight: 46,
    padding: "12px 18px",
    borderRadius: uiTokens.radius.md,
    fontSize: 15,
    lineHeight: 1,
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "transform 0.16s ease, border-color 0.16s ease, background 0.16s ease",
    fontFamily: uiTokens.font.body,
    fontWeight: 600,
  }
}

export function PrimaryButton({ children, full = false, style = {}, ...props }) {
  return (
    <button
      {...props}
      style={{
        ...buttonBase(full),
        color: "#fff",
        background: uiTokens.color.accent,
        boxShadow: "0 10px 24px rgba(44, 140, 114, 0.22)",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, full = false, style = {}, ...props }) {
  return (
    <button
      {...props}
      style={{
        ...buttonBase(full),
        color: uiTokens.color.accentStrong,
        background: uiTokens.color.surface,
        borderColor: uiTokens.color.surfaceBorder,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, style = {}, ...props }) {
  return (
    <button
      {...props}
      style={{
        background: "transparent",
        border: "none",
        color: uiTokens.color.accentStrong,
        cursor: "pointer",
        padding: 0,
        font: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children, style = {} }) {
  return (
    <label style={{ display: "grid", gap: 8, ...style }}>
      <span
        style={{
          display: "grid",
          gap: 4,
        }}
      >
        <span
          style={{
            color: uiTokens.color.textStrong,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {label}
        </span>
        {hint ? (
          <span
            style={{
              color: uiTokens.color.textMuted,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  )
}

export function TextInput({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        minHeight: 46,
        padding: "12px 14px",
        borderRadius: uiTokens.radius.md,
        border: `1px solid ${uiTokens.color.surfaceBorder}`,
        background: uiTokens.color.surface,
        color: uiTokens.color.textStrong,
        fontFamily: uiTokens.font.body,
        fontSize: 15,
        boxSizing: "border-box",
        outline: "none",
        ...style,
      }}
    />
  )
}

export function TextArea({ style = {}, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 120,
        padding: "12px 14px",
        borderRadius: uiTokens.radius.md,
        border: `1px solid ${uiTokens.color.surfaceBorder}`,
        background: uiTokens.color.surface,
        color: uiTokens.color.textStrong,
        fontFamily: uiTokens.font.body,
        fontSize: 15,
        lineHeight: 1.6,
        boxSizing: "border-box",
        resize: "vertical",
        outline: "none",
        ...style,
      }}
    />
  )
}

export function Metric({ label, value, style = {} }) {
  return (
    <Surface style={{ padding: 16, ...style }}>
      <div style={{ display: "grid", gap: 6 }}>
        <span
          style={{
            color: uiTokens.color.textMuted,
            fontSize: 13,
          }}
        >
          {label}
        </span>
        <strong
          style={{
            color: uiTokens.color.textStrong,
            fontFamily: uiTokens.font.heading,
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          {value}
        </strong>
      </div>
    </Surface>
  )
}
