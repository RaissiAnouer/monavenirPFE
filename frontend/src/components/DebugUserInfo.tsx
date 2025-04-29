import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugUserInfo = () => {
  const { user } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}; 