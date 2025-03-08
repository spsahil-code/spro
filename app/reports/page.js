'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ReportsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Function to get Indian financial year options
  const getFinancialYearOptions = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentFY = currentMonth < 3 ? currentYear - 1 : currentYear;
    
    const years = [];
    // Show 5 years before and 5 years after current year
    for (let i = -5; i <= 5; i++) {
      const year = currentFY + i;
      years.push({
        value: `${year}-${year + 1}`,
        label: `FY ${year}-${(year + 1).toString().slice(2)}`,
      });
    }
    return years;
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const result = await response.json();
        console.log('Fetched clients:', result); // Debug log
        if (result.success && Array.isArray(result.data)) {
          setClients(result.data);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Handle client selection change
  const handleClientChange = (e) => {
    const clientId = e.target.value;
    console.log('Selected client:', clientId); // Debug log
    setSelectedClient(clientId);
  };

  // Handle year selection change
  const handleYearChange = (e) => {
    const year = e.target.value;
    console.log('Selected year:', year); // Debug log
    setSelectedYear(year);
  };

  const handleDownloadPDF = async () => {
    if (!selectedClient || !selectedYear) {
      toast.error('Please select both client and year');
      return;
    }

    try {
      setDownloadLoading(true);
      console.log('Downloading PDF for:', { clientId: selectedClient, year: selectedYear }); // Debug log
      const response = await fetch(`/api/reports/pdf/${selectedClient}/${selectedYear}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PDF generation failed:', errorData);
        throw new Error(errorData.message || 'Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Financial_Statements_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedClient || !selectedYear) {
      toast.error('Please select both client and year');
      return;
    }

    try {
      setDownloadLoading(true);
      const response = await fetch(`/api/reports/excel/${selectedClient}/${selectedYear}`);
      if (!response.ok) throw new Error('Failed to generate Excel');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Financial_Statements_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!selectedClient || !selectedYear) {
      toast.error('Please select both client and year');
      return;
    }

    try {
      setDownloadLoading(true);
      
      // Format the client ID to match Firebase storage format (using only client name)
      const formattedClientId = selectedClient
        .toLowerCase()
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove any other special characters
        .replace(/_+/g, '_')        // Replace multiple underscores with single
        .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
      
      console.log('Previewing PDF for:', { 
        originalClientId: selectedClient,
        formattedClientId,
        year: selectedYear,
        selectedClient: clients.find(c => c.name === selectedClient)
      });
      
      const response = await fetch(`/api/reports/pdf/${formattedClientId}/${selectedYear}?preview=true`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('PDF preview failed:', errorData);
        
        // Handle specific error cases
        if (response.status === 404) {
          if (errorData.message === 'Client not found') {
            toast.error(`Client not found. Please try again or contact support.`);
          } else if (errorData.message === 'No financial data available for this client and year') {
            toast.error('No financial data available for the selected year.');
          } else {
            toast.error(errorData.message || 'Failed to generate PDF preview');
          }
        } else {
          toast.error(errorData.message || 'Failed to generate PDF preview');
        }
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Reports</h3>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Financial Reports
          </h1>

          <div className="space-y-6">
            {/* Client Selector */}
            <div className="space-y-2">
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Client
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={handleClientChange}
                className="form-select block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                required
              >
                <option value="">Choose a client...</option>
                {Array.isArray(clients) && clients.map((client) => (
                  <option key={client.directory} value={client.name}>
                    {client.name} {client.businessName ? `- ${client.businessName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Year Selector */}
            <div className="space-y-2">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Financial Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={handleYearChange}
                className="form-select block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                required
              >
                <option value="">Choose a year...</option>
                {getFinancialYearOptions().map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <button
                onClick={handlePreviewPDF}
                disabled={downloadLoading || !selectedClient || !selectedYear}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {downloadLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                Preview
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloadLoading || !selectedClient || !selectedYear}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {downloadLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Download PDF
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={downloadLoading || !selectedClient || !selectedYear}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {downloadLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Download Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                PDF Preview
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={pdfUrl}
                className="w-full h-[80vh] rounded-lg border border-gray-200 dark:border-gray-700"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 