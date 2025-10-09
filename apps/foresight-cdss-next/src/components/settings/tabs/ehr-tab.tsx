import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import Link from 'next/link';

export function EHRTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            EHR Integration
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/ehr">
              <Globe className="w-4 h-4 mr-2" />
              Manage EHR Connections
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure your Electronic Health Record system connections to enable
          data synchronization and automation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Production Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No EHR connections configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Development Environment</h4>
              <Badge variant="outline">0 connections</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No EHR connections configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported EHR Systems
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Epic",
            "Cerner",
            "athenahealth",
            "Allscripts",
            "NextGen",
            "eClinicalWorks",
          ].map((system) => (
            <div
              key={system}
              className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <p className="font-medium text-sm">{system}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                FHIR/REST API
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
