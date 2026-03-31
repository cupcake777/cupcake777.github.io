import test from "node:test"
import assert from "node:assert/strict"

import {
  AUTH_FLOW,
  PRIMARY_TABS,
  PUBLIC_NAV_ITEMS,
  SITE_THEME,
  TOOL_MENU_ITEMS,
} from "../src/config/site.js"

test("primary tabs reflect the approved workspace IA", () => {
  assert.deepEqual(
    PRIMARY_TABS.map((item) => item.label),
    ["今日", "时间线", "洞察", "AI", "我的"],
  )
})

test("public nav exposes product entry and discovery sections", () => {
  assert.deepEqual(
    PUBLIC_NAV_ITEMS.map((item) => item.label),
    ["产品价值", "如何记录", "回顾洞察", "开始使用"],
  )
})

test("auth flow is registration-first with returning-device auto entry", () => {
  assert.equal(AUTH_FLOW.defaultMode, "register")
  assert.equal(AUTH_FLOW.secondaryMode, "login")
  assert.equal(AUTH_FLOW.autoLoginStrategy, "persistent-session")
})

test("tool menu keeps research secondary to daily logging", () => {
  assert.equal(TOOL_MENU_ITEMS.some((item) => item.key === "research"), true)
  assert.equal(PRIMARY_TABS.some((item) => item.key === "research"), false)
})

test("site theme inherits the approved mint palette", () => {
  assert.equal(SITE_THEME.base, "#fffdfa")
  assert.equal(SITE_THEME.surfaceBorder, "#edf3ef")
  assert.equal(SITE_THEME.accent, "#2c8c72")
  assert.equal(SITE_THEME.accentStrong, "#1f6b56")
  assert.equal(SITE_THEME.headerTint, "rgba(44, 140, 114, 0.08)")
})
