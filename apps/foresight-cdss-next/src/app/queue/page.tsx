'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRecentActivity } from '@/hooks/use-dashboard-data';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QueueFilters>({
    status: 'all',
    priority: 'all',
    payer: 'all',
    confidence: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: queueData = [], isLoading, error } = useRecentActivity(50);

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
    if (confidence >= 90) return <Badge variant="secondary" className="bg-green-100 text-green-800">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium ({confidence}%)</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Low ({confidence}%)</Badge>;
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
          <Button variant="outline" size="sm">
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
            variant="outline" 
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
                  variant="outline" 
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
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/pa/${item.id}`} className="block">
                          <div>
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                              {item.id}
                            </div>
                            <div className="text-sm text-gray-500">{item.attempt}</div>
                          </div>
                        </Link>
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
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
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
              variant="outline" 
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
    </div>
  );
}