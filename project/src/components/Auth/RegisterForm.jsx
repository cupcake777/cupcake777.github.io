import { useState } from "react"
import { Field, GhostButton, PrimaryButton, TextInput } from "../ui/primitives"

export function RegisterForm({ onRegister, onSwitchToLogin, loading, error }) {
  const [localError, setLocalError] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = formData.get("email")
    const password = formData.get("password")
    const confirmPassword = formData.get("confirmPassword")

    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致。")
      return
    }

    if (String(password).length < 6) {
      setLocalError("密码至少需要 6 个字符。")
      return
    }

    setLocalError("")
    onRegister(email, password)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <Field
        label="注册邮箱"
        hint="注册后自动建立设备会话。"
      >
        <TextInput name="email" type="email" placeholder="name@example.com" required />
      </Field>
      <Field label="密码">
        <TextInput name="password" type="password" placeholder="至少 6 个字符" required minLength={6} />
      </Field>
      <Field label="确认密码">
        <TextInput name="confirmPassword" type="password" placeholder="再次输入密码" required />
      </Field>
      {localError || error ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(210, 140, 114, 0.3)",
            background: "rgba(210, 140, 114, 0.08)",
            color: "#8f4c37",
            fontSize: 14,
          }}
        >
          {localError || error}
        </div>
      ) : null}
      <PrimaryButton type="submit" full disabled={loading}>
        {loading ? "注册中..." : "注册并进入今日"}
      </PrimaryButton>
      <GhostButton type="button" onClick={onSwitchToLogin} style={{ justifySelf: "start" }}>
        已经注册过？去登录
      </GhostButton>
    </form>
  )
}
