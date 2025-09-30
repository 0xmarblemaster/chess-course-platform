'use client';

import React, { useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

export default function TestLoadingPage() {
  const [showLoading, setShowLoading] = useState(false);

  const toggleLoading = () => {
    setShowLoading(!showLoading);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Chess Loading Screen Test
        </h1>
        
        <p className="text-gray-600 mb-6">
          Click the button below to see the chess pieces loading animation!
        </p>
        
        <button
          onClick={toggleLoading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showLoading ? 'Hide Loading Screen' : 'Show Loading Screen'}
        </button>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>This loading screen features:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Animated chess pieces (♚♛♜♝♞♟)</li>
            <li>Color-changing rainbow effect</li>
            <li>3D rotation and scaling</li>
            <li>Responsive design</li>
            <li>Chess board pattern background</li>
          </ul>
        </div>
      </div>
      
      <LoadingScreen isVisible={showLoading} />
    </div>
  );
}
