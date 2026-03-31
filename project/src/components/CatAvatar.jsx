import { useEffect, useState } from "react"

const MOODS = {
  happy: { ears: -15, eyes: "^_^", tail: 25, cheeks: 1 },
  calm: { ears: 0, eyes: "◠_◠", tail: 8, cheeks: 0.6 },
  tired: { ears: -8, eyes: "-_-", tail: -5, cheeks: 0.4 },
  excited: { ears: -20, eyes: "✧_✧", tail: 40, cheeks: 1.2 },
}

export function CatAvatar({ mood = "calm", size = 120 }) {
  const [blink, setBlink] = useState(false)
  const [tailWag, setTailWag] = useState(0)
  const config = MOODS[mood] || MOODS.calm

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(blinkTimer)
  }, [])

  useEffect(() => {
    const wagTimer = setInterval(() => {
      setTailWag((prev) => (prev === 0 ? 1 : 0))
    }, 1200)
    return () => clearInterval(wagTimer)
  }, [])

  const tailAngle = config.tail + (tailWag * 8)

  return (
    <div style={{ width: size, height: size, position: "relative", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}>
      <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id="catGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD4A3" />
            <stop offset="100%" stopColor="#FFB366" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 尾巴 */}
        <g style={{
          transformOrigin: "88px 78px",
          transform: `rotate(${tailAngle}deg)`,
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 88 78 Q 100 65 108 48 Q 110 42 112 38"
                stroke="url(#catGradient)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </g>

        {/* 身体 */}
        <ellipse cx="60" cy="78" rx="38" ry="32" fill="url(#catGradient)" />

        {/* 头部 */}
        <circle cx="60" cy="48" r="34" fill="url(#catGradient)" />

        {/* 耳朵 */}
        <g style={{
          transformOrigin: "42px 22px",
          transform: `rotate(${config.ears}deg)`,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 42 28 L 32 8 L 48 22 Z" fill="url(#catGradient)" />
          <path d="M 42 26 L 38 14 L 46 22 Z" fill="#FFE4C4" opacity="0.6" />
        </g>
        <g style={{
          transformOrigin: "78px 22px",
          transform: `rotate(${-config.ears}deg)`,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 78 28 L 88 8 L 72 22 Z" fill="url(#catGradient)" />
          <path d="M 78 26 L 82 14 L 74 22 Z" fill="#FFE4C4" opacity="0.6" />
        </g>

        {/* 脸颊腮红 */}
        <ellipse cx="42" cy="52" rx="8" ry="6" fill="#FFB3BA" opacity={config.cheeks * 0.4} />
        <ellipse cx="78" cy="52" rx="8" ry="6" fill="#FFB3BA" opacity={config.cheeks * 0.4} />

        {/* 鼻子 */}
        <ellipse cx="60" cy="54" rx="4" ry="3" fill="#FF8FA3" />

        {/* 嘴巴 */}
        <path d="M 60 54 L 60 58 M 60 58 Q 54 60 50 58 M 60 58 Q 66 60 70 58"
              stroke="#FF8533"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round" />

        {/* 胡须 */}
        <g opacity="0.7">
          <line x1="32" y1="48" x2="15" y2="44" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="52" x2="15" y2="52" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="56" x2="15" y2="60" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="48" x2="105" y2="44" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="52" x2="105" y2="52" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="56" x2="105" y2="60" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 眼睛底色 */}
        {!blink && (
          <>
            <ellipse cx="48" cy="46" rx="6" ry="7" fill="#FFF" opacity="0.9" />
            <ellipse cx="72" cy="46" rx="6" ry="7" fill="#FFF" opacity="0.9" />
          </>
        )}
      </svg>

      {/* 眼睛表情 */}
      <div style={{
        position: "absolute",
        top: "34%",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: size * 0.16,
        fontWeight: "600",
        color: "#2C3E50",
        transition: "all 0.15s ease-out",
        opacity: blink ? 0.4 : 1,
        letterSpacing: size * 0.08,
        textShadow: "0 1px 2px rgba(255,255,255,0.8)",
      }}>
        {blink ? "- -" : config.eyes}
      </div>
    </div>
  )
}
