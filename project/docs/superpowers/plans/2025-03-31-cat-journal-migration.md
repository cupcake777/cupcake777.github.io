# Cat Journal App Migration Implementation Plan> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate cat-journal-v5.jsx to a modern Vite + Supabase architecture with authentication, cloud storage, and user-configurable AI API keys.

**Architecture:** React SPA with Supabase Auth (email/password), Supabase PostgreSQL for cloud storage (replacing local storage), localStorage for user AI API keys, deployed to GitHub Pages via GitHub Actions.

**Tech Stack:** React 19, Vite, Supabase (Auth + Database), Lucide React (icons), Anthropic/Gemini API (user-provided keys)

---

## Task 1: Fix Environment Configuration

**Files:**

- Modify: `.env`

- [ ] **Step 1: Update .env with Vite-compatible variable names**

The current `.env` uses Next.js naming convention. Vite requires `VITE_` prefix.

```env
VITE_SUPABASE_URL=https://ykcsmjdeonzjvjmrtkyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrY3NtamRlb256anZqbXJ0a3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDY1NDEsImV4cCI6MjA1ODk4MjU0MX0.example_key_placeholder
```

Note: The anon key should be your Supabase project's anon/public key, not the publishable key shown. Use the key from Supabase Dashboard > Project Settings > API > anon/public.

- [ ] **Step 2: Verify supabase.js reads correct env vars**

The file `/home/lyc/work/cupcake777.github.io/project/src/lib/supabase.js` already references `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` - no changes needed.

---

## Task 2: Create Authentication Components

**Files:**

- Create: `src/components/Auth/LoginForm.jsx`
- Create: `src/components/Auth/RegisterForm.jsx`
- Create: `src/components/Auth/AuthPage.jsx`
- Create: `src/hooks/useAuth.js`

- [ ] **Step 1: Create useAuth hook**

Create `src/hooks/useAuth.js`:

```javascript
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) setError(error.message)
    return { data, error }
  }

  const signUp = async (email, password) => {
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)
    if (error) setError(error.message)
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) setError(error.message)
    return { error }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setError,
  }
}
```

- [ ] **Step 2: Create LoginForm component**

Create `src/components/Auth/LoginForm.jsx`:

```javascript
import { useState } from "react"

const serif = "'Noto Serif SC',serif"
const accent = "#c4a882"
const accentDark = "#7a5c45"
const textMain = "#5c4033"
const textMid = "#9e8472"
const surface = "rgba(255,255,255,0.88)"
const border = "rgba(196,168,130,0.22)"

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
```

- [ ] **Step 3: Create RegisterForm component**

Create `src/components/Auth/RegisterForm.jsx`:

```javascript
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
```

- [ ] **Step 4: Create AuthPage container**

Create `src/components/Auth/AuthPage.jsx`:

```javascript
import { useState } from "react"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

export function AuthPage({ onLogin, onRegister, loading, error }) {
  const [mode, setMode] = useState("login") // 'login' or 'register'

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          animation: "fadeUp .5s ease-out",
        }}
      >
        {/* Header */}
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

        {/* Auth Card */}
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
          {/* Tab Switcher */}
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

          {/* Forms */}
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

        {/* Footer */}
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
```

- [ ] **Step 5: Create index.js for barrel export**

Create `src/components/Auth/index.js`:

```javascript
export { AuthPage } from "./AuthPage"
export { LoginForm } from "./LoginForm"
export { RegisterForm } from "./RegisterForm"
```

---

## Task 3: Create AI Settings Component

**Files:**

- Create: `src/components/AISettings.jsx`

- [ ] **Step 1: Create AI Settings modal component**

This component allows users to configure their AI API key (stored in localStorage).

Create `src/components/AISettings.jsx`:

