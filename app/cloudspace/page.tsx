// app/cloudspace/page.tsx
import Cloudspace from '@/app/components/Cloudspace';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

console.log('[build] Generating /cloudspace page');

const requestId = generateUUID();
const log = createLogger('app/cloudspace/page.tsx', requestId);

export default function CloudspacePage() {
  log.info('Rendering /cloudspace page', {
    action: 'render page: /cloudspace',
    timestamp: new Date().toISOString(),
  });
  console.log(`🚀 [${requestId}] /cloudspace page rendering`);

  return (
    <main className="p-6">
      <Cloudspace />
    </main>
  );
}
