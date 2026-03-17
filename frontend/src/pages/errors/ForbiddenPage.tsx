import React from 'react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <p className="text-white text-xl font-semibold">Access Denied</p>
        <p className="text-neutral-400 text-sm">You don't have permission to view this page.</p>
        <a href="/login" className="mt-2 text-sm text-green-400 underline hover:text-green-300">
          Back to Login
        </a>
      </div>
    </div>
  );
};
