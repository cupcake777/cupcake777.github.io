import { supabase } from "./supabase"

const STORAGE_KEYS = {
  records: "catjournal-records-cache",
  digests: "catjournal-digests-cache",
  research: "catjournal-research-cache",
  profile: "catjournal-profile-cache",
}

export const db = {
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
      const cached = localStorage.getItem(STORAGE_KEYS.records)
      return cached ? JSON.parse(cached) : []
    }

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
        content: record.activity,
        sentiment: record.mood?.val,
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

    localStorage.removeItem(STORAGE_KEYS.records)
  },

  loadProfile: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

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

    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile))
    return data
  },

  loadResearch: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    return user.user_metadata?.research || null
  },

  saveResearch: async (research) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const existingProfile = user.user_metadata?.profile || {}
    const { data, error } = await supabase.auth.updateUser({
      data: {
        profile: existingProfile,
        research: research,
      },
    })

    if (error) throw error

    localStorage.setItem(STORAGE_KEYS.research, JSON.stringify(research))
    return data
  },

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

export const SK = STORAGE_KEYS
