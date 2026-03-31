import { useState, useEffect } from "react"
import { CatAvatar } from "./CatAvatar"
import { motion, AnimatePresence } from "framer-motion"

const MESSAGES = {
  idle: ["喵~ 今天过得怎么样？", "记得休息一下哦", "要不要记录一下现在的状态？"],
  saved: ["太棒了！记录已保存", "喵~ 又完成一条记录", "做得很好！"],
  welcome: ["欢迎回来！", "喵~ 很高兴见到你", "今天也要加油哦！"],
}

export function FloatingCat({ onSave, records }) {
  const [message, setMessage] = useState("")
  const [show, setShow] = useState(false)
  const [mood, setMood] = useState("calm")

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true)
      setMessage(MESSAGES.welcome[Math.floor(Math.random() * MESSAGES.welcome.length)])
      setTimeout(() => setMessage(""), 3000)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (records.length > 0) {
      setMood(records[0]?.mood?.value || "calm")
      setMessage(MESSAGES.saved[Math.floor(Math.random() * MESSAGES.saved.length)])
      setTimeout(() => setMessage(""), 3000)
    }
  }, [records.length])

  if (!show) return null

  return (
    <motion.div
      style={{
        position: "fixed",
        bottom: 120,
        right: 20,
        zIndex: 50,
      }}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <CatAvatar mood={mood} size={60} />
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: 10,
              background: "rgba(255, 253, 250, 0.98)",
              padding: "8px 12px",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
