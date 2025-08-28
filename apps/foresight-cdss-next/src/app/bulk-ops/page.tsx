'use client';

import { useState } from 'react';
import { Upload, Download, Play, Pause, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'batch_process' | 'status_update';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  name: string;
  description: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt: string;
  estimatedCompletion?: string;
  errorCount?: number;
}

const mockOperations: BulkOperation[] = [
  {
    id: '1',
    type: 'batch_process',
    status: 'running',
    name: 'January PA Batch Processing',
    description: 'Processing 342 pending PAs for automated approval',
    progress: 67,
    totalItems: 342,
    processedItems: 229,
    startedAt: '2025-01-28T09:15:00Z',
    estimatedCompletion: '2025-01-28T11:45:00Z',
    errorCount: 3
  },
  {
    id: '2',
    type: 'import',
    status: 'completed',
    name: 'Patient Data Import',
    description: 'Imported patient records from EMR system',
    progress: 100,
    totalItems: 156,
    processedItems: 156,
    startedAt: '2025-01-28T08:00:00Z',
    errorCount: 0
  },
  {
    id: '3',
    type: 'export',
    status: 'pending',
    name: 'Monthly PA Report Export',
    description: 'Export December PA performance report',
    progress: 0,
    totalItems: 1247,
    processedItems: 0,
    startedAt: '2025-01-28T10:00:00Z'
  }
];

const operationTypeConfig = {
  import: { icon: Upload, color: 'bg-blue-100 text-blue-800', label: 'Import' },
  export: { icon: Download, color: 'bg-green-100 text-green-800', label: 'Export' },
  batch_process: { icon: Play, color: 'bg-purple-100 text-purple-800', label: 'Batch Process' },
  status_update: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Status Update' }
};

const statusConfig = {
  pending: { icon: Clock, color: 'bg-gray-100 text-gray-800' },
  running: { icon: Play, color: 'bg-blue-100 text-blue-800' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-800' },
  paused: { icon: Pause, color: 'bg-yellow-100 text-yellow-800' }
};

export default function BulkOperationsPage() {
  const [operations, setOperations] = useState<BulkOperation[]>(mockOperations);
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [newOperationType, setNewOperationType] = useState<'import' | 'export' | 'batch_process'>('batch_process');

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const handlePauseResume = (id: string, currentStatus: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { ...op, status: currentStatus === 'running' ? 'paused' : 'running' as any }
        : op
    ));
  };

  const handleCancel = (id: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { ...op, status: 'failed' as any }
        : op
    ));
  };

  const startNewOperation = () => {
    const newOp: BulkOperation = {
      id: (operations.length + 1).toString(),
      type: newOperationType,
      status: 'pending',
      name: `New ${newOperationType.replace('_', ' ')} Operation`,
      description: `Started ${new Date().toLocaleString()}`,
      progress: 0,
      totalItems: 100,
      processedItems: 0,
      startedAt: new Date().toISOString()
    };
    
    setOperations(prev => [newOp, ...prev]);
    setShowNewOperation(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="text-gray-600">
            Manage large-scale PA processing and data operations
          </p>
        </div>
        
        <Button onClick={() => setShowNewOperation(true)}>
          <Play className="w-4 h-4 mr-2" />
          New Operation
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Running Operations</p>
              <p className="text-3xl font-bold text-blue-600">
                {operations.filter(op => op.status === 'running').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-3xl font-bold text-green-600">
                {operations.filter(op => op.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items Processed</p>
              <p className="text-3xl font-bold text-purple-600">
                {operations.reduce((sum, op) => sum + op.processedItems, 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Error Rate</p>
              <p className="text-3xl font-bold text-red-600">
                {operations.length > 0 
                  ? ((operations.reduce((sum, op) => sum + (op.errorCount || 0), 0) / 
                     operations.reduce((sum, op) => sum + op.processedItems, 1)) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* New Operation Modal */}
      {showNewOperation && (
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Operation</h3>
            <Button variant="ghost" onClick={() => setShowNewOperation(false)}>×</Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['batch_process', 'import', 'export'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewOperationType(type)}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      newOperationType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {operationTypeConfig[type].label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {newOperationType === 'batch_process' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Criteria</label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3">
                    <option>All pending PAs</option>
                    <option>High confidence PAs (≥90%)</option>
                    <option>PAs older than 24 hours</option>
                    <option>Specific payer PAs</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                  <label className="text-sm text-gray-700">Auto-approve eligible PAs</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4 text-blue-600" />
                  <label className="text-sm text-gray-700">Send notifications on completion</label>
                </div>
              </div>
            )}

            {newOperationType === 'import' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3">
                    <option>EMR System</option>
                    <option>Insurance Database</option>
                    <option>CSV File Upload</option>
                    <option>External API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                  <input type="file" className="w-full border border-gray-300 rounded-md py-2 px-3" />
                </div>
              </div>
            )}

            {newOperationType === 'export' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3">
                    <option>Excel (.xlsx)</option>
                    <option>CSV</option>
                    <option>PDF Report</option>
                    <option>JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="border border-gray-300 rounded-md py-2 px-3" />
                    <input type="date" className="border border-gray-300 rounded-md py-2 px-3" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewOperation(false)}>
                Cancel
              </Button>
              <Button onClick={startNewOperation}>
                Start Operation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Operations List */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Operations</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {operations.map((operation) => {
            const TypeIcon = operationTypeConfig[operation.type].icon;
            const StatusIcon = statusConfig[operation.status].icon;
            
            return (
              <div key={operation.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <TypeIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{operation.name}</h3>
                        <Badge className={operationTypeConfig[operation.type].color}>
                          {operationTypeConfig[operation.type].label}
                        </Badge>
                        <Badge className={statusConfig[operation.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {operation.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{operation.description}</p>
                      
                      {operation.status === 'running' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {operation.processedItems} of {operation.totalItems} items
                            </span>
                            <span className="text-gray-600">{operation.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${operation.progress}%` }}
                            ></div>
                          </div>
                          {operation.estimatedCompletion && (
                            <p className="text-xs text-gray-500">
                              Est. completion: {formatDate(operation.estimatedCompletion)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span>Started: {formatDate(operation.startedAt)}</span>
                        {operation.status === 'completed' && (
                          <span>Duration: {formatDuration(operation.startedAt)}</span>
                        )}
                        {operation.errorCount !== undefined && operation.errorCount > 0 && (
                          <span className="text-red-600">
                            {operation.errorCount} errors
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {operation.status === 'running' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseResume(operation.id, operation.status)}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {operation.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseResume(operation.id, operation.status)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {['running', 'paused'].includes(operation.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(operation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {operation.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}