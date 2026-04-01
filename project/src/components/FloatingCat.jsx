import { useEffect, useRef, useState } from "react"
import { CatAvatar } from "./CatAvatar"
import { AnimatePresence, motion } from "framer-motion"

const MESSAGES = {
  idle: ["喵~ 今天过得怎么样？", "记得休息一下哦", "要不要记录一下现在的状态？"],
  saved: ["太棒了！记录已保存", "喵~ 又完成一条记录", "做得很好！"],
  welcome: ["欢迎回来！", "喵~ 很高兴见到你", "今天也要加油哦！"],
}

export function FloatingCat({ records }) {
  const [message, setMessage] = useState("")
  const [show, setShow] = useState(false)
  const [expression, setExpression] = useState("welcome")
  const previousCount = useRef(records.length)
  const MotionDiv = motion.div
  const currentMood = records[0]?.mood || "calm"

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true)
      setExpression("welcome")
      setMessage(MESSAGES.welcome[Math.floor(Math.random() * MESSAGES.welcome.length)])
      setTimeout(() => {
        setMessage("")
        setExpression(null)
      }, 3000)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let triggerTimer = null
    let resetTimer = null

    if (previousCount.current > 0 && records.length > previousCount.current) {
      triggerTimer = setTimeout(() => {
        setExpression("saved")
        setMessage(MESSAGES.saved[Math.floor(Math.random() * MESSAGES.saved.length)])
      }, 0)
      resetTimer = setTimeout(() => {
        setMessage("")
        setExpression(null)
      }, 3000)
    }
    previousCount.current = records.length
    return () => {
      clearTimeout(triggerTimer)
      clearTimeout(resetTimer)
    }
  }, [records.length])

  if (!show) return null

  return (
    <MotionDiv
      style={{
        position: "fixed",
        bottom: 120,
        right: 20,
        zIndex: 50,
        cursor: "pointer",
      }}
      animate={{
        y: [0, -12, 0],
        rotate: [0, -2, 0, 2, 0],
      }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] },
        rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95 }}
    >
      <CatAvatar mood={currentMood} expression={expression} size={64} />
      <AnimatePresence>
        {message && (
          <MotionDiv
            initial={{ opacity: 0, y: 10, scale: 0.85, x: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.85 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: 12,
              background: "linear-gradient(135deg, rgba(255, 253, 250, 0.98), rgba(255, 248, 240, 0.98))",
              padding: "10px 14px",
              borderRadius: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
              fontSize: 13,
              whiteSpace: "nowrap",
              border: "1px solid rgba(255, 179, 102, 0.2)",
              fontWeight: 500,
              color: "#2C3E50",
            }}
          >
            {message}
            <div style={{
              position: "absolute",
              bottom: -6,
              right: 20,
              width: 12,
              height: 12,
              background: "rgba(255, 253, 250, 0.98)",
              transform: "rotate(45deg)",
              borderRight: "1px solid rgba(255, 179, 102, 0.2)",
              borderBottom: "1px solid rgba(255, 179, 102, 0.2)",
            }} />
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>
  )
}
