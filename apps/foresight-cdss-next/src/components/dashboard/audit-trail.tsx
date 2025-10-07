import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AuditEntry {
  id?: string;
  message: string;
  actor?: string | null;
  timestamp: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
  className?: string;
}

export function AuditTrail({ entries, className = '' }: AuditTrailProps) {
  return (
    <Card className={`bg-card border shadow-xs ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Audit trail</CardTitle>
          <p className="text-sm text-muted-foreground">Latest events across claims and ePA automations</p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-3">
          {entries.length === 0 ? (
            <li className="text-muted-foreground">No audit events found.</li>
          ) : (
            entries.map((item) => (
              <li key={item.id ?? `${item.message}-${item.timestamp}`}
                  className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-foreground font-medium">{item.message}</p>
                  {item.actor ? (
                    <p className="text-xs text-muted-foreground">By {item.actor}</p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timestamp}</span>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}