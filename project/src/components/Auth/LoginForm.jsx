import { useState } from "react"

const serif = "'Noto Serif SC',serif"
const accent = "#c4a882"
const accentDark = "#7a5c45"
const textMain = "#5c4033"
const textMid = "#9e8472"

export function LoginForm({ onLogin, onSwitchToRegister, loading, error }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 360 }}>
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            color: textMid,
            fontFamily: "sans-serif",
            marginBottom: 6,
            display: "block",
            fontWeight: 600,
          }}
        >
          邮箱地址
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            width: "100%",
            borderRadius: 12,
            border: "2px solid #e8d5c0",
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: "sans-serif",
            outline: "none",
            background: "#fdf8f4",
            color: textMain,
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = accent)}
          onBlur={(e) => (e.target.style.borderColor = "#e8d5c0")}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            fontSize: 12,
            color: textMid,
            fontFamily: "sans-serif",
            marginBottom: 6,
            display: "block",
            fontWeight: 600,
          }}
        >
          密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={{
            width: "100%",
            borderRadius: 12,
            border: "2px solid #e8d5c0",
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: "sans-serif",
            outline: "none",
            background: "#fdf8f4",
            color: textMain,
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = accent)}
          onBlur={(e) => (e.target.style.borderColor = "#e8d5c0")}
        />
      </div>
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            background: "#fff5f5",
            border: "1px solid #f5c8c8",
            color: "#c05050",
            fontSize: 13,
            fontFamily: "sans-serif",
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          borderRadius: 14,
          border: "none",
          background: loading ? "#e8d5c0" : "linear-gradient(135deg,#c4a882,#e8b89a)",
          color: loading ? "#b0a090" : "white",
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: serif,
          fontWeight: 600,
          padding: "14px 20px",
          transition: "all .2s",
        }}
      >
        {loading ? "登录中..." : "登录 🐾"}
      </button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: "transparent",
            border: "none",
            color: accentDark,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "sans-serif",
            textDecoration: "underline",
          }}
        >
          还没有账号？注册一个
        </button>
      </div>
    </form>
  )
}
