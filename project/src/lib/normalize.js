const PROFILE_DEFAULT = {
  name: "",
  avatar: "🐱",
  stage: "博士生",
  field: "",
  institution: "",
  workStyle: "",
  stressors: "",
  goals: "",
  setupDone: false,
}

const RESEARCH_DEFAULT = {
  topic: "",
  description: "",
  blockers: [],
  inspirations: [],
  aiAdvice: [],
}

function isObject(value) {
  return typeof value === "object" && value !== null
}

function firstNonEmpty(values, fallback = "") {
  for (const value of values) {
    const text = toText(value, "")
    if (text) return text
  }
  return fallback
}

export function toText(value, fallback = "") {
  if (value == null) return fallback
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "bigint") return String(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) {
    const parts = value.map((item) => toText(item, "")).filter(Boolean)
    return parts.length ? parts.join(", ") : fallback
  }
  if (!isObject(value)) return fallback

  if (isObject(value.props) && "children" in value.props) {
    return toText(value.props.children, fallback)
  }

  return firstNonEmpty(
    [
      value.text,
      value.message,
      value.label,
      value.title,
      value.name,
      value.content,
      value.children,
    ],
    fallback,
  )
}

function normalizeStringArray(values, size = null) {
  const safeValues = Array.isArray(values) ? values.map((item) => toText(item, "")) : []
  if (size == null) return safeValues

  const fixed = safeValues.slice(0, size)
  while (fixed.length < size) fixed.push("")
  return fixed
}

function normalizeBooleanArray(values, size = null) {
  const safeValues = Array.isArray(values) ? values.map((item) => Boolean(item)) : []
  if (size == null) return safeValues

  const fixed = safeValues.slice(0, size)
  while (fixed.length < size) fixed.push(false)
  return fixed
}

function normalizeMood(mood) {
  if (!isObject(mood)) return null

  const label = toText(mood.label, "")
  const emoji = toText(mood.emoji, "")
  const color = toText(mood.color, "")
  const val = Number.isFinite(Number(mood.val)) ? Number(mood.val) : 3

  if (!label && !emoji && !color && val === 3) return null

  return {
    ...mood,
    label,
    emoji,
    color: color || "#c4a882",
    val,
  }
}

export function normalizeProfile(profile) {
  if (!isObject(profile)) return { ...PROFILE_DEFAULT }

  return {
    ...PROFILE_DEFAULT,
    ...profile,
    name: toText(profile.name, ""),
    avatar: toText(profile.avatar, PROFILE_DEFAULT.avatar) || PROFILE_DEFAULT.avatar,
    stage: toText(profile.stage, PROFILE_DEFAULT.stage) || PROFILE_DEFAULT.stage,
    field: toText(profile.field, ""),
    institution: toText(profile.institution, ""),
    workStyle: toText(profile.workStyle, ""),
    stressors: toText(profile.stressors, ""),
    goals: toText(profile.goals, ""),
    setupDone: Boolean(profile.setupDone),
  }
}

export function normalizeResearch(research) {
  if (!isObject(research)) return { ...RESEARCH_DEFAULT }

  return {
    ...RESEARCH_DEFAULT,
    ...research,
    topic: toText(research.topic, ""),
    description: toText(research.description, ""),
    blockers: Array.isArray(research.blockers)
      ? research.blockers.map((blocker, index) => ({
          ...blocker,
          id: blocker?.id ?? `blocker-${index}`,
          text: toText(blocker?.text, ""),
          resolved: Boolean(blocker?.resolved),
          ts: blocker?.ts ?? Date.now(),
        }))
      : [],
    inspirations: Array.isArray(research.inspirations)
      ? research.inspirations.map((inspiration, index) => ({
          ...inspiration,
          id: inspiration?.id ?? `inspiration-${index}`,
          text: toText(inspiration?.text, ""),
          starred: Boolean(inspiration?.starred),
          ts: inspiration?.ts ?? Date.now(),
        }))
      : [],
    aiAdvice: Array.isArray(research.aiAdvice)
      ? research.aiAdvice.map((advice, index) => ({
          ...advice,
          id: advice?.id ?? `advice-${index}`,
          text: toText(advice?.text, ""),
          ts: advice?.ts ?? Date.now(),
        }))
      : [],
  }
}

export function normalizeRecord(record) {
  if (!isObject(record)) {
    return {
      id: null,
      ts: Date.now(),
      mood: null,
      mental: "",
      physical: "",
      nextPlan: "",
      goals: ["", "", ""],
      goalDone: [false, false, false],
      activity: "",
    }
  }

  const tags = isObject(record.tags) ? record.tags : {}

  return {
    ...record,
    id: record.id ?? null,
    ts: new Date(record.created_at || record.ts || Date.now()).getTime(),
    mood: normalizeMood(tags.mood || record.mood),
    mental: toText(tags.mental ?? record.mental, ""),
    physical: toText(tags.physical ?? record.physical, ""),
    nextPlan: toText(tags.nextPlan ?? record.nextPlan, ""),
    goals: normalizeStringArray(tags.goals ?? record.goals, 3),
    goalDone: normalizeBooleanArray(tags.goalDone ?? record.goalDone, 3),
    activity: toText(record.content ?? record.activity, ""),
  }
}

export function normalizeDigests(digests) {
  if (!isObject(digests) || Array.isArray(digests)) return {}

  return Object.fromEntries(
    Object.entries(digests).map(([key, value]) => [
      key,
      {
        text: toText(value?.text, ""),
        ts: Number.isFinite(Number(value?.ts)) ? Number(value.ts) : Date.now(),
        period: toText(value?.period, ""),
      },
    ]),
  )
}
