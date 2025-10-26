'use client';

//import { useState, useEffect } from 'react';

export function SessionExpiredModal({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full text-center">
        <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
        <p className="text-sm text-gray-600 mb-4">
          Your login session has expired. Please sign in again to continue.
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
