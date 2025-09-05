import { NextResponse } from 'next/server';

// Mock data to simulate fetching from a database or external source
const posts = [
  { id: 1, title: 'First Post', author: { id: 101, name: 'Alice' } },
  { id: 2, title: 'Second Post', author: { id: 102, name: 'Bob' } },
  { id: 3, title: 'Third Post', author: { id: 101, name: 'Alice' } },
  { id: 4, title: 'Fourth Post', author: { id: 103, name: 'Charlie' } },
  { id: 5, title: 'Fifth Post', author: { id: 102, name: 'Bob' } },
  { id: 6, title: 'Sixth Post', author: { id: 101, name: 'Alice' } },
  { id: 7, title: 'Seventh Post', author: { id: 103, name: 'Charlie' } },
  { id: 8, title: 'Eighth Post', author: { id: 104, name: 'David' } },
];

export async function GET() {
  try {
    // 1. Count posts per author
    const postCounts = new Map<string, number>();
    posts.forEach(post => {
      const authorName = post.author.name || 'Unknown';
      postCounts.set(authorName, (postCounts.get(authorName) || 0) + 1);
    });

    // 2. Convert map to an array of objects and sort by count
    const topPosters = Array.from(postCounts.entries())
      .map(([author, count]) => ({
        author,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(topPosters);
  } catch (error) {
    console.error('Failed to generate top posters:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
