'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle, Eye, Edit, FileText, MessageSquare, Archive, Play, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { useRecentActivity } from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QueueFilters {
  status: 'all' | 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  priority: 'all' | 'high' | 'medium' | 'low';
  payer: 'all' | 'Aetna' | 'UnitedHealth' | 'Cigna' | 'Anthem';
  confidence: 'all' | 'high' | 'medium' | 'low';
}

const statusConfig = {
  'needs-review': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  'auto-processing': { color: 'bg-blue-100 text-blue-800', icon: Clock },
  'auto-approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'denied': { color: 'bg-red-100 text-red-800', icon: XCircle }
} as const;

export default function QueuePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QueueFilters>({
    status: 'all',
    priority: 'all',
    payer: 'all',
    confidence: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Mock data for demonstration
  const mockQueueData = [
    {
      id: 'PA-2025-001',
      patientName: 'Sarah Johnson',
      patientId: 'P12345',
      conditions: 'Type 2 Diabetes',
      attempt: 'Initial PA Request',
      medication: 'Ozempic 0.5mg/dose pen',
      payer: 'Aetna',
      status: 'needs-review' as const,
      confidence: 85,
      updatedAt: '2 hours ago'
    },
    {
      id: 'PA-2025-002',
      patientName: 'Michael Chen',
      patientId: 'P12346',
      conditions: 'Hypertension',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Eliquis 5mg',
      payer: 'UnitedHealth',
      status: 'auto-processing' as const,
      confidence: 92,
      updatedAt: '1 hour ago'
    },
    {
      id: 'PA-2025-003',
      patientName: 'Emma Rodriguez',
      patientId: 'P12347',
      conditions: 'Rheumatoid Arthritis',
      attempt: 'Step Therapy Override',
      medication: 'Humira 40mg/0.8mL',
      payer: 'Cigna',
      status: 'auto-approved' as const,
      confidence: 96,
      updatedAt: '30 minutes ago'
    },
    {
      id: 'PA-2025-004',
      patientName: 'James Wilson',
      patientId: 'P12348',
      conditions: 'Depression',
      attempt: 'Initial PA Request',
      medication: 'Trintellix 20mg',
      payer: 'Anthem',
      status: 'denied' as const,
      confidence: 65,
      updatedAt: '3 hours ago'
    },
    {
      id: 'PA-2025-005',
      patientName: 'Lisa Thompson',
      patientId: 'P12349',
      conditions: 'Migraine',
      attempt: 'Appeal Request',
      medication: 'Aimovig 70mg/mL',
      payer: 'Aetna',
      status: 'needs-review' as const,
      confidence: 78,
      updatedAt: '45 minutes ago'
    },
    {
      id: 'PA-2025-006',
      patientName: 'Robert Davis',
      patientId: 'P12350',
      conditions: 'COPD',
      attempt: 'Initial PA Request',
      medication: 'Spiriva Respimat',
      payer: 'UnitedHealth',
      status: 'auto-processing' as const,
      confidence: 89,
      updatedAt: '1.5 hours ago'
    },
    {
      id: 'PA-2025-007',
      patientName: 'Jennifer Lee',
      patientId: 'P12351',
      conditions: 'Psoriasis',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Cosentyx 150mg/mL',
      payer: 'Cigna',
      status: 'auto-approved' as const,
      confidence: 94,
      updatedAt: '20 minutes ago'
    },
    {
      id: 'PA-2025-008',
      patientName: 'David Martinez',
      patientId: 'P12352',
      conditions: 'High Cholesterol',
      attempt: 'Initial PA Request',
      medication: 'Repatha 140mg/mL',
      payer: 'Anthem',
      status: 'needs-review' as const,
      confidence: 72,
      updatedAt: '2.5 hours ago'
    },
    {
      id: 'PA-2025-009',
      patientName: 'Amanda White',
      patientId: 'P12353',
      conditions: 'Asthma',
      attempt: 'Step Therapy Override',
      medication: 'Dupixent 300mg/2mL',
      payer: 'Aetna',
      status: 'auto-processing' as const,
      confidence: 87,
      updatedAt: '40 minutes ago'
    },
    {
      id: 'PA-2025-010',
      patientName: 'Christopher Brown',
      patientId: 'P12354',
      conditions: 'Crohn\'s Disease',
      attempt: 'Initial PA Request',
      medication: 'Stelara 90mg/mL',
      payer: 'UnitedHealth',
      status: 'auto-approved' as const,
      confidence: 91,
      updatedAt: '15 minutes ago'
    }
  ];

  // Use mock data instead of API call
  const queueData = mockQueueData;
  const isLoading = false;
  const error = null;

  const filteredData = useMemo(() => {
    return queueData.filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesPayer = filters.payer === 'all' || item.payer === filters.payer;

      const confidenceLevel = item.confidence >= 90 ? 'high' : item.confidence >= 70 ? 'medium' : 'low';
      const matchesConfidence = filters.confidence === 'all' || confidenceLevel === filters.confidence;

      return matchesSearch && matchesStatus && matchesPayer && matchesConfidence;
    });
  }, [queueData, searchTerm, filters]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="auto-approved" className="bg-green-100 text-green-800">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="auto-processing" className="bg-yellow-100 text-yellow-800">Medium ({confidence}%)</Badge>;
    return <Badge variant="default" className="bg-red-100 text-red-800">Low ({confidence}%)</Badge>;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleAction = (action: string, paId: string) => {
    // Handle different actions
    switch (action) {
      case 'view':
        router.push(`/pa/${paId}`);
        break;
      case 'edit':
        alert(`Edit PA ${paId} - This would open the edit modal`);
        break;
      case 'documents':
        alert(`View documents for PA ${paId} - This would open the documents viewer`);
        break;
      case 'notes':
        alert(`Add note to PA ${paId} - This would open the notes modal`);
        break;
      case 'archive':
        alert(`Archive PA ${paId} - This would archive the PA request`);
        break;
      default:
        break;
    }
    setOpenDropdown(null);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading queue data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PA Queue</h1>
          <p className="text-gray-600">
            Manage and review prior authorization requests ({filteredData.length} items)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBatchModal(true)}>
            <Zap className="w-4 h-4 mr-2" />
            Batch Process
          </Button>
          <Button variant="primary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient, PA ID, medication, or payer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="needs-review">Needs Review</option>
                  <option value="auto-processing">Auto Processing</option>
                  <option value="auto-approved">Auto Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payer</label>
                <select
                  value={filters.payer}
                  onChange={(e) => setFilters(prev => ({ ...prev, payer: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                >
                  <option value="all">All Payers</option>
                  <option value="Aetna">Aetna</option>
                  <option value="UnitedHealth">UnitedHealth</option>
                  <option value="Cigna">Cigna</option>
                  <option value="Anthem">Anthem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                <select
                  value={filters.confidence}
                  onChange={(e) => setFilters(prev => ({ ...prev, confidence: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High (90%+)</option>
                  <option value="medium">Medium (70-89%)</option>
                  <option value="low">Low (&lt;70%)</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    status: 'all',
                    priority: 'all',
                    payer: 'all',
                    confidence: 'all'
                  })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Queue Table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading queue...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PA Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medication & Payer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/pa/${item.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            {item.id}
                          </div>
                          <div className="text-sm text-gray-500">{item.attempt}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.patientName}</div>
                          <div className="text-sm text-gray-500">{item.patientId}</div>
                          {item.conditions && (
                            <div className="text-xs text-gray-400 mt-1">{item.conditions}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.medication}</div>
                          <div className="text-sm text-gray-500">{item.payer}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className="w-4 h-4 mr-2" />
                          <Badge className={statusConfig[item.status].color}>
                            {item.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getConfidenceBadge(item.confidence)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === item.id ? null : item.id);
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>

                          {openDropdown === item.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('view', item.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('edit', item.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit PA
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('documents', item.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Documents
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('notes', item.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Add Note
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction('archive', item.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filteredData.length === 0 && !isLoading && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No prior authorization requests match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  status: 'all',
                  priority: 'all',
                  payer: 'all',
                  confidence: 'all'
                });
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </Card>

      {/* Batch Processing Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                Batch Process PAs
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Criteria</label>
                  <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Current filtered results ({filteredData.length} PAs)</option>
                    <option>All pending PAs</option>
                    <option>High confidence PAs (≥90%)</option>
                    <option>PAs older than 24 hours</option>
                    <option>Specific payer PAs</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="autoApprove" defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="autoApprove" className="text-sm text-gray-700">Auto-approve eligible PAs</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sendNotifications" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="sendNotifications" className="text-sm text-gray-700">Send notifications on completion</label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      This will process {filteredData.length} PAs based on your current filters. 
                      High-confidence PAs (≥90%) will be automatically approved.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowBatchModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    alert(`Starting batch processing of ${filteredData.length} PAs...`);
                    setShowBatchModal(false);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Processing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
