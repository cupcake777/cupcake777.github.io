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
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

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
        <Surface tint style={{ padding: 28 }}>
          <div style={{ display: "grid", gap: 20 }}>
            <SectionEyebrow>// auth</SectionEyebrow>
            <PageTitle style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
              第一次先注册，之后回来默认直接进入工作台。
            </PageTitle>
            <BodyText style={{ fontSize: 18 }}>
              登录页不再是首页的唯一入口。它只是账户入口层，真正的主界面会在登录后切到更克制的薄荷绿工作台。
            </BodyText>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge>注册优先</Badge>
              <Badge>设备会话自动进入</Badge>
              <Badge tone="muted">退出后再手动登录</Badge>
            </div>
            <Surface style={{ padding: 20 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <SectionTitle style={{ fontSize: 20 }}>进入后你会看到什么</SectionTitle>
                <BodyText>顶栏是工具菜单，底部是一级导航，默认直接落到“今日”。</BodyText>
                <BodyText>核心任务只有两件：先记一条，再顺手回看本周。</BodyText>
              </div>
            </Surface>
            {onBack ? (
              <button
                onClick={onBack}
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
              </button>
            ) : null}
          </div>
        </Surface>

        <Surface style={{ padding: 28 }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <SectionEyebrow>{mode === "register" ? "// register" : "// login"}</SectionEyebrow>
              <SectionTitle>{mode === "register" ? "创建你的记录空间" : "登录到当前设备"}</SectionTitle>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                padding: 6,
                borderRadius: 18,
                background: uiTokens.color.accentSoft,
                border: `1px solid ${uiTokens.color.accentBorder}`,
              }}
            >
              {[
                { key: "register", label: "注册" },
                { key: "login", label: "登录" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  style={{
                    minHeight: 42,
                    borderRadius: 14,
                    border: "none",
                    cursor: "pointer",
                    background: mode === item.key ? uiTokens.color.surface : "transparent",
                    color: mode === item.key ? uiTokens.color.textStrong : uiTokens.color.textMuted,
                    fontWeight: mode === item.key ? 700 : 500,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

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
          </div>
        </Surface>
      </Container>
    </AppFrame>
  )
}
