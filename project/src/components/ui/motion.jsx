import { motion } from "framer-motion"

// Animation constants
export const MOTION = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  stagger: 80,
}

// Easing curves
export const EASE = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  spring: { stiffness: 120, damping: 20 },
  snappy: { stiffness: 300, damping: 30 },
}

// Animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.normal / 1000, ease: EASE.out },
  },
}

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION.normal / 1000, ease: EASE.out },
  },
}

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION.normal / 1000, ease: EASE.out },
  },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION.normal / 1000 },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION.normal / 1000, ease: EASE.out },
  },
}

// Stagger children container
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION.stagger / 1000,
    },
  },
}

// Scroll reveal wrapper
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  distance = 20,
  duration = MOTION.normal,
  once = true,
  style = {},
  ...props
}) {
  const variants = {
    up: fadeInUp,
    down: { ...fadeInUp, hidden: { ...fadeInUp.hidden, y: -distance } },
    left: fadeInLeft,
    right: fadeInRight,
    none: fadeIn,
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={{
        ...variants[direction],
        hidden: {
          ...variants[direction].hidden,
          transition: { delay: delay / 1000 },
        },
        visible: {
          ...variants[direction].visible,
          transition: {
            ...variants[direction].visible.transition,
            delay: delay / 1000,
            duration: duration / 1000,
          },
        },
      }}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger reveal for lists
export function StaggerReveal({
  children,
  delay = 0,
  stagger = MOTION.stagger,
  style = {},
  ...props
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Button hover animation wrapper
export function MotionButton({ children, style = {}, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Card hover animation wrapper
export function MotionCard({ children, style = {}, ...props }) {
  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} style={style} {...props}>
      {children}
    </motion.div>
  )
}

// Layout transition for tabs
export function TabTransition({ children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: MOTION.fast / 1000 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Check for reduced motion preference
export function usePrefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

// Motion-safe version of reveal
export function SafeReveal({ children, disabled, ...props }) {
  const reduced = usePrefersReducedMotion()

  if (reduced || disabled) {
    return <div style={{}}>{children}</div>
  }

  return <Reveal {...props}>{children}</Reveal>
}
