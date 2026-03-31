import { useEffect, useState } from "react"

const MOODS = {
  happy: { ears: "rotate(-15deg)", eyes: "^_^", tail: "rotate(20deg)" },
  calm: { ears: "rotate(0deg)", eyes: "◠_◠", tail: "rotate(5deg)" },
  tired: { ears: "rotate(-5deg)", eyes: "-_-", tail: "rotate(-10deg)" },
  excited: { ears: "rotate(-20deg)", eyes: "✧_✧", tail: "rotate(35deg)" },
}

export function CatAvatar({ mood = "calm", size = 120 }) {
  const [blink, setBlink] = useState(false)
  const config = MOODS[mood] || MOODS.calm

  useEffect(() => {
    const timer = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
        {/* 身体 */}
        <ellipse cx="60" cy="75" rx="35" ry="30" fill="#FFB366" />

        {/* 头部 */}
        <circle cx="60" cy="45" r="32" fill="#FFB366" />

        {/* 耳朵 */}
        <g style={{ transformOrigin: "45px 25px", transform: config.ears, transition: "transform 0.3s" }}>
          <path d="M 45 25 L 35 10 L 50 20 Z" fill="#FFB366" />
        </g>
        <g style={{ transformOrigin: "75px 25px", transform: config.ears.replace("-", ""), transition: "transform 0.3s" }}>
          <path d="M 75 25 L 85 10 L 70 20 Z" fill="#FFB366" />
        </g>

        {/* 脸部细节 */}
        <ellipse cx="50" cy="45" rx="3" ry="4" fill="#FF8533" />
        <ellipse cx="70" cy="45" rx="3" ry="4" fill="#FF8533" />

        {/* 鼻子 */}
        <path d="M 60 50 L 57 53 L 63 53 Z" fill="#FF6B9D" />

        {/* 嘴巴 */}
        <path d="M 60 53 Q 55 56 52 54 M 60 53 Q 65 56 68 54"
              stroke="#FF8533" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* 胡须 */}
        <line x1="35" y1="48" x2="20" y2="46" stroke="#FF8533" strokeWidth="1" />
        <line x1="35" y1="52" x2="20" y2="54" stroke="#FF8533" strokeWidth="1" />
        <line x1="85" y1="48" x2="100" y2="46" stroke="#FF8533" strokeWidth="1" />
        <line x1="85" y1="52" x2="100" y2="54" stroke="#FF8533" strokeWidth="1" />

        {/* 尾巴 */}
        <g style={{ transformOrigin: "90px 80px", transform: config.tail, transition: "transform 0.5s ease-in-out" }}>
          <path d="M 90 80 Q 105 70 110 55" stroke="#FFB366" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* 眼睛文字 */}
      <div style={{
        position: "absolute",
        top: "32%",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: size * 0.15,
        fontWeight: "bold",
        color: "#333",
        transition: "all 0.2s",
        opacity: blink ? 0.3 : 1,
      }}>
        {blink ? "- -" : config.eyes}
      </div>
    </div>
  )
}
