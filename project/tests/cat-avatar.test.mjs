import test from "node:test"
import assert from "node:assert/strict"

import {
  CAT_EXPRESSIONS,
  normalizeCatMood,
  resolveCatExpression,
} from "../src/lib/catAvatar.js"

test("normalizeCatMood maps localized labels and legacy ids into stable avatar moods", () => {
  assert.equal(normalizeCatMood("开心"), "happy")
  assert.equal(normalizeCatMood("平静"), "calm")
  assert.equal(normalizeCatMood("专注"), "focused")
  assert.equal(normalizeCatMood("焦虑"), "stressed")
  assert.equal(normalizeCatMood("烦躁"), "grumpy")
  assert.equal(normalizeCatMood("excited"), "excited")
  assert.equal(normalizeCatMood({ label: "疲惫" }), "tired")
  assert.equal(normalizeCatMood({ value: "happy" }), "happy")
  assert.equal(normalizeCatMood(null), "calm")
})

test("resolveCatExpression lets explicit expression override mood-driven fallback", () => {
  const saved = resolveCatExpression({ mood: "烦躁", expression: "saved" })
  const tired = resolveCatExpression({ mood: "疲惫" })

  assert.equal(saved.key, "saved")
  assert.deepEqual(
    saved.decorations.map((item) => item.icon),
    ["circle-check", "sparkles"],
  )
  assert.equal(tired.key, "tired")
  assert.deepEqual(
    tired.decorations.map((item) => item.icon),
    ["moon-star"],
  )
})

test("CAT_EXPRESSIONS exposes richer floating-cat action states", () => {
  assert.deepEqual(Object.keys(CAT_EXPRESSIONS).sort(), [
    "calm",
    "excited",
    "focused",
    "grumpy",
    "happy",
    "saved",
    "stressed",
    "thinking",
    "tired",
    "welcome",
  ])
})