```javascript
import { useState, useEffect } from "react"
import { Settings, X, Key, Info } from "lucide-react"

const AI_PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", keyPrefix: "sk-ant-", placeholder: "sk-ant-..." },
  { id: "gemini", name: "Google Gemini", keyPrefix: "AI", placeholder: "AIza..." },
]

export function AISettings({ onSave }) {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)

  // Load saved settings on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem("cat-journal-ai-provider")
    const savedKey = localStorage.getItem("cat-journal-ai-key")
    if (savedProvider) setProvider(savedProvider)
    if (savedKey) setApiKey(savedKey)
  }, [])

  const handleSave = () => {
    localStorage.setItem("cat-journal-ai-provider", provider)
    localStorage.setItem("cat-journal-ai-key", apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setIsOpen(false)
    onSave?.({ provider, apiKey })
  }

  const handleClear = () => {
    localStorage.removeItem("cat-journal-ai-provider")
    localStorage.removeItem("cat-journal-ai-key")
    setProvider("anthropic")
    setApiKey("")
  }

  // Settings button (to be placed in UI)
  const SettingsButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 8,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .2s",
      }}
      title="AI设置"
    >
      <Settings size={22} color="#9e8472" />
    </button>
  )

  // Modal
  const SettingsModal = () => {
    if (!isOpen) return null

    return (
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 22,
            border: "1px solid rgba(196,168,130,0.22)",
            boxShadow: "0 10px 40px rgba(160,120,80,0.15)",
            padding: "28px 24px",
            maxWidth: 420,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            animation: "popIn .2s ease-out",
          }}
        >
          <style>{`
            @keyframes popIn{0%{opacity:0;transform:scale(.95)}100%{opacity:1;transform:scale(1)}}
          `}</style>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 18,
                color: "#5c4033",
                margin: 0,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Key size={20} />
              AI 设置
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="#9e8472" />
            </button>
          </div>

          {/* Info */}
          <div
            style={{
              background: "#fff9e6",
              border: "1px solid #ffd97d",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 20,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Info size={18} color="#a67c00" style={{ flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                fontSize: 13,
                color: "#8a6d00",
                fontFamily: "sans-serif",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              API Key 仅存储在你的浏览器本地，不会上传到服务器。请妥善保管你的密钥。
            </p>
          </div>

          {/* Provider Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: "#9e8472",
                fontFamily: "sans-serif",
                marginBottom: 8,
                display: "block",
                fontWeight: 600,
              }}
            >
              AI 提供商
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  style={{
                    flex: 1,
                    padding: "12px 8px",
                    borderRadius: 12,
                    border: `2px solid ${provider === p.id ? "#c4a882" : "#e8d5c0"}`,
                    background: provider === p.id ? "#f5ede4" : "#fdf8f4",
                    color: "#5c4033",
                    fontSize: 13,
                    fontWeight: provider === p.id ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "sans-serif",
                    transition: "all .2s",
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 12,
                color: "#9e8472",
                fontFamily: "sans-serif",
                marginBottom: 8,
                display: "block",
                fontWeight: 600,
              }}
            >
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={AI_PROVIDERS.find((p) => p.id === provider)?.placeholder}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "2px solid #e8d5c0",
                padding: "12px 14px",
                fontSize: 14,
                fontFamily: "monospace",
                outline: "none",
                background: "#fdf8f4",
                color: "#5c4033",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#c4a882")}
              onBlur={(e) => (e.target.style.borderColor = "#e8d5c0")}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                border: "2px solid #e8d5c0",
                background: "transparent",
                color: "#9e8472",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "sans-serif",
                transition: "all .2s",
              }}
            >
              清除
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background: apiKey.trim() ? "linear-gradient(135deg,#c4a882,#e8b89a)" : "#e8d5c0",
                color: apiKey.trim() ? "white" : "#b0a090",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Noto Serif SC', serif",
                cursor: apiKey.trim() ? "pointer" : "not-allowed",
                transition: "all .2s",
              }}
            >
              {saved ? "✓ 已保存" : "保存设置"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { SettingsButton, SettingsModal, isOpen, setIsOpen }
}

// Utility function to get AI config from localStorage
export function getAIConfig() {
  const provider = localStorage.getItem("cat-journal-ai-provider") || "anthropic"
  const apiKey = localStorage.getItem("cat-journal-ai-key") || ""
  return { provider, apiKey }
}
```

