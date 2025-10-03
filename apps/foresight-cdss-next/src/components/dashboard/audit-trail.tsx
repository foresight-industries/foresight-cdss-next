import React from 'react';
import { Card } from '@/components/ui/card';

interface AuditEntry {
  message: string;
  actor: string;
  timestamp: string;
}

interface AuditTrailProps {
  entries?: AuditEntry[];
  className?: string;
}

const defaultEntries: AuditEntry[] = [
  {
    message: 'Foresight demo loaded; PA automation rules active',
    actor: 'auto',
    timestamp: new Date().toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },
  {
    message: 'System health check completed - all services operational',
    actor: 'auto',
    timestamp: new Date(Date.now() - 300000).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },
  {
    message: 'PA workflow automation enabled for Suboxone prescriptions',
    actor: 'auto',
    timestamp: new Date(Date.now() - 600000).toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
];

export function AuditTrail({ entries = defaultEntries, className = '' }: AuditTrailProps) {
  return (
    <Card className={`bg-white p-4 border shadow-sm ${className}`}>
      <h3 className="font-semibold mb-2">Audit Trail</h3>
      <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
        {entries.map((item, index) => (
          <li key={index} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
            <span className="text-gray-700">{item.message}</span>
            <span className="text-gray-500 text-xs ml-4 flex-shrink-0">{item.timestamp}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}