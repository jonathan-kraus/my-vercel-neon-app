'use client';
import { useEffect, useState } from 'react';
import { useRequestId } from '@/app/contexts/RequestIdContext';

type CloudspaceData = {
  vercel: {
    deploymentUrl: string;
    environment: string;
    region: string;
    deploymentId: string;
    gitProvider: string;
    gitRepo: string;
    gitOwner: string;
    commitSha: string;
    commitMessage: string;
    commitAuthor: string;
  };
  neon: {
    databaseHost: string;
    databaseName: string;
    region: string;
    version: string;
    latencyMs: number;
    postCount: number;
    logCount: number;
    activeConnections: number;
  };
  consumption?: {
    activeTimeHours: number;
    computeTimeHours: number;
    dataWrittenMB: number;
    dataTransferMB: number;
    storageGBHours: number;
  };
};

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 font-medium">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-900">{value}</span>
        {badge && (
          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function EnvironmentBadge({ environment }: { environment: string }) {
  const colors = {
    production: 'bg-green-100 text-green-800',
    preview: 'bg-yellow-100 text-yellow-800',
    development: 'bg-blue-100 text-blue-800',
  } as const;

  const color = colors[environment as keyof typeof colors] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{environment}</span>
  );
}

export default function Cloudspace() {
  const [data, setData] = useState<CloudspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRequestId();

  useEffect(() => {
    async function fetchCloudspaceData() {
      try {
        // Fetch environment info
        const envResponse = await fetch('/api/env-info');
        if (!envResponse.ok) throw new Error('Failed to fetch environment info');
        const envData = await envResponse.json();

        // Fetch database status
        const dbResponse = await fetch('/api/db-status');
        if (!dbResponse.ok) throw new Error('Failed to fetch database status');
        const dbData = await dbResponse.json();

        // Try to fetch consumption metrics (may not be available)
        let consumptionData = null;
        try {
          const consumptionResponse = await fetch('/api/neon-consumption');
          if (consumptionResponse.ok) {
            const rawConsumption = await consumptionResponse.json();
            if (rawConsumption.periods && rawConsumption.periods.length > 0) {
              const period = rawConsumption.periods[0];
              consumptionData = {
                activeTimeHours: parseFloat((period.active_time_seconds / 3600).toFixed(2)),
                computeTimeHours: parseFloat((period.compute_time_seconds / 3600).toFixed(2)),
                dataWrittenMB: parseFloat((period.written_data_bytes / 1024 / 1024).toFixed(2)),
                dataTransferMB: parseFloat((period.data_transfer_bytes / 1024 / 1024).toFixed(2)),
                storageGBHours: parseFloat(
                  (period.data_storage_bytes_hour / 1024 / 1024 / 1024).toFixed(4)
                ),
              };
            }
          }
        } catch {
          console.log('Consumption metrics not available');
        }

        const cloudspaceData: CloudspaceData = {
          vercel: {
            deploymentUrl: envData.deploymentUrl || 'N/A',
            environment: envData.environment || 'development',
            region: envData.vercelRegion || 'N/A',
            deploymentId: envData.VERCEL_DEPLOYMENT_ID || 'N/A',
            gitProvider: envData.VERCEL_GIT_PROVIDER || 'N/A',
            gitRepo: envData.VERCEL_GIT_REPO_SLUG || 'N/A',
            gitOwner: envData.VERCEL_GIT_REPO_OWNER || 'N/A',
            commitSha: envData.gitCommitSha || 'N/A',
            commitMessage: envData.gitCommitMessage || 'N/A',
            commitAuthor: envData.gitCommitAuthor || 'N/A',
          },
          neon: {
            databaseHost: envData.databaseHost || 'N/A',
            databaseName: envData.databaseName || 'N/A',
            region: dbData.region || 'N/A',
            version: dbData.version || 'N/A',
            latencyMs: dbData.latencyMs || 0,
            postCount: dbData.postCount || 0,
            logCount: dbData.logCount || 0,
            activeConnections: dbData.lastActivity?.activeConnections || 0,
          },
          consumption: consumptionData || undefined,
        };

        setData(cloudspaceData);
      } catch (err) {
        console.error('Failed to fetch cloudspace data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCloudspaceData();
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading cloudspace data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Cloudspace</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No cloudspace data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-2">☁️ Cloudspace</h1>
        <p className="text-blue-100 text-lg">Your cloud infrastructure overview - Vercel + Neon</p>
      </div>

      {/* Environment Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Environment Status</h2>
            <p className="text-gray-600 mt-1">Current deployment environment</p>
          </div>
          <EnvironmentBadge environment={data.vercel.environment} />
        </div>
      </div>

      {/* Grid Layout for Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vercel Deployment Info */}
        <InfoCard title="🚀 Vercel Deployment">
          <InfoRow label="Deployment URL" value={data.vercel.deploymentUrl} />
          <InfoRow label="Region" value="  " badge={data.vercel.region} />
          {data.vercel.deploymentId !== 'N/A' && (
            <InfoRow label="Deployment ID" value={data.vercel.deploymentId} />
          )}
          {data.vercel.gitProvider !== 'N/A' && (
            <InfoRow label="Git Provider" value={data.vercel.gitProvider} />
          )}
          {data.vercel.gitOwner !== 'N/A' && data.vercel.gitRepo !== 'N/A' && (
            <InfoRow label="Repository" value={`${data.vercel.gitOwner}/${data.vercel.gitRepo}`} />
          )}
        </InfoCard>

        {/* Neon Database Info */}
        <InfoCard title="🐘 Neon Database">
          <InfoRow label="Host" value={data.neon.databaseHost} />
          {data.neon.databaseName !== 'N/A' && (
            <InfoRow label="Database" value={data.neon.databaseName} />
          )}
          <InfoRow label="Region" value=" " badge={data.neon.region} />
          <InfoRow label="PostgreSQL Version" value={data.neon.version} />
          <InfoRow label="Latency" value={`${data.neon.latencyMs} ms`} />
          <InfoRow label="Active Connections" value={String(data.neon.activeConnections)} />
        </InfoCard>

        {/* Git Commit Info */}
        {data.vercel.commitSha !== 'N/A' && (
          <InfoCard title="📝 Git Commit">
            <InfoRow label="Commit SHA" value={data.vercel.commitSha.substring(0, 8)} />
            {data.vercel.commitMessage !== 'N/A' && (
              <div className="pt-2">
                <p className="text-gray-600 font-medium mb-1">Message:</p>
                <p className="text-gray-900 text-sm italic">
                  &quot;{data.vercel.commitMessage}&quot;
                </p>
              </div>
            )}
            {data.vercel.commitAuthor !== 'N/A' && (
              <InfoRow label="Author" value={data.vercel.commitAuthor} />
            )}
          </InfoCard>
        )}

        {/* Database Statistics */}
        <InfoCard title="📊 Database Statistics">
          <InfoRow label="Total Posts" value={String(data.neon.postCount)} />
          <InfoRow label="Total Logs" value={String(data.neon.logCount)} />
          <div className="pt-2 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Database is running smoothly with {data.neon.activeConnections} active connection
              {data.neon.activeConnections !== 1 ? 's' : ''}
            </p>
          </div>
        </InfoCard>
      </div>

      {/* Consumption Metrics (if available) */}
      {data.consumption && (
        <InfoCard title="📈 Resource Consumption (Last 7 Days)">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded p-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">Active Time</p>
              <p className="text-lg font-bold text-blue-900">
                {data.consumption.activeTimeHours} hrs
              </p>
            </div>
            <div className="bg-purple-50 rounded p-3">
              <p className="text-xs text-purple-600 font-semibold mb-1">Compute Time</p>
              <p className="text-lg font-bold text-purple-900">
                {data.consumption.computeTimeHours} hrs
              </p>
            </div>
            <div className="bg-green-50 rounded p-3">
              <p className="text-xs text-green-600 font-semibold mb-1">Data Written</p>
              <p className="text-lg font-bold text-green-900">
                {data.consumption.dataWrittenMB} MB
              </p>
            </div>
            <div className="bg-orange-50 rounded p-3">
              <p className="text-xs text-orange-600 font-semibold mb-1">Data Transfer</p>
              <p className="text-lg font-bold text-orange-900">
                {data.consumption.dataTransferMB} MB
              </p>
            </div>
            <div className="bg-pink-50 rounded p-3">
              <p className="text-xs text-pink-600 font-semibold mb-1">Storage</p>
              <p className="text-lg font-bold text-pink-900">
                {data.consumption.storageGBHours} GB-hrs
              </p>
            </div>
          </div>
        </InfoCard>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">
          🔄 Data refreshed at {new Date().toLocaleString()} · Request ID:{' '}
          <code className="text-xs bg-gray-200 px-2 py-1 rounded">{requestId}</code>
        </p>
      </div>
    </div>
  );
}