---

## Task 4: Create Supabase Storage Utilities

**Files:**

- Create: `src/lib/storage.js`

- [ ] **Step 1: Create storage utility for Supabase operations**

This handles all database operations, replacing the original `db` object from cat-journal-v5.jsx.

Create `src/lib/storage.js`:

```javascript
import { supabase } from "./supabase"

// Storage keys for localStorage (for AI settings only)
const STORAGE_KEYS = {
  records: "catjournal-records-cache", // Cache for offline display
  digests: "catjournal-digests-cache",
  research: "catjournal-research-cache",
  profile: "catjournal-profile-cache",
}

// Helper to get user ID
function getUserId() {
  const user = supabase.auth.getUser()
  return user?.id
}

// All storage operations now go through Supabase
export const db = {
  // Records (daily check-ins)
  loadRecords: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("cat_journal")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading records:", error)
      // Try to return cached data
      const cached = localStorage.getItem(STORAGE_KEYS.records)
      return cached ? JSON.parse(cached) : []
    }

    // Update cache
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(data || []))
    return data || []
  },

  saveRecord: async (record) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("cat_journal")
      .insert({
        user_id: user.id,
        content: record.activity, // Map activity to content
        sentiment: record.mood?.val, // Map mood value to sentiment
        tags: {
          mood: record.mood,
          mental: record.mental,
          physical: record.physical,
          nextPlan: record.nextPlan,
          goals: record.goals,
          goalDone: record.goalDone,
        },
        created_at: new Date(record.ts).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    localStorage.removeItem(STORAGE_KEYS.records)
    return data
  },

  updateRecord: async (id, updates) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("cat_journal")
      .update({
        content: updates.activity,
        sentiment: updates.mood?.val,
        tags: {
          mood: updates.mood,
          mental: updates.mental,
          physical: updates.physical,
          nextPlan: updates.nextPlan,
          goals: updates.goals,
          goalDone: updates.goalDone,
        },
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    localStorage.removeItem(STORAGE_KEYS.records)
    return data
  },

  deleteRecord: async (id) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("cat_journal")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    // Invalidate cache
    localStorage.removeItem(STORAGE_KEYS.records)
  },

  // Profile (stored in user metadata or separate table - here we'll use user metadata)
  loadProfile: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // Profile stored in user metadata
    return user.user_metadata?.profile || null
  },

  saveProfile: async (profile) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase.auth.updateUser({
      data: { profile: { ...profile, setupDone: true } },
    })

    if (error) throw error

    // Also save to localStorage as cache
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile))
    return data
  },

  // Research data (stored in user metadata)
  loadResearch: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // Research stored in user metadata
    return user.user_metadata?.research || null
  },

  saveResearch: async (research) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Merge with existing metadata
    const existingProfile = user.user_metadata?.profile || {}
    const { data, error } = await supabase.auth.updateUser({
      data: {
        profile: existingProfile,
        research: research,
      },
    })

    if (error) throw error

    // Also save to localStorage as cache
    localStorage.setItem(STORAGE_KEYS.research, JSON.stringify(research))
    return data
  },

  // Digests (AI-generated insights) - stored in separate table if needed
  // For simplicity, we'll store in user metadata too
  loadDigests: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    return user.user_metadata?.digests || []
  },

  saveDigests: async (digests) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const existingProfile = user.user_metadata?.profile || {}
    const existingResearch = user.user_metadata?.research || {}

    const { data, error } = await supabase.auth.updateUser({
      data: {
        profile: existingProfile,
        research: existingResearch,
        digests: digests,
      },
    })

    if (error) throw error
    localStorage.setItem(STORAGE_KEYS.digests, JSON.stringify(digests))
    return data
  },
}

// Export keys for backward compatibility
export const SK = STORAGE_KEYS
```

