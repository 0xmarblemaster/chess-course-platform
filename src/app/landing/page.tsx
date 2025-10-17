'use client';

import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // Redirect to the static HTML page
    window.location.href = '/landing/index.html';
  }, []);

  return null;
}
