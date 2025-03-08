'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function BSPLHistoryPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [yearData, setYearData] = useState({});
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setClients(result.data);
      } else {
        setClients([]);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientHistory = async (clientId) => {
    try {
      console.log('[Client] Fetching history for client:', clientId);
      const response = await fetch(`/api/client-years/history?clientId=${clientId}`);
      const data = await response.json();
      
      console.log('[Client] Raw history data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch client history');
      }

      // Format dates before setting state
      if (data.success && Array.isArray(data.years)) {
        console.log('[Client] Processing years data');
        data.years = data.years.map(year => {
          console.log('[Client] Processing year:', year.year);
          return {
            ...year,
            balanceSheetLastUpdated: year.balanceSheetLastUpdated ? new Date(year.balanceSheetLastUpdated).toLocaleString() : 'Never',
            profitLossLastUpdated: year.profitLossLastUpdated ? new Date(year.profitLossLastUpdated).toLocaleString() : 'Never'
          };
        });
        console.log('[Client] Processed years data:', JSON.stringify(data.years, null, 2));
      } else {
        console.log('[Client] No years data found or invalid format');
      }

      setYearData(prev => {
        const newData = {
          ...prev,
          [clientId]: data
        };
        console.log('[Client] Updated year data state:', JSON.stringify(newData, null, 2));
        return newData;
      });
    } catch (error) {
      console.error('[Client] Error fetching client history:', error);
      toast.error('Failed to fetch client history');
    }
  };

  const handleClientSelect = async (client) => {
    console.log('[Client] Selected client:', client);
    setSelectedClient(client);
    // Always fetch fresh data when selecting a client
    await fetchClientHistory(client.id);
  };

  const handleResume = (clientId, year) => {
    router.push(`/bspl/${clientId}/${year}`);
  };

  const handleCreateNew = (clientId) => {
    const currentYear = new Date().getFullYear();
    router.push(`/create-bspl?clientId=${clientId}&year=${currentYear}-${currentYear + 1}`);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.businessName && client.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={`skeleton-${i}`} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            BSPL History
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Clients
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                    selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </div>
                  {client.businessName && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {client.businessName}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Year History */}
          <div className="md:col-span-2">
            {selectedClient ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedClient.name}'s History
                  </h2>
                  <button
                    onClick={() => handleCreateNew(selectedClient.id)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </button>
                </div>
                <div className="p-4">
                  {yearData[selectedClient.id]?.years?.length > 0 ? (
                    <div className="space-y-4">
                      {yearData[selectedClient.id].years.map((year) => (
                        <div
                          key={year.year}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              Financial Year: {year.year}
                            </h3>
                            <button
                              onClick={() => handleResume(selectedClient.id, year.year)}
                              className="px-3 py-1 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                            >
                              Resume Work
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Balance Sheet
                              </div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                Status: {year.balanceSheet ? (
                                  <span className="text-green-600 dark:text-green-400">Complete</span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400">Not Started</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last updated: {year.balanceSheetLastUpdated}
                              </div>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                Profit & Loss
                              </div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                Status: {year.profitLoss ? (
                                  <span className="text-green-600 dark:text-green-400">Complete</span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400">Not Started</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last updated: {year.profitLossLastUpdated}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No history found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by creating a new BSPL statement
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">Select a client</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a client to view their BSPL history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 