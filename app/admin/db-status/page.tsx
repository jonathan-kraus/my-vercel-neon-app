import DbStatus from '@/app/components/DbStatus';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

console.log('[build] Generating /admin/db-status page');
const log = createLogger('app/admin/db-status/page.tsx');
const requestId = generateUUID();
export default function DbStatusPage() {
  log.info('Rendering /admin/db-status page', {
    'action: render page: /admin/db-status timestamp: ': +new Date().toISOString(),
  });
  console.log(`🚀 [${requestId}] /admin/db-status page rendering`);
  return (
    <main className="p-6">
      <DbStatus />
    </main>
  );
}
