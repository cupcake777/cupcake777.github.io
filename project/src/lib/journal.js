import { normalizeProfile, normalizeRecord, normalizeResearch } from "./normalize"

export const MOODS = [
  { label: "开心", emoji: "😸", color: "#2c8c72", val: 5 },
  { label: "平静", emoji: "🙂", color: "#4d9f88", val: 4 },
  { label: "专注", emoji: "🧠", color: "#5f8fce", val: 4 },
  { label: "疲惫", emoji: "😮‍💨", color: "#8fa39a", val: 2 },
  { label: "焦虑", emoji: "😵", color: "#d28c72", val: 2 },
  { label: "烦躁", emoji: "😣", color: "#cb6d62", val: 1 },
]

export const MENTAL_OPTIONS = [
  "非常清醒",
  "状态不错",
  "一般",
  "有点分散",
  "快转不动了",
]

export const PHYSICAL_OPTIONS = [
  "精力充沛",
  "状态稳定",
  "还可以",
  "有些疲劳",
  "需要休息",
]

export const STAGE_OPTIONS = ["本科生", "硕士生", "博士生", "博士后", "教职/研究员", "其他研究者"]
export const CAT_AVATARS = ["🐱", "🐈", "🐈‍⬛", "😺", "😸", "😼"]

export function createEmptyProfile() {
  return normalizeProfile({
    name: "",
    avatar: "🐱",
    stage: "博士生",
    field: "",
    institution: "",
    workStyle: "",
    stressors: "",
    goals: "",
    setupDone: false,
  })
}

export function createEmptyResearch() {
  return normalizeResearch({
    topic: "",
    description: "",
    blockers: [],
    inspirations: [],
    aiAdvice: [],
  })
}

export function createDraftRecord() {
  return {
    activity: "",
    mood: null,
    mental: "",
    physical: "",
    nextPlan: "",
    goals: ["", "", ""],
    goalDone: [false, false, false],
  }
}

export function makeRecordPayload(draft) {
  return normalizeRecord({
    id: Date.now().toString(36),
    ts: Date.now(),
    ...draft,
  })
}

export function dayKey(ts) {
  const date = new Date(ts)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function formatDateTime(ts) {
  const date = new Date(ts)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`
}

export function formatDay(ts) {
  const date = new Date(ts)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function getTodayKey() {
  return dayKey(Date.now())
}

export function getWeekStart(ts = Date.now()) {
  const date = new Date(ts)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export function summarizeRecords(records) {
  const safeRecords = Array.isArray(records) ? records.map((record) => normalizeRecord(record)) : []
  const todayRecords = safeRecords.filter((record) => dayKey(record.ts) === getTodayKey())
  const last7 = safeRecords.filter((record) => record.ts > Date.now() - 7 * 864e5)
  const streakDays = new Set(safeRecords.map((record) => dayKey(record.ts)))
  let streak = 0
  let cursor = Date.now()

  while (streakDays.has(dayKey(cursor))) {
    streak += 1
    cursor -= 864e5
  }

  const completedGoals = safeRecords.reduce((sum, record) => {
    const total = (record.goalDone || []).filter((done, index) => done && record.goals[index]).length
    return sum + total
  }, 0)

  const averageMood = last7.length
    ? (last7.reduce((sum, record) => sum + (record.mood?.val || 3), 0) / last7.length).toFixed(1)
    : "—"

  return {
    total: safeRecords.length,
    todayRecords,
    hasToday: todayRecords.length > 0,
    latest: safeRecords[0] || null,
    streak,
    averageMood,
    completedGoals,
    weeklyCount: new Set(last7.map((record) => dayKey(record.ts))).size,
  }
}

export function buildAIContext(profile, research, records) {
  const safeProfile = normalizeProfile(profile)
  const safeResearch = normalizeResearch(research)
  const safeRecords = Array.isArray(records) ? records.map((record) => normalizeRecord(record)) : []
  const lines = []

  if (safeProfile.name) {
    lines.push(
      `【用户】${safeProfile.name}，${safeProfile.stage}，研究方向：${safeProfile.field || "未填写"}，机构：${safeProfile.institution || "未填写"}`,
    )
  }
  if (safeProfile.workStyle) lines.push(`【工作方式】${safeProfile.workStyle}`)
  if (safeProfile.stressors) lines.push(`【压力来源】${safeProfile.stressors}`)
  if (safeProfile.goals) lines.push(`【长期目标】${safeProfile.goals}`)
  if (safeResearch.topic) lines.push(`【研究主题】${safeResearch.topic}`)
  if (safeResearch.description) lines.push(`【研究描述】${safeResearch.description}`)

  if (safeRecords.length) {
    lines.push(
      `【近期记录】\n${safeRecords
        .slice(0, 10)
        .map(
          (record) =>
            `[${formatDateTime(record.ts)}] 活动:${record.activity} | 心情:${record.mood?.label || "未填"} | 下一步:${record.nextPlan || "未填"}`,
        )
        .join("\n")}`,
    )
  }

  return lines.join("\n")
}
