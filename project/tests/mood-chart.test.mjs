import test from "node:test"
import assert from "node:assert/strict"

import { buildMoodChartData } from "../src/lib/moodChart.js"

test("buildMoodChartData derives deterministic bars from current localized moods", () => {
  const data = buildMoodChartData([
    { ts: Date.UTC(2026, 3, 4), mood: { label: "烦躁", val: 1 } },
    { ts: Date.UTC(2026, 3, 3), mood: { label: "焦虑", val: 2 } },
    { ts: Date.UTC(2026, 3, 2), mood: { label: "平静", val: 4 } },
    { ts: Date.UTC(2026, 3, 1), mood: { label: "开心", val: 5 } },
  ])

  assert.deepEqual(
    data.map((item) => item.key),
    ["happy", "calm", "stressed", "grumpy"],
  )
  assert.deepEqual(
    data.map((item) => item.color),
    ["#2c8c72", "#4d9f88", "#d28c72", "#cb6d62"],
  )
  assert.deepEqual(
    data.map((item) => item.heightPercent),
    [100, 88, 64, 52],
  )
})
