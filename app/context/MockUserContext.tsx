'use client';
import { createContext, useContext, useState } from 'react';

type User = { id: string; name: string };

const UserContext = createContext<User | null>(null);
const SetUserContext = createContext<((user: User) => void) | null>(null);

export function MockUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={user}>
      <SetUserContext.Provider value={setUser}>
        {children}
      </SetUserContext.Provider>
    </UserContext.Provider>
  );
}

export function useMockUser() {
  return useContext(UserContext);
}

export function useMockUserSetter() {
  const setter = useContext(SetUserContext);
  if (!setter) throw new Error('useMockUserSetter must be used within MockUserProvider');
  return setter;
}
