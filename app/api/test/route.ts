console.log('[build] Generating /api/test');
export async function GET() {
  console.log('🧪 Test route hit');
  return new Response('Test OK');
}