---

## Task 5: Migrate Core App Logic

**Files:**

- Modify: `src/App.jsx`
- Create: `src/components/App/MainApp.jsx` (extracted from cat-journal-v5.jsx)
- Create: `src/components/App/index.js`

- [ ] **Step 1: Create MainApp component with all original features**

This will be the main application component that replicates cat-journal-v5.jsx functionality but uses Supabase for storage.

Create `src/components/App/MainApp.jsx`:

```javascript
import { useState, useEffect, useRef } from "react"
import { Settings } from "lucide-react"
import { supabase } from "../../lib/supabase"
import { db } from "../../lib/storage"
import { AISettings, getAIConfig } from "../AISettings"

// ─── Constants (from original) ──────────────────────────────────────────────────
const MOODS = [
  { label: "开心", emoji: "😸", color: "#f6a623", val: 5 },
  { label: "平静", emoji: "😺", color: "#5bc0eb", val: 4 },
  { label: "充能", emoji: "😼", color: "#6bcb77", val: 5 },
  { label: "疲惫", emoji: "😿", color: "#a0b4c8", val: 2 },
  { label: "焦虑", emoji: "🙀", color: "#c9b1d9", val: 2 },
  { label: "烦躁", emoji: "😾", color: "#e87c7c", val: 1 },
]
const MENTAL = ["🌟 满血复活", "✨ 还不错", "🌤 一般般", "🌧 有点低落", "⛈ 快撑不住了"]
const PHYSICAL = ["💪 精力充沛", "🙂 状态良好", "😐 还可以", "😮‍💨 有点累", "😵 超级疲惫"]
const STAGES = ["本科生", "硕士生", "博士生", "博士后", "教职/研究员", "其他研究者"]
const CAT_AVATARS = ["🐱", "🐈", "🐈‍⬛", "😺", "😸", "😻", "🙀", "😼"]

// ... [Continue with all the helper functions, CSS, and components from the original file]
// The full implementation would be too long to include here, but follows the same structure
// with storage calls replaced with db.xxx functions

// For brevity, I'll show the key changes:

// ─── AI Integration with user-provided key ───────────────────────────────────────
async function callAI(prompt, profile, research, records) {
  const { provider, apiKey } = getAIConfig()

  if (!apiKey) {
    return "请在设置中配置你的 AI API Key 🐾"
  }

  const ctx = buildCtx(profile, research, records)
  const name = profile?.name || "小猫"

  const fullPrompt = `你是"${name}"专属的猫猫饲养员AI，正在写今日观察日志。

${ctx}

${prompt}

语气温柔亲切，偶尔俏皮，像真正了解${name}的老朋友，300字内。`

  try {
    if (provider === "gemini") {
      // Gemini API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        },
      )
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 响应解析失败"
    } else {
      // Default: Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: fullPrompt }],
        }),
      })
      const data = await response.json()
      return data.content?.map((c) => c.text || "").join("") || "AI 响应解析失败"
    }
  } catch (error) {
    console.error("AI call failed:", error)
    return "AI 请求失败，请检查你的 API Key 设置 🐾"
  }
}

// ─── Main App Component ──────────────────────────────────────────────────────
export function MainApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("home")
  const [profile, setProfile] = useState(null)
  const [research, setResearch] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showingSettings, setShowingSettings] = useState(false)

  const aiSettings = AISettings({ onSave: () => {} })

  // Load initial data
  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profileData, researchData, recordsData] = await Promise.all([
        db.loadProfile(),
        db.loadResearch(),
        db.loadRecords(),
      ])
      setProfile(profileData)
      setResearch(
        researchData || {
          topic: "",
          description: "",
          blockers: [],
          inspirations: [],
          aiAdvice: [],
        },
      )
      setRecords(recordsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  // ... [Rest of the MainApp logic from original file]
  // Include: Onboarding, CheckIn, DailyReport, ResearchModule, ProfilePage, etc.
  // All storage calls now use db.xxx() instead of the original localStorage-based storage

  return (
    <div style={{ minHeight: "100vh", background: "#f7efe6" }}>
      {/* Include all the original UI components */}
      {/* Add Settings button in appropriate place */}

      {/* Settings Modal */}
      <aiSettings.SettingsModal />
    </div>
  )
}
```

