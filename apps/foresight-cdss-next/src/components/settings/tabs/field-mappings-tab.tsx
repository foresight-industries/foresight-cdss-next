import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface FieldMappingsTabProps {
  // No specific settings needed for this tab - it's mostly static information
}

export function FieldMappingsTab({}: FieldMappingsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Field Mappings
          </h3>
          <Button variant="outline" asChild>
            <Link href="/settings/field-mappings">
              <Settings className="w-4 h-4 mr-2" />
              Manage Field Mappings
            </Link>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configure custom field mapping rules for data integration between EHR
          systems and your team's workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Active Mappings</h4>
              <Badge variant="outline">0 mappings</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No field mappings configured
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Validation Rules</h4>
              <Badge variant="outline">0 rules</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No validation rules configured
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Entity Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Patient",
            "Provider",
            "Claim",
            "Prior Auth",
            "Medication",
            "Diagnosis",
            "Procedure",
            "Insurance",
          ].map((entity) => (
            <div
              key={entity}
              className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <p className="font-medium text-sm">{entity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Field Mapping
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supported Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Data Transformations
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Text formatting (upper/lower case, trim)</li>
              <li>• Phone number formatting</li>
              <li>• Date/time conversion</li>
              <li>• Name parsing and extraction</li>
              <li>• Custom transformation functions</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Validation Rules
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Required field validation</li>
              <li>• Format validation (email, phone)</li>
              <li>• Length and pattern matching</li>
              <li>• Custom validation rules</li>
              <li>• Blocking vs. warning rules</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}