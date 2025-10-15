'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getLevelGroups, getLevelsByGroup, getLessonsForLevel, type LevelGroup, type Level, type Lesson } from '@/lib/data'

interface UserRow { id: string; email: string; role?: string }

export default function AccessOverridesPage() {
  const [query, setQuery] = useState('')
  const [searchedUser, setSearchedUser] = useState<UserRow | null>(null)
  const [searching, setSearching] = useState(false)

  const [groups, setGroups] = useState<LevelGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [overrides, setOverrides] = useState<any[]>([])
  const userId = searchedUser?.id || null

  // Load groups initially
  useEffect(() => {
    getLevelGroups().then((g) => setGroups(g))
  }, [])

  // Load levels when group changes
  useEffect(() => {
    if (!selectedGroupId) { setLevels([]); return }
    getLevelsByGroup(selectedGroupId).then((ls) => setLevels(ls))
  }, [selectedGroupId])

  // Load lessons when course changes
  useEffect(() => {
    if (!selectedLevelId) { setLessons([]); return }
    getLessonsForLevel(selectedLevelId).then((ls) => setLessons(ls))
  }, [selectedLevelId])

  // Load overrides for the selected user
  useEffect(() => {
    const load = async () => {
      if (!userId) { setOverrides([]); return }
      const { data } = await supabase
        .from('access_overrides')
        .select('*')
        .eq('user_id', userId)
      setOverrides(data || [])
    }
    load()
  }, [userId])

  const hasGroupOverride = (gid: number) => overrides.some(o => o.level_group_id === gid)
  const hasLevelOverride = (lid: number) => overrides.some(o => o.level_id === lid)
  const hasLessonOverride = (lid: number) => overrides.some(o => o.lesson_id === lid)

  const toggleOverride = async (payload: { level_group_id?: number | null; level_id?: number | null; lesson_id?: number | null }) => {
    if (!userId) return
    const exists = overrides.find(o => (
      (payload.level_group_id && o.level_group_id === payload.level_group_id) ||
      (payload.level_id && o.level_id === payload.level_id) ||
      (payload.lesson_id && o.lesson_id === payload.lesson_id)
    ))
    if (exists) {
      await supabase.from('access_overrides').delete().eq('id', exists.id)
      setOverrides(prev => prev.filter(o => o.id !== exists.id))
    } else {
      const { data, error } = await supabase
        .from('access_overrides')
        .insert([{ user_id: userId, level_group_id: payload.level_group_id || null, level_id: payload.level_id || null, lesson_id: payload.lesson_id || null }])
        .select('*')
        .single()
      if (!error && data) setOverrides(prev => [...prev, data])
    }
  }

  const searchUser = async () => {
    setSearching(true)
    try {
      const q = query.trim()
      if (!q) return
      // Search by email first, then by id
      let { data } = await supabase.from('users').select('id,email,role').ilike('email', q)
      if (!data || data.length === 0) {
        const byId = await supabase.from('users').select('id,email,role').eq('id', q)
        data = byId.data || []
      }
      setSearchedUser(data?.[0] || null)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: 'linear-gradient(107.7deg, rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3%)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Access Overrides</h1>

        {/* User search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 items-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email or user id" className="flex-1 border rounded px-3 py-2" />
            <button onClick={searchUser} disabled={searching} className="bg-indigo-600 text-white px-4 py-2 rounded">{searching ? 'Searching…' : 'Search'}</button>
          </div>
          {searchedUser && (
            <div className="mt-3 text-sm text-gray-700">Selected user: <span className="font-medium">{searchedUser.email}</span> <span className="ml-2 text-gray-500">({searchedUser.id})</span></div>
          )}
        </div>

        {/* Group selection and overrides */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Level Groups</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className={`px-3 py-1.5 rounded-full text-sm ${selectedGroupId === g.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{g.title}</button>
            ))}
          </div>
          {selectedGroupId && (
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hasGroupOverride(selectedGroupId)} onChange={() => toggleOverride({ level_group_id: selectedGroupId })} />
                <span>Unlock entire group for this user</span>
              </label>
            </div>
          )}
        </div>

        {/* Levels in group */}
        {selectedGroupId && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3">Courses in selected group</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {levels.map(l => (
                <div key={l.id} className={`border rounded p-3 ${selectedLevelId === l.id ? 'border-indigo-400' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{l.title}</div>
                      <label className="flex items-center gap-2 text-sm mt-1">
                        <input type="checkbox" checked={hasLevelOverride(l.id)} onChange={() => toggleOverride({ level_id: l.id })} />
                        <span>Unlock course</span>
                      </label>
                    </div>
                    <button onClick={() => setSelectedLevelId(l.id)} className="text-indigo-600 text-sm">Lessons</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons in selected course */}
        {selectedLevelId && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3">Lessons in selected course</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lessons.map(ls => (
                <label key={ls.id} className="border rounded p-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hasLessonOverride(ls.id)} onChange={() => toggleOverride({ lesson_id: ls.id })} />
                  <span>{ls.order_index}. {ls.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


