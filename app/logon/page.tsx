'use client';

import { useUser, SignInButton } from '@stackframe/react';

export default function LogonPage() {
  const { user, isLoading } = useUser();

  if (isLoading) return <p>Loading...</p>;

  if (user) {
    return (
      <div>
        <h1>✅ You're signed in!</h1>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>🔐 Please sign in</h1>
      <SignInButton />
    </div>
  );
}
