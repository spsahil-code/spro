'use client';
import React, { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ViewClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedClient, setExpandedClient] = useState(null);
  const [yearStatus, setYearStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, clientId: null });
  const [editingClient, setEditingClient] = useState(null);
  const [editModal, setEditModal] = useState({ show: false, client: null });
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

  // Function to check if client data exists for a specific year
  const checkClientYearData = async (clientId, clientName, year) => {
    try {
      setLoadingStatus(prev => ({
        ...prev,
        [`${clientId}-${year}`]: true
      }));
      
      const response = await fetch(`/api/client-years/check?clientId=${clientId}&year=${year}`);
      const data = await response.json();
      
      setYearStatus(prev => ({
        ...prev,
        [`${clientId}-${year}`]: data
      }));
    } catch (error) {
      console.error(`Error checking data for client ${clientId} year ${year}:`, error);
      setYearStatus(prev => ({
        ...prev,
        [`${clientId}-${year}`]: {
          balance_sheet: false,
          profit_loss: false,
          error: true
        }
      }));
    } finally {
      setLoadingStatus(prev => ({
        ...prev,
        [`${clientId}-${year}`]: false
      }));
    }
  };

  useEffect(() => {
    // When a client is expanded, check data for recent years
    if (expandedClient) {
      const client = clients.find(c => c.directory === expandedClient);
      if (client) {
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 3; i++) {
          const year = `${currentYear - i}-${currentYear - i + 1}`;
          checkClientYearData(client.directory, client.name, year);
        }
      }
    }
  }, [expandedClient, clients]);

  const handleDelete = async (clientId) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete client');
      }

      toast.success('Client deleted successfully');
      setClients(clients.filter(client => client.directory !== clientId));
      setDeleteModal({ show: false, clientId: null });
    } catch (error) {
      toast.error(error.message || 'Failed to delete client');
      console.error('Error deleting client:', error);
    }
  };

  const handleEdit = async (e, clientId) => {
    e.preventDefault();
    try {
      if (!editingClient) {
        throw new Error('No client data to update');
      }
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingClient.name || "",
          businessName: editingClient.businessName || "",
          pan: editingClient.pan || "",
          gst: editingClient.gst || "",
          email: editingClient.email || "",
          phone: editingClient.phone || "",
          whatsapp: editingClient.whatsapp || "",
          address: editingClient.address || "",
          city: editingClient.city || "",
          state: editingClient.state || "",
          pincode: editingClient.pincode || ""
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update client');
      }

      toast.success('Client updated successfully');
      // Refresh clients list to show updated data
      fetchClients();
      setEditingClient(null);
      setEditModal({ show: false, client: null });
    } catch (error) {
      toast.error(error.message || 'Failed to update client');
      console.error('Error updating client:', error);
    }
  };

  const handleViewBSPL = (clientId) => {
    const currentYear = new Date().getFullYear();
    router.push(`/bspl/${clientId}/${currentYear}-${currentYear + 1}`);
  };

  const filteredClients = clients.filter(client => {
    const searchString = searchTerm.toLowerCase();
    return (
      (client.name?.toLowerCase() || '').includes(searchString) ||
      (client.businessName?.toLowerCase() || '').includes(searchString) ||
      (client.pan?.toLowerCase() || '').includes(searchString) ||
      (client.gst?.toLowerCase() || '').includes(searchString)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleClientExpansion = (clientId) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  // Function to get status text based on data availability
  const getStatusText = (status, type) => {
    if (!status) return <span className="text-gray-600">No Data</span>;
    if (status.error) return <span className="text-red-600">Error</span>;
    
    if (type === 'balance_sheet') {
      return status.balance_sheet ? 
        <span className="text-green-600">Available</span> : 
        <span className="text-yellow-600">Missing</span>;
    } else {
      return status.profit_loss ? 
        <span className="text-green-600">Available</span> : 
        <span className="text-yellow-600">Missing</span>;
    }
  };

  const handleClientClick = (clientId) => {
    router.push(`/view-client/${clientId}`);
  };

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
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clients ({filteredClients.length})
          </h1>
          <div className="flex items-center gap-4">
              <div className="relative flex-1 md:flex-none">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
            <Link
              href="/client"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Client
            </Link>
              </div>
            </div>
            </div>
          </div>

        {/* Clients List/Grid */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new client'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                          {client.businessName && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{client.businessName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{client.phone || '-'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{client.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {client.pan && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            PAN
                          </span>
                        )}
                        {client.gst && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            GST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewBSPL(client.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          View BSPL
                        </button>
                        <Link
                          href={`/client/${client.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ show: true, clientId: client.id })}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
            <motion.div
                key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{client.name}</h3>
                      {client.businessName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.businessName}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {client.pan && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          PAN
                        </span>
                      )}
                      {client.gst && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          GST
                        </span>
                      )}
                          </div>
                        </div>
                  <div className="mt-4 space-y-2">
                          {client.phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {client.email}
                            </p>
                          )}
                        </div>
                      </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex justify-between items-center">
                        <button
                      onClick={() => handleViewBSPL(client.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                    >
                      View BSPL
                        </button>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/client/${client.id}`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium"
                      >
                        Edit
                      </Link>
                        <button
                        onClick={() => setDeleteModal({ show: true, clientId: client.id })}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                        >
                        Delete
                        </button>
                      </div>
                    </div>
                                      </div>
            </motion.div>
          ))}
                                  </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModal.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Client
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this client? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, clientId: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteModal.clientId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                  >
                    Delete
                  </button>
                            </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}