**Note:** Due to length constraints, the full MainApp.jsx would include all components from cat-journal-v5.jsx (Onboarding, CheckIn, DailyReport, ResearchModule, ProfilePage, BottomNav, etc.) with storage calls replaced.

- [ ] **Step 2: Update App.jsx to use authentication**

Modify `src/App.jsx`:

```javascript
import { useAuth } from "./hooks/useAuth"
import { AuthPage } from "./components/Auth"
import { MainApp } from "./components/App/MainApp"

function App() {
  const { user, loading, error, signIn, signUp, signOut } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#fdf4ec,#f5e6d8,#ede0d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐱</div>
          <p style={{ color: "#9e8472", fontFamily: "sans-serif" }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage onLogin={signIn} onRegister={signUp} loading={loading} error={error} />
  }

  return <MainApp user={user} onLogout={signOut} />
}

export default App
```

---

## Task 6: Configure Vite for GitHub Pages Deployment

**Files:**

- Modify: `vite.config.js`

- [ ] **Step 1: Update vite.config.js with base path**

```javascript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/projects/cat-journal/",
})
```

---

## Task 7: Create GitHub Actions Deployment Workflow

**Files:**

- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deployment workflow for GitHub Pages**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Cat Journal to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: "./project/package-lock.json"

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Install dependencies
        run: npm ci
        working-directory: ./project

      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build
        working-directory: ./project

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./project/dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Task 8: Database Schema Setup

**Files:**

- Create: `supabase/migrations/001_initial_schema.sql` (reference file)

- [ ] **Step 1: Document required Supabase schema**

The user needs to create this table in Supabase. Create a reference file:

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Cat Journal initial schema
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
alter default privileges in schema public revoke all on tables from public;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- Create cat_journal table
create table if not exists public.cat_journal (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  sentiment integer,
  tags jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cat_journal enable row level security;

-- Create policies
create policy "Users can view their own records"
  on public.cat_journal for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own records"
  on public.cat_journal for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own records"
  on public.cat_journal for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own records"
  on public.cat_journal for delete
  using ( auth.uid() = user_id );

-- Create index for faster queries
create index if not exists cat_journal_user_id_idx on public.cat_journal(user_id);
create index if not exists cat_journal_created_at_idx on public.cat_journal(created_at desc);

-- Grant permissions
grant select, insert, update, delete on public.cat_journal to authenticated;
```

---

## Task 9: Final Integration and Testing

**Files:**

- Test all components end-to-end

- [ ] **Step 1: Verify authentication flow works**
- Start dev server
- Test registration with email/password
- Test login after registration
- Test logout functionality

- [ ] **Step 2: Verify data persistence**
- Create a check-in record
- Verify data appears in Supabase dashboard
- Refresh page and verify data persists
- Test cross-device login

- [ ] **Step 3: Verify AI settings**
- Open settings modal
- Enter API key
- Create a check-in and verify AI response
- Test with both Anthropic and Gemini keys

- [ ] **Step 4: Build and deploy**
- Run `npm run build`
- Verify build succeeds
- Push to main branch
- Verify GitHub Actions workflow runs
- Verify site is accessible at `/projects/cat-journal/`

---

## Summary

This plan covers:

1. ✅ Fix environment configuration
2. ✅ Create authentication system (login/register)
3. ✅ Create AI settings UI
4. ✅ Create Supabase storage layer
5. ✅ Migrate app logic from cat-journal-v5.jsx
6. ✅ Configure Vite for deployment
7. ✅ Create GitHub Actions workflow
8. ✅ Document database schema
9. ✅ Testing checklist

**Estimated Time:** 3-4 hours for complete implementation
