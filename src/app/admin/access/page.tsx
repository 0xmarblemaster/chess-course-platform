'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getLevelGroups, getLevelsByGroup, getLessonsForLevel, type LevelGroup, type Level, type Lesson } from '@/lib/data'

interface UserRow { id: string; email: string; role?: string }

type TabKey = 'overrides' | 'invites' | 'sessions_active' | 'sessions_expired'

export default function AccessOverridesPage() {
  const [query, setQuery] = useState('')
  const [searchedUser, setSearchedUser] = useState<UserRow | null>(null)
  const [searching, setSearching] = useState(false)

  const [activeTab, setActiveTab] = useState<TabKey>('overrides')

  const [groups, setGroups] = useState<LevelGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [overrides, setOverrides] = useState<{ id: number; level_group_id: number | null; level_id: number | null; lesson_id: number | null }[]>([])
  const userId = searchedUser?.id || null
  const canEdit = !!userId

  // Invite link states
  interface TrialLink { id: string; code: string; expires_at: string; enabled: boolean; max_uses: number | null; use_count: number; created_at: string }
  interface TrialSessionAgg { sessions: number; last_seen_at: string | null }
  const [links, setLinks] = useState<Array<TrialLink & { sessions?: number; last_seen_at?: string | null }>>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [newDurationHrs, setNewDurationHrs] = useState<number>(72)
  const [newMaxUses, setNewMaxUses] = useState<string>('')
  const [inviteGroupId, setInviteGroupId] = useState<number | null>(null)
  const [inviteMaxCourses, setInviteMaxCourses] = useState<number>(3)
  const inviteBaseUrl = useMemo(() => {
    if (typeof window !== 'undefined') return `${window.location.origin}/invite/`
    return 'https://www.chessempire.kz/invite/'
  }, [])

  // Sessions state
  interface SessionRow {
    id: string
    link_id: string
    created_at: string
    last_seen_at: string | null
    revoked_at: string | null
    ip: string | null
    country: string | null
    user_agent: string | null
    link_code: string
    link_expires_at: string
    link_enabled: boolean
  }
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

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

  // Load invite links
  const loadLinks = useCallback(async () => {
    setLinksLoading(true)
    try {
      // Load links and aggregate session counts and last activity
      const { data: linkRows } = await supabase
        .from('trial_links')
        .select('id, code, expires_at, enabled, max_uses, use_count, created_at')
        .order('created_at', { ascending: false })

      const ids: string[] = (linkRows as TrialLink[] | null)?.map((l) => l.id) || []
      let sessionMap = new Map<string, TrialSessionAgg>()
      if (ids.length > 0) {
        const { data: sessions } = await supabase
          .from('trial_sessions')
          .select('link_id, last_seen_at')
          .in('link_id', ids)
        const agg: Record<string, TrialSessionAgg> = {}
        ;(sessions as Array<{ link_id: string; last_seen_at: string | null }> | null || []).forEach((s) => {
          const cur = agg[s.link_id] || { sessions: 0, last_seen_at: null }
          cur.sessions += 1
          if (!cur.last_seen_at || (s.last_seen_at && new Date(s.last_seen_at) > new Date(cur.last_seen_at))) {
            cur.last_seen_at = s.last_seen_at
          }
          agg[s.link_id] = cur
        })
        sessionMap = new Map(Object.entries(agg))
      }
      const merged = ((linkRows as TrialLink[] | null) || []).map((l) => ({
        ...l,
        sessions: sessionMap.get(l.id)?.sessions || 0,
        last_seen_at: sessionMap.get(l.id)?.last_seen_at || null
      }))
      setLinks(merged)
    } finally {
      setLinksLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (activeTab === 'invites') {
      loadLinks()
    }
  }, [activeTab, loadLinks])

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      // Join sessions with links to compute status
      const { data, error } = await supabase
        .from('trial_sessions')
        .select(`id, link_id, created_at, last_seen_at, revoked_at, ip, country, user_agent, trial_links!inner(id, code, expires_at, enabled)`) as unknown as { data: Array<{ id: string; link_id: string; created_at: string; last_seen_at: string | null; revoked_at: string | null; ip: string | null; country: string | null; user_agent: string | null; trial_links: { id: string; code: string; expires_at: string; enabled: boolean } }>, error: { message?: string } }
      if (error) throw error
      const rows: SessionRow[] = (data || []).map((s) => ({
        id: s.id,
        link_id: s.link_id,
        created_at: s.created_at,
        last_seen_at: s.last_seen_at,
        revoked_at: s.revoked_at,
        ip: s.ip || null,
        country: s.country || null,
        user_agent: s.user_agent || null,
        link_code: s.trial_links?.code || '',
        link_expires_at: s.trial_links?.expires_at,
        link_enabled: !!s.trial_links?.enabled
      }))
      setSessions(rows)
    } catch (e: unknown) {
      console.error('Error loading sessions', e)
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (activeTab === 'sessions_active' || activeTab === 'sessions_expired') {
      loadSessions()
    }
  }, [activeTab, loadSessions])

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
      const { error } = await supabase.from('access_overrides').delete().eq('id', exists.id)
      if (!error) setOverrides(prev => prev.filter(o => o.id !== exists.id))
    } else {
      const { data, error } = await supabase
        .from('access_overrides')
        .insert([{ user_id: userId, level_group_id: payload.level_group_id || null, level_id: payload.level_id || null, lesson_id: payload.lesson_id || null }])
        .select('*')
        .single()
      if (!error && data) setOverrides(prev => [...prev, data])
    }
  }

  // Helpers for invite links
  const randomCode = () => {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(24)
      window.crypto.getRandomValues(bytes)
      return Array.from(bytes).map(b => ('0' + b.toString(16)).slice(-2)).join('')
    }
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  }

  const createInviteLink = async () => {
    if (!inviteGroupId) return
    const code = randomCode()
    const expires = new Date(Date.now() + newDurationHrs * 60 * 60 * 1000).toISOString()
    const maxUses = newMaxUses.trim() === '' ? null : parseInt(newMaxUses, 10)
    const { data: link, error } = await supabase
      .from('trial_links')
      .insert([{ code, expires_at: expires, enabled: true, max_uses: maxUses }])
      .select('*')
      .single()
    if (error || !link) return
    await supabase
      .from('trial_link_targets')
      .insert([{ link_id: link.id, level_group_id: inviteGroupId, max_courses_per_level: inviteMaxCourses }])
    await loadLinks()
  }

  const toggleLinkEnabled = async (id: string, enabled: boolean) => {
    await supabase.from('trial_links').update({ enabled: !enabled }).eq('id', id)
    await loadLinks()
  }

  const updateLinkMeta = async (id: string, fields: Partial<{ expires_at: string; max_uses: number | null }>) => {
    await supabase.from('trial_links').update(fields).eq('id', id)
    await loadLinks()
  }

  const revokeSessions = async (id: string) => {
    // Use route to avoid client RLS or permission issues
    await fetch('/api/trial/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkId: id }) })
    // Refresh both views so counts and lists update instantly
    await Promise.all([loadLinks(), loadSessions()])
  }

  // Delete entire link (and associated sessions/targets)
  const deleteLink = async (id: string) => {
    await fetch('/api/trial/delete-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkId: id }) })
    await Promise.all([loadLinks(), loadSessions()])
  }

  // Delete a single session by id
  const deleteSession = async (sessionId: string) => {
    await fetch('/api/trial/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
    // Refresh both views so counts and lists stay in sync (link is removed)
    await Promise.all([loadSessions(), loadLinks()])
  }

  const searchUser = async () => {
    setSearching(true)
    try {
      const q = query.trim()
      if (!q) return
      // Search by email first, then by id
      let { data } = await supabase.from('users').select('id,email,role').ilike('email', `%${q}%`)
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
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => setActiveTab('overrides')} className={`px-3 py-1.5 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${activeTab==='overrides' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}>Overrides</button>
          <button onClick={() => setActiveTab('invites')} className={`px-3 py-1.5 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${activeTab==='invites' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}>Invite Links</button>
          <button onClick={() => setActiveTab('sessions_active')} className={`px-3 py-1.5 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${activeTab==='sessions_active' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}>Active Sessions</button>
          <button onClick={() => setActiveTab('sessions_expired')} className={`px-3 py-1.5 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${activeTab==='sessions_expired' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-800 border hover:bg-gray-50'}`}>Expired Sessions</button>
        </div>

        {/* User search (Overrides tab) */}
        {activeTab === 'overrides' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 items-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email or user id" className="flex-1 border rounded px-3 py-2" />
            <button onClick={searchUser} disabled={searching} className="bg-indigo-600 text-white px-4 py-2 rounded transition-transform active:scale-95 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">{searching ? 'Searching…' : 'Search'}</button>
          </div>
          {searchedUser && (
            <div className="mt-3 text-sm text-gray-700">Selected user: <span className="font-medium">{searchedUser.email}</span> <span className="ml-2 text-gray-500">({searchedUser.id})</span></div>
          )}
        </div>)}

        {/* Tip: require a user before editing */}
        {activeTab === 'overrides' && !canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md px-4 py-3 mb-4 text-sm">
            Select a user to enable override checkboxes.
          </div>
        )}

        {/* Group selection and overrides */}
        {activeTab === 'overrides' && (
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
                <input type="checkbox" checked={hasGroupOverride(selectedGroupId)} onChange={() => toggleOverride({ level_group_id: selectedGroupId })} disabled={!canEdit} title={!canEdit ? 'Select a user first' : undefined} />
                <span>Unlock entire group for this user</span>
              </label>
            </div>
          )}
        </div>)}

        {/* Levels in group */}
        {activeTab === 'overrides' && selectedGroupId && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3">Courses in selected group</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {levels.map((l, idx) => (
                <div key={l.id} className={`border rounded p-3 ${selectedLevelId === l.id ? 'border-indigo-400' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{idx + 1}. {l.title}</div>
                      <label className="flex items-center gap-2 text-sm mt-1">
                        <input type="checkbox" checked={hasLevelOverride(l.id)} onChange={() => toggleOverride({ level_id: l.id })} disabled={!canEdit} title={!canEdit ? 'Select a user first' : undefined} />
                        <span>Unlock course</span>
                      </label>
                    </div>
                    <button onClick={() => setSelectedLevelId(l.id)} className="text-indigo-600 text-sm hover:text-indigo-800 hover:underline transition-colors">Lessons</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons in selected course */}
        {activeTab === 'overrides' && selectedLevelId && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3">Lessons in selected course</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lessons.map(ls => (
                <label key={ls.id} className="border rounded p-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hasLessonOverride(ls.id)} onChange={() => toggleOverride({ lesson_id: ls.id })} disabled={!canEdit} title={!canEdit ? 'Select a user first' : undefined} />
                  <span>{ls.order_index}. {ls.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Invite Links Tab */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Create Trial Invite Link</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Select Level Group</label>
                  <select className="w-full border rounded px-3 py-2" value={inviteGroupId ?? ''} onChange={(e) => setInviteGroupId(e.target.value ? parseInt(e.target.value,10) : null)}>
                    <option value="">Choose…</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">First N courses per selected group</label>
                  <input type="number" min={1} className="w-full border rounded px-3 py-2" value={inviteMaxCourses} onChange={(e) => setInviteMaxCourses(Math.max(1, parseInt(e.target.value||'1',10)))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Duration (hours)</label>
                  <input type="number" min={1} className="w-full border rounded px-3 py-2" value={newDurationHrs} onChange={(e) => setNewDurationHrs(Math.max(1, parseInt(e.target.value||'72',10)))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Max uses (blank = unlimited)</label>
                  <input className="w-full border rounded px-3 py-2" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
              </div>
              <div className="mt-4">
                <button onClick={createInviteLink} disabled={!inviteGroupId} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-transform active:scale-95 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">Create Link</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Invite Links</h2>
                <button onClick={loadLinks} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">Refresh</button>
              </div>
              {linksLoading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : (
                <div className="space-y-3">
                  {links.map(link => (
                    <div key={link.id} className="border rounded p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm">
                          <div className="font-medium">{inviteBaseUrl}{link.code}</div>
                          <div className="text-gray-600">Uses: {link.use_count}{link.max_uses ? ` / ${link.max_uses}` : ''}</div>
                          <div className="text-gray-600">Sessions: {link.sessions || 0}{link.last_seen_at ? ` • Last active: ${new Date(link.last_seen_at).toLocaleString()}` : ''}</div>
                          <div className="text-gray-600">Expires: {new Date(link.expires_at).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(`${inviteBaseUrl}${link.code}`)}
                            className="px-3 py-1.5 rounded border transition-transform active:scale-95 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => toggleLinkEnabled(link.id, link.enabled)}
                            className={`px-3 py-1.5 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${link.enabled ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {link.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => revokeSessions(link.id)}
                            className="px-3 py-1.5 rounded bg-rose-50 text-rose-700 transition-transform active:scale-95 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                          >
                            Revoke Sessions
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="px-3 py-1.5 rounded bg-red-50 text-red-700 transition-transform active:scale-95 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          >
                            Delete link
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="block text-xs mb-1 text-gray-500">Update Expiration</label>
                          <input type="datetime-local" className="w-full border rounded px-2 py-1" onChange={async (e) => {
                            const val = e.target.value
                            if (val) await updateLinkMeta(link.id, { expires_at: new Date(val).toISOString() })
                          }} />
                        </div>
                        <div>
                          <label className="block text-xs mb-1 text-gray-500">Update Max Uses</label>
                          <input className="w-full border rounded px-2 py-1" placeholder={link.max_uses?.toString() || ''} onBlur={async (e) => {
                            const v = e.target.value.trim()
                            await updateLinkMeta(link.id, { max_uses: v === '' ? null : parseInt(v, 10) })
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {links.length === 0 && <div className="text-sm text-gray-500">No links yet.</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sessions views */}
        {(activeTab === 'sessions_active' || activeTab === 'sessions_expired') && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{activeTab === 'sessions_active' ? 'Active Sessions' : 'Expired Sessions'}</h2>
              <button onClick={loadSessions} className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">Refresh</button>
            </div>
            {sessionsLoading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-2">
                {sessions
                  .filter((s) => {
                    const now = new Date()
                    const expired = !s.link_enabled || (s.link_expires_at ? new Date(s.link_expires_at) <= now : false) || !!s.revoked_at
                    return activeTab === 'sessions_active' ? !expired : expired
                  })
                  .map((s) => (
                    <div key={s.id} className="border rounded p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm">
                          <div className="font-medium">Link: {inviteBaseUrl}{s.link_code}</div>
                          <div className="text-gray-600">Created: {new Date(s.created_at).toLocaleString()} • Last seen: {s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : '—'}</div>
                          <div className="text-gray-600">IP: {s.ip || '—'}{s.country ? ` • ${s.country}` : ''}</div>
                          <div className="text-gray-600 truncate">UA: {s.user_agent || '—'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">Expires: {new Date(s.link_expires_at).toLocaleString()}</div>
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="px-2.5 py-1 rounded bg-red-50 text-red-700 text-xs transition-transform active:scale-95 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          >
                            Delete session
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {sessions.filter((s) => {
                  const now = new Date()
                  const expired = !s.link_enabled || (s.link_expires_at ? new Date(s.link_expires_at) <= now : false) || !!s.revoked_at
                  return activeTab === 'sessions_active' ? !expired : expired
                }).length === 0 && (
                  <div className="text-sm text-gray-500">No sessions.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



