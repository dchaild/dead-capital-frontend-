// components/CREWorkflowStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/contracts';

interface WorkflowExecution {
  executionId: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  assetsProcessed: number;
  txHash?: string;
}

export default function CREWorkflowStatus() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cre-status.php`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setExecutions(data.executions || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch CRE status:', err);
        setError('Unable to connect to PHP API');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">CRE Workflow Status</h3>
          <p className="text-sm text-gray-500 mt-1">
            Fetches validated assets every 6 hours
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600">Active</span>
        </div>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-500 mt-2">Loading executions...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 mb-2">⚠️ {error}</p>
            <p className="text-sm text-gray-500">
              Make sure PHP API is running at {API_BASE_URL}
            </p>
          </div>
        ) : executions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No recent executions</p>
            <p className="text-sm mt-2">Workflow will run every 6 hours</p>
          </div>
        ) : (
          executions.map((execution) => (
            <ExecutionRow key={execution.executionId} execution={execution} />
          ))
        )}
      </div>
    </div>
  );
}

function ExecutionRow({ execution }: { execution: WorkflowExecution }) {
  const statusConfig = {
    success: { color: 'green', icon: '✅', label: 'Success', bg: 'bg-green-50' },
    pending: { color: 'yellow', icon: '⏳', label: 'Pending', bg: 'bg-yellow-50' },
    failed: { color: 'red', icon: '❌', label: 'Failed', bg: 'bg-red-50' },
  };

  const config = statusConfig[execution.status];
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`p-4 hover:bg-gray-50 transition ${config.bg} hover:${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{config.label}</span>
              <span className="text-sm text-gray-500">
                • {formatTime(execution.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Processed {execution.assetsProcessed} asset{execution.assetsProcessed !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {execution.txHash && (
          <a
            href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.arbiscan.io'}/tx/${execution.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View TX →
          </a>
        )}
      </div>
    </div>
  );
}
