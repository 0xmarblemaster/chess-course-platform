'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getLevelGroups, createLevelGroup, updateLevelGroup, deleteLevelGroup, type LevelGroup } from '@/lib/data'

export default function AdminLevelGroupsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [groups, setGroups] = useState<LevelGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    order_index: 0
  })

  const load = async () => {
    try {
      setLoading(true)
      const data = await getLevelGroups()
      setGroups(data)
    } catch (e) {
      setError('Failed to load level groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const created = await createLevelGroup(form)
    if (created) {
      setForm({ title: '', description: '', order_index: 0 })
      load()
    }
  }

  const handleUpdate = async (id: number, payload: Partial<LevelGroup>) => {
    const updated = await updateLevelGroup(id, payload)
    if (updated) load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this group?')) return
    const ok = await deleteLevelGroup(id)
    if (ok) load()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.manageLevelGroups', 'Manage Level Groups')}</h1>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="border rounded px-3 py-2"
              placeholder={t('admin.title', 'Title')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              className="border rounded px-3 py-2"
              placeholder={t('admin.description', 'Description')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="border rounded px-3 py-2 w-32"
                placeholder={t('admin.orderIndex', 'Order')}
                value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value || '0', 10) })}
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                {t('admin.addGroup', 'Add Group')}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-lg shadow divide-y">
            {groups.map((g) => (
              <div key={g.id} className="p-4 flex items-center gap-4">
                <input
                  className="border rounded px-3 py-2 flex-1"
                  value={g.title}
                  onChange={(e) => handleUpdate(g.id, { title: e.target.value })}
                />
                <input
                  className="border rounded px-3 py-2 flex-1"
                  value={g.description}
                  onChange={(e) => handleUpdate(g.id, { description: e.target.value })}
                />
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-32"
                  value={g.order_index}
                  onChange={(e) => handleUpdate(g.id, { order_index: parseInt(e.target.value || '0', 10) })}
                />
                <button onClick={() => handleDelete(g.id)} className="text-red-600 hover:underline">
                  {t('admin.delete', 'Delete')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
