'use client'

import Link from 'next/link'

export default function InviteErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Link Error</h1>
        <p className="text-gray-600 mb-4">This trial invite is invalid, expired, or cannot be activated right now.</p>
        <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
          <li>• If you used an old link, ask the admin for a new one.</li>
          <li>• Make sure you opened the full URL you received.</li>
          <li>• If you are testing locally, ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local and restart.</li>
        </ul>
        <div className="flex gap-2 justify-center">
          <Link href="/" className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Home</Link>
          <Link href="/login" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Login</Link>
        </div>
      </div>
    </div>
  )
}


