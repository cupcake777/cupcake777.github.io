import { Field, GhostButton, PrimaryButton, TextInput } from "../ui/primitives"

export function LoginForm({ onLogin, onSwitchToRegister, loading, error }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onLogin(formData.get("email"), formData.get("password"))
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <Field
        label="邮箱"
        hint="设备会话失效时需要重新登录。"
      >
        <TextInput name="email" type="email" placeholder="name@example.com" required />
      </Field>
      <Field label="密码">
        <TextInput name="password" type="password" placeholder="请输入密码" required />
      </Field>
      {error ? (
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
          {error}
        </div>
      ) : null}
      <PrimaryButton type="submit" full disabled={loading}>
        {loading ? "登录中..." : "登录并进入今日"}
      </PrimaryButton>
      <GhostButton type="button" onClick={onSwitchToRegister} style={{ justifySelf: "start" }}>
        第一次使用？去注册
      </GhostButton>
    </form>
  )
}
