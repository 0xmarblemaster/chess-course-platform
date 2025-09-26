'use client'

const SimpleAdminPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Simple Admin Page</h1>
      <p className="mt-4 text-gray-600">This is a simple admin page without any AdminRoute wrapper.</p>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800">Admin Functions</h2>
        <div className="mt-4 space-y-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Add New Course
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Add New Lesson
          </button>
        </div>
      </div>
    </div>
  )
}

export default SimpleAdminPage