'use client'

import SimpleAdminRoute from '@/components/SimpleAdminRoute'

const TestAdminPage = () => {
  return (
    <SimpleAdminRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Admin Page</h1>
        <p className="mt-4 text-gray-600">This is a test admin page to check if the SimpleAdminRoute works.</p>
      </div>
    </SimpleAdminRoute>
  )
}

export default TestAdminPage