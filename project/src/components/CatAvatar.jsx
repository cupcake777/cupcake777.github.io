import { useEffect, useId, useState } from "react"
import {
  CircleCheck,
  Droplets,
  Flame,
  Heart,
  MessageCircleQuestionMark,
  MoonStar,
  Sparkles,
  Star,
} from "lucide-react"
import { resolveCatExpression } from "../lib/catAvatar"

const DECORATION_ICONS = {
  heart: Heart,
  sparkles: Sparkles,
  star: Star,
  "moon-star": MoonStar,
  droplets: Droplets,
  flame: Flame,
  "message-circle-question": MessageCircleQuestionMark,
  "circle-check": CircleCheck,
}

function EyePair({ variant, blink }) {
  if (blink) {
    return (
      <>
        <path d="M 42 46 Q 48 49 54 46" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M 66 46 Q 72 49 78 46" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </>
    )
  }

  switch (variant) {
    case "smile":
      return (
        <>
          <path d="M 42 48 Q 48 41 54 48" stroke="#2C3E50" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 66 48 Q 72 41 78 48" stroke="#2C3E50" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )
    case "focus":
      return (
        <>
          <ellipse cx="48" cy="46" rx="4.6" ry="6.4" fill="#2C3E50" />
          <ellipse cx="72" cy="46" rx="4.6" ry="6.4" fill="#2C3E50" />
          <circle cx="49.4" cy="43.6" r="1.1" fill="#fff" opacity="0.9" />
          <circle cx="73.4" cy="43.6" r="1.1" fill="#fff" opacity="0.9" />
        </>
      )
    case "sleepy":
      return (
        <>
          <path d="M 43 46 H 53" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 67 46 H 77" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    case "wide":
      return (
        <>
          <ellipse cx="48" cy="46" rx="5.4" ry="6.6" fill="#FFF9F3" stroke="#2C3E50" strokeWidth="1.6" />
          <ellipse cx="72" cy="46" rx="5.4" ry="6.6" fill="#FFF9F3" stroke="#2C3E50" strokeWidth="1.6" />
          <circle cx="48" cy="46" r="2.1" fill="#2C3E50" />
          <circle cx="72" cy="46" r="2.1" fill="#2C3E50" />
        </>
      )
    case "angry":
      return (
        <>
          <path d="M 43 48 L 53 44" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 67 44 L 77 48" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 43 41 L 54 39" stroke="#8C5E47" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
          <path d="M 66 39 L 77 41" stroke="#8C5E47" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
        </>
      )
    case "spark":
      return (
        <>
          <text x="48" y="50" textAnchor="middle" fontSize="10" fill="#2C3E50" fontWeight="700">
            ✦
          </text>
          <text x="72" y="50" textAnchor="middle" fontSize="10" fill="#2C3E50" fontWeight="700">
            ✦
          </text>
        </>
      )
    case "thinking":
      return (
        <>
          <path d="M 42 47 Q 48 43 54 47" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="72" cy="46" rx="3.5" ry="5.4" fill="#2C3E50" />
          <circle cx="73.2" cy="44" r="0.9" fill="#fff" opacity="0.85" />
        </>
      )
    case "bright":
      return (
        <>
          <path d="M 42 47 Q 48 41 54 47" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 66 47 Q 72 41 78 47" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="48" cy="43" r="1.2" fill="#fff" opacity="0.9" />
          <circle cx="72" cy="43" r="1.2" fill="#fff" opacity="0.9" />
        </>
      )
    case "soft":
    default:
      return (
        <>
          <path d="M 42 47 Q 48 43 54 47" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 66 47 Q 72 43 78 47" stroke="#2C3E50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      )
  }
}

function Mouth({ variant }) {
  switch (variant) {
    case "smile":
      return (
        <path
          d="M 52 58 Q 60 66 68 58"
          stroke="#FF8533"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case "open-smile":
      return (
        <>
          <path
            d="M 52 58 Q 60 67 68 58"
            stroke="#FF8533"
            strokeWidth="2.2"
            fill="#fff1ea"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 56 62 Q 60 65 64 62" stroke="#F28FA7" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </>
      )
    case "neutral":
      return <path d="M 54 59 H 66" stroke="#FF8533" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    case "wobble":
      return (
        <path
          d="M 52 60 Q 55 58 58 60 Q 61 62 64 60 Q 67 58 69 60"
          stroke="#FF8533"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )
    case "frown":
      return (
        <path
          d="M 52 62 Q 60 56 68 62"
          stroke="#FF8533"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case "o":
      return <ellipse cx="60" cy="60" rx="3.5" ry="4.3" fill="none" stroke="#FF8533" strokeWidth="2" />
    case "soft-smile":
    default:
      return (
        <>
          <path d="M 60 54 L 60 58" stroke="#FF8533" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 60 58 Q 55 61 50 58" stroke="#FF8533" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 60 58 Q 65 61 70 58" stroke="#FF8533" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )
  }
}

function DecorationLayer({ decorations, size }) {
  return decorations.map((item, index) => {
    const Icon = DECORATION_ICONS[item.icon]
    if (!Icon) return null

    return (
      <span
        key={`${item.icon}-${index}`}
        style={{
          position: "absolute",
          left: `${(item.x / 120) * 100}%`,
          top: `${(item.y / 120) * 100}%`,
          transform: `translate(-50%, -50%) rotate(${item.rotate || 0}deg)`,
          color: item.color,
          opacity: item.opacity ?? 1,
          pointerEvents: "none",
        }}
      >
        <Icon size={size * 0.2 * (item.scale || 1)} strokeWidth={2.1} />
      </span>
    )
  })
}

export function CatAvatar({ mood = "calm", expression = null, size = 120 }) {
  const [blink, setBlink] = useState(false)
  const [tailWag, setTailWag] = useState(0)
  const idPrefix = useId().replace(/:/g, "")
  const gradientId = `${idPrefix}-cat-gradient`
  const expressionConfig = resolveCatExpression({ mood, expression })

  useEffect(() => {
    let closeTimer = null
    let openTimer = null

    const scheduleBlink = () => {
      openTimer = setTimeout(() => {
        setBlink(true)
        closeTimer = setTimeout(() => {
          setBlink(false)
          scheduleBlink()
        }, 150)
      }, 3000 + Math.random() * 2000)
    }

    scheduleBlink()
    return () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  useEffect(() => {
    const wagTimer = setInterval(() => {
      setTailWag((prev) => (prev === 0 ? 1 : 0))
    }, 1200)
    return () => clearInterval(wagTimer)
  }, [])

  const tailAngle = expressionConfig.tail + tailWag * 8

  return (
    <div style={{ width: size, height: size, position: "relative", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}>
      <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD4A3" />
            <stop offset="100%" stopColor="#FFB366" />
          </linearGradient>
        </defs>

        <g style={{
          transformOrigin: "88px 78px",
          transform: `rotate(${tailAngle}deg)`,
          transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 88 78 Q 100 65 108 48 Q 110 42 112 38"
                stroke={`url(#${gradientId})`}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </g>

        <ellipse cx="60" cy="78" rx="38" ry="32" fill={`url(#${gradientId})`} />
        <circle cx="60" cy="48" r="34" fill={`url(#${gradientId})`} />

        <g style={{
          transformOrigin: "42px 22px",
          transform: `rotate(${expressionConfig.ears}deg)`,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 42 28 L 32 8 L 48 22 Z" fill={`url(#${gradientId})`} />
          <path d="M 42 26 L 38 14 L 46 22 Z" fill="#FFE4C4" opacity="0.6" />
        </g>
        <g style={{
          transformOrigin: "78px 22px",
          transform: `rotate(${-expressionConfig.ears}deg)`,
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <path d="M 78 28 L 88 8 L 72 22 Z" fill={`url(#${gradientId})`} />
          <path d="M 78 26 L 82 14 L 74 22 Z" fill="#FFE4C4" opacity="0.6" />
        </g>

        <ellipse cx="42" cy="52" rx="8" ry="6" fill="#FFB3BA" opacity={expressionConfig.cheeks * 0.4} />
        <ellipse cx="78" cy="52" rx="8" ry="6" fill="#FFB3BA" opacity={expressionConfig.cheeks * 0.4} />
        <ellipse cx="60" cy="54" rx="4" ry="3" fill="#FF8FA3" />

        <EyePair variant={expressionConfig.face.eyes} blink={blink} />
        <Mouth variant={expressionConfig.face.mouth} />

        <g opacity="0.7">
          <line x1="32" y1="48" x2="15" y2="44" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="52" x2="15" y2="52" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="56" x2="15" y2="60" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="48" x2="105" y2="44" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="52" x2="105" y2="52" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="88" y1="56" x2="105" y2="60" stroke="#FF8533" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
      <DecorationLayer decorations={expressionConfig.decorations} size={size} />
    </div>
  )
}
