import test from "node:test"
import assert from "node:assert/strict"

import {
  normalizeDigests,
  normalizeProfile,
  normalizeRecord,
  normalizeResearch,
  toText,
} from "../src/lib/normalize.js"

test("toText collapses unexpected object values into safe text", () => {
  const vnodeLike = {
    type: "div",
    props: { children: "hello" },
    key: null,
    ref: null,
    __k: null,
  }

  assert.equal(toText(vnodeLike), "hello")
  assert.equal(toText({ message: "boom" }), "boom")
  assert.equal(toText({ text: "report" }), "report")
  assert.equal(toText(null, "fallback"), "fallback")
})

test("normalizeProfile strips non-text profile fields", () => {
  const profile = normalizeProfile({
    name: { props: { children: "小猫" } },
    field: ["生信", "组学"],
    institution: 123,
  })

  assert.equal(profile.name, "小猫")
  assert.equal(profile.field, "生信, 组学")
  assert.equal(profile.institution, "123")
  assert.equal(profile.avatar, "🐱")
})

test("normalizeResearch and normalizeDigests coerce legacy object payloads", () => {
  const research = normalizeResearch({
    topic: { text: "APA 动态模式" },
    description: { message: "描述" },
    blockers: [{ id: 1, text: { props: { children: "卡点" } } }],
    inspirations: [{ id: 2, text: ["灵感", "A"] }],
    aiAdvice: [{ id: 3, text: { text: "建议" } }],
  })
  const digests = normalizeDigests({
    "W-2026-W1": { text: { props: { children: "周报" } }, ts: 1, period: { text: "本周" } },
  })

  assert.equal(research.topic, "APA 动态模式")
  assert.equal(research.description, "描述")
  assert.equal(research.blockers[0].text, "卡点")
  assert.equal(research.inspirations[0].text, "灵感, A")
  assert.equal(research.aiAdvice[0].text, "建议")
  assert.equal(digests["W-2026-W1"].text, "周报")
  assert.equal(digests["W-2026-W1"].period, "本周")
})

test("normalizeRecord makes record text fields render-safe", () => {
  const record = normalizeRecord({
    id: 1,
    created_at: "2026-03-31T00:00:00.000Z",
    content: { props: { children: "写代码" } },
    tags: {
      mood: { label: { text: "开心" }, emoji: { props: { children: "😸" } }, color: "#f6a623", val: 5 },
      mental: { message: "✨ 还不错" },
      physical: ["💪", "精力充沛"],
      nextPlan: { text: "继续修 bug" },
      goals: [{ text: "修复报错" }, null, 3],
      goalDone: [true, false, "yes"],
    },
  })

  assert.equal(record.activity, "写代码")
  assert.equal(record.mood.label, "开心")
  assert.equal(record.mood.emoji, "😸")
  assert.equal(record.mental, "✨ 还不错")
  assert.equal(record.physical, "💪, 精力充沛")
  assert.equal(record.nextPlan, "继续修 bug")
  assert.deepEqual(record.goals, ["修复报错", "", "3"])
  assert.deepEqual(record.goalDone, [true, false, true])
})
