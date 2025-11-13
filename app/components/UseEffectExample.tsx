'use client';

import { useEffect, useState } from 'react';

/**
 * useEffect runs AFTER the component renders
 * Think of it as: "When X happens, do Y"
 */
export function UseEffectExample() {
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Example 1: Run ONCE when component mounts (like componentDidMount)
  // Empty dependency array [] means "only run after first render"
  useEffect(() => {
    console.log('🚀 Component mounted! This runs ONCE');

    // Cleanup function (optional) - runs when component unmounts
    return () => {
      console.log('💀 Component unmounting! Cleanup here');
    };
  }, []); // <- Empty array = run once on mount

  // Example 2: Run EVERY TIME count changes
  // [count] means "run this whenever count changes"
  useEffect(() => {
    console.log(`🔄 Count changed to: ${count}`);

    // Example: Update document title
    document.title = `Count: ${count}`;
  }, [count]); // <- Re-run when count changes

  // Example 3: Fetch data on mount (common pattern)
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        setUsername(data.username || 'Guest');
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUsername('Error');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []); // <- Only fetch once on mount

  // Example 4: No dependency array = runs after EVERY render (usually bad!)
  // useEffect(() => {
  //   console.log('⚠️ This runs TOO MUCH - after every render!');
  // }); // <- No array = runs every time

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>useEffect Examples</h2>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Example 1 & 2: State & Side Effects</h3>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment (watch console!)</button>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          💡 Click the button and check your browser console
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Example 3: Data Fetching</h3>
        {loading ? <p>Loading user...</p> : <p>Username: {username}</p>}
      </div>

      <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <h4>🧠 useEffect Mental Model:</h4>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
          {`useEffect(() => {
  // What to DO
  // Runs AFTER render
}, [dependencies]);
   ^ When to do it

• [] = run once on mount
• [count] = run when count changes
• No array = run after EVERY render (dangerous!)
• return () => {} = cleanup function`}
        </pre>
      </div>
    </div>
  );
}
