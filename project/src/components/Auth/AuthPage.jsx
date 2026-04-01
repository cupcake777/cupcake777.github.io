import { useState } from "react"
import { AUTH_FLOW } from "../../config/site"
import {
  AppFrame,
  Badge,
  BodyText,
  Container,
  PageTitle,
  SectionEyebrow,
  SectionTitle,
  Surface,
} from "../ui/primitives"
import { uiTokens } from "../ui/tokens"
import { EASE } from "../ui/motionTokens"
import { motion, AnimatePresence } from "framer-motion"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

const MotionDiv = motion.div
const MotionButton = motion.button

const panelVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE.out } },
}

const formVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE.out, delay: 0.1 } },
}

const tabIndicatorVariants = {
  register: { left: "4px", width: "calc(50% - 4px)" },
  login: { left: "calc(50% + 4px)", width: "calc(50% - 4px)" },
}

const contentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function AuthPage({ onLogin, onRegister, loading, error, onBack, defaultMode }) {
  const [mode, setMode] = useState(defaultMode || AUTH_FLOW.defaultMode)

  return (
    <AppFrame>
      <Container
        style={{
          minHeight: "100dvh",
          display: "grid",
          alignItems: "center",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          paddingBlock: 32,
        }}
      >
        <MotionDiv variants={panelVariants} initial="hidden" animate="visible">
          <Surface
            tint
            style={{
              padding: 28,
              boxShadow: "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 20 }}>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <SectionEyebrow>// auth</SectionEyebrow>
              </MotionDiv>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <PageTitle style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
                  注册一次，之后自动进入。
                </PageTitle>
              </MotionDiv>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BodyText style={{ fontSize: 18 }}>
                  设备会话持久化，无需每次登录。工作台采用克制的薄荷绿配色。
                </BodyText>
              </MotionDiv>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
              >
                <Badge>Register first</Badge>
                <Badge>Auto session</Badge>
                <Badge tone="muted">Manual login after logout</Badge>
              </MotionDiv>
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Surface style={{ padding: 20 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <SectionTitle style={{ fontSize: 20 }}>After login</SectionTitle>
                    <BodyText>默认落在"今日"页面，顶栏工具菜单，底部一级导航。</BodyText>
                    <BodyText>记录当下，回看本周。</BodyText>
                  </div>
                </Surface>
              </MotionDiv>
              {onBack ? (
                <MotionButton
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  onClick={onBack}
                  whileHover={{ x: -4 }}
                  style={{
                    justifySelf: "start",
                    background: "transparent",
                    border: "none",
                    color: uiTokens.color.accentStrong,
                    fontSize: 14,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  返回公开首页
                </MotionButton>
              ) : null}
            </div>
          </Surface>
        </MotionDiv>

        <MotionDiv variants={formVariants} initial="hidden" animate="visible">
          <Surface
            style={{
              padding: 28,
              boxShadow: "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <SectionEyebrow>
                    {mode === "register" ? "// register" : "// login"}
                  </SectionEyebrow>
                </MotionDiv>
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <SectionTitle>
                    {mode === "register" ? "Create your space" : "Login to device"}
                  </SectionTitle>
                </MotionDiv>
              </div>

              <div style={{ position: "relative", padding: 4 }}>
                <MotionDiv
                  layout
                  variants={tabIndicatorVariants}
                  initial={false}
                  animate={mode}
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    borderRadius: 14,
                    background: uiTokens.color.surface,
                    border: `1px solid ${uiTokens.color.surfaceBorder}`,
                    zIndex: 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {[
                    { key: "register", label: "注册" },
                    { key: "login", label: "登录" },
                  ].map((item) => (
                    <MotionButton
                      key={item.key}
                      onClick={() => setMode(item.key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        minHeight: 42,
                        borderRadius: 14,
                        border: "none",
                        cursor: "pointer",
                        background: "transparent",
                        color:
                          mode === item.key ? uiTokens.color.textStrong : uiTokens.color.textMuted,
                        fontWeight: mode === item.key ? 700 : 500,
                        transition: "color 0.2s",
                      }}
                    >
                      {item.label}
                    </MotionButton>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <MotionDiv
                  key={mode}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {mode === "register" ? (
                    <RegisterForm
                      onRegister={onRegister}
                      onSwitchToLogin={() => setMode("login")}
                      loading={loading}
                      error={error}
                    />
                  ) : (
                    <LoginForm
                      onLogin={onLogin}
                      onSwitchToRegister={() => setMode("register")}
                      loading={loading}
                      error={error}
                    />
                  )}
                </MotionDiv>
              </AnimatePresence>
            </div>
          </Surface>
        </MotionDiv>
      </Container>
    </AppFrame>
  )
}
