// app/context/MockUserContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';

type User = { id: string; name: string };

const MockUserContext = createContext<User | null>(null);

export function MockUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <MockUserContext.Provider value={user}>
      <button onClick={() => setUser({ id: '1', name: 'Jonathan' })}>
        Set Mock User
      </button>
      {children}
    </MockUserContext.Provider>
  );
}

export function useMockUser() {
  return useContext(MockUserContext);
}
