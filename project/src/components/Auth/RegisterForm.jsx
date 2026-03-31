import { useState } from "react"

const serif = "'Noto Serif SC',serif"
const accent = "#c4a882"
const accentDark = "#7a5c45"
const textMain = "#5c4033"
const textMid = "#9e8472"

export function RegisterForm({ onRegister, onSwitchToLogin, loading, error }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致")
      return
    }
    if (password.length < 6) {
      setLocalError("密码至少需要6个字符")
      return
    }
    setLocalError("")
    onRegister(email, password)
  }

  const displayError = localError || error

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
          密码（至少6个字符）
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
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
          确认密码
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
      {displayError && (
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
          {displayError}
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
        {loading ? "注册中..." : "注册 🐾"}
      </button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          type="button"
          onClick={onSwitchToLogin}
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
          已有账号？去登录
        </button>
      </div>
    </form>
  )
}
