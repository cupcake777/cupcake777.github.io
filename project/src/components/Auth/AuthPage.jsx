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
import { MOTION, EASE } from "../ui/motion"
import { motion, AnimatePresence } from "framer-motion"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

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
        <motion.div variants={panelVariants} initial="hidden" animate="visible">
          <Surface
            tint
            style={{
              padding: 28,
              boxShadow: "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 20 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <SectionEyebrow>// auth</SectionEyebrow>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <PageTitle style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
                  第一次先注册，之后回来默认直接进入工作台。
                </PageTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BodyText style={{ fontSize: 18 }}>
                  登录页不再是首页的唯一入口。它只是账户入口层，真正的主界面会在登录后切到更克制的薄荷绿工作台。
                </BodyText>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
              >
                <Badge>注册优先</Badge>
                <Badge>设备会话自动进入</Badge>
                <Badge tone="muted">退出后再手动登录</Badge>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Surface style={{ padding: 20 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <SectionTitle style={{ fontSize: 20 }}>进入后你会看到什么</SectionTitle>
                    <BodyText>顶栏是工具菜单，底部是一级导航，默认直接落到"今日"。</BodyText>
                    <BodyText>核心任务只有两件：先记一条，再顺手回看本周。</BodyText>
                  </div>
                </Surface>
              </motion.div>
              {onBack ? (
                <motion.button
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
                </motion.button>
              ) : null}
            </div>
          </Surface>
        </motion.div>

        <motion.div variants={formVariants} initial="hidden" animate="visible">
          <Surface
            style={{
              padding: 28,
              boxShadow: "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <SectionEyebrow>
                    {mode === "register" ? "// register" : "// login"}
                  </SectionEyebrow>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <SectionTitle>
                    {mode === "register" ? "创建你的记录空间" : "登录到当前设备"}
                  </SectionTitle>
                </motion.div>
              </div>

              <div style={{ position: "relative", padding: 4 }}>
                <motion.div
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
                    <motion.button
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
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
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
                </motion.div>
              </AnimatePresence>
            </div>
          </Surface>
        </motion.div>
      </Container>
    </AppFrame>
  )
}
