import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

export function AuthPage({ onLogin, onRegister, loading, error }) {
  const [mode, setMode] = useState("login")

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#fdf4ec,#f5e6d8,#ede0d4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}      `,
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          animation: "fadeUp .5s ease-out",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{ fontSize: 72, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}
          >
            🐱
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 24,
              color: "#5c4033",
              margin: "0 0 8px",
              fontWeight: 700,
            }}
          >
            猫猫饲养日志
          </h1>
          <p style={{ color: "#9e8472", fontSize: 14, fontFamily: "sans-serif", margin: 0 }}>
            记录每一天，陪伴每一刻
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(18px)",
            borderRadius: 22,
            border: "1px solid rgba(196,168,130,0.22)",
            boxShadow: "0 6px 28px rgba(160,120,80,0.10)",
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 24,
              background: "#f5ede4",
              borderRadius: 12,
              padding: 4,
            }}
          >
            <button
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: mode === "login" ? "white" : "transparent",
                color: mode === "login" ? "#5c4033" : "#9e8472",
                fontSize: 14,
                fontWeight: mode === "login" ? 600 : 400,
                cursor: "pointer",
                fontFamily: "sans-serif",
                transition: "all .2s",
                boxShadow: mode === "login" ? "0 2px 8px rgba(160,120,80,0.15)" : "none",
              }}
            >
              登录
            </button>
            <button
              onClick={() => setMode("register")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: mode === "register" ? "white" : "transparent",
                color: mode === "register" ? "#5c4033" : "#9e8472",
                fontSize: 14,
                fontWeight: mode === "register" ? 600 : 400,
                cursor: "pointer",
                fontFamily: "sans-serif",
                transition: "all .2s",
                boxShadow: mode === "register" ? "0 2px 8px rgba(160,120,80,0.15)" : "none",
              }}
            >
              注册
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm
              onLogin={onLogin}
              onSwitchToRegister={() => setMode("register")}
              loading={loading}
              error={error}
            />
          ) : (
            <RegisterForm
              onRegister={onRegister}
              onSwitchToLogin={() => setMode("login")}
              loading={loading}
              error={error}
            />
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "#b0a090", fontFamily: "sans-serif", lineHeight: 1.7 }}>
            数据安全存储于云端 🔒
            <br />
            仅供个人使用
          </p>
        </div>
      </div>
    </div>
  )
}
