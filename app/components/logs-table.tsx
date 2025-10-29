'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Card } from '@/app/components/ui/card';

interface Log {
  id: number;
  level: string;
  message: string;
  context: any;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  module: string | null;
  request_id: string | null;
  created_at: string;
}

interface LogsTableProps {
  logs: Log[];
  totalCount: number;
  currentPage: number;
  limit: number;
  modules: string[];
  levels: string[];
  currentLevel?: string;
  currentModule?: string;
  currentRequestId?: string;
}

export function LogsTable({
  logs,
  totalCount,
  currentPage,
  limit,
  modules,
  levels,
  currentLevel,
  currentModule,
  currentRequestId,
}: LogsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentRequestId || '');

  const totalPages = Math.ceil(totalCount / limit);

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page when filtering
    router.push(`/admin/logs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/logs?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilters('requestId', searchValue || null);
  };

  const clearFilters = () => {
    router.push('/admin/logs');
    setSearchValue('');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'default';
      case 'info':
        return 'secondary';
      case 'debug':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const hasActiveFilters = currentLevel || currentModule || currentRequestId;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Search by Request ID</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter request ID..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 w-full md:w-48">
            <label className="text-sm font-medium text-foreground">Level</label>
            <select
              value={currentLevel || 'all'}
              onChange={(e) =>
                updateFilters('level', e.target.value === 'all' ? null : e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 w-full md:w-48">
            <label className="text-sm font-medium text-foreground">Module</label>
            <select
              value={currentLevel || 'all'}
              onChange={(e) =>
                updateFilters('level', e.target.value === 'all' ? null : e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {logs.length === 0 ? 0 : (currentPage - 1) * limit + 1} to{' '}
          {Math.min(currentPage * limit, totalCount)} of {totalCount} logs
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-32">Time</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-48">Module</TableHead>
              <TableHead className="w-32">Request ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell>
                    <Badge variant={getLevelColor(log.level)} className="font-mono text-xs">
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate text-sm">{log.message}</div>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {JSON.stringify(log.context)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{log.module || '-'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {log.request_id ? (
                      <button
                        onClick={() => updateFilters('requestId', log.request_id)}
                        className="hover:text-foreground transition-colors"
                      >
                        {log.request_id.slice(0, 12)}...
                      </button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-10"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
