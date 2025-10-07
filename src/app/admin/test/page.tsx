'use client'

import SimpleAdminRoute from '@/components/SimpleAdminRoute'

const TestAdminPage = () => {
  return (
    <SimpleAdminRoute>
      <div
        className="min-h-screen p-8"
        style={{
          backgroundImage:
            'linear-gradient(107.7deg, rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3%)'
        }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Test Admin Page</h1>
        <p className="mt-4 text-gray-600">This is a test admin page to check if the SimpleAdminRoute works.</p>
      </div>
    </SimpleAdminRoute>
  )
}

export default TestAdminPage