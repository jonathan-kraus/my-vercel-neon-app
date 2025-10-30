import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LogsPage() {
  // This page is deprecated in favor of /admin/logs/viewer
  // Redirect immediately to the new viewer
  redirect('/admin/logs/viewer');
}
