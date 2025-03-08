'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BalanceSheet from '../../../../components/BalanceSheet';
import TradingProfitLoss from '../../../../components/TradingProfitLoss';
import PreviousBalanceSheet from '../../../../components/PreviousBalanceSheet';
import PreviousTradingProfitLoss from '../../../../components/PreviousTradingProfitLoss';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function BSPLPage({ params }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('balancesheet');
  const [clientInfo, setClientInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileStatus, setFileStatus] = useState({
    balance_sheet: false,
    profit_loss: false
  });
  const [showPreviousYear, setShowPreviousYear] = useState(false);
  const [previousYearExists, setPreviousYearExists] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Calculate previous year
  const calculatePreviousYear = (year) => {
    if (!year || !year.includes('-')) return null;
    const [startYear, endYear] = year.split('-').map(y => parseInt(y));
    return `${startYear - 1}-${endYear - 1}`;
  };

  const previousYear = calculatePreviousYear(params.year);

  // Toggle previous year preview
  const togglePreviousYearPreview = () => {
    setShowPreviousYear(!showPreviousYear);
  };

  useEffect(() => {
    const checkPreviousYearData = async () => {
      if (!previousYear) return;
      try {
        const response = await fetch(`/api/client-years/check?clientId=${params.clientId}&year=${previousYear}`);
        if (response.ok) {
          const data = await response.json();
          setPreviousYearExists(data.balance_sheet || data.profit_loss);
        }
      } catch (error) {
        console.error('Error checking previous year data:', error);
      }
    };

    checkPreviousYearData();
  }, [params.clientId, previousYear]);

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch client info
        const clientResponse = await fetch(`/api/clients/${params.clientId}`);
        if (!clientResponse.ok) {
          throw new Error('Failed to fetch client info');
        }
        const clientData = await clientResponse.json();
        
        if (!clientData.success || !clientData.data) {
          throw new Error('Invalid client data');
        }
        
        setClientInfo(clientData.data);
        
        // Check if files exist for current year
        const checkResponse = await fetch(`/api/client-years/check?clientId=${params.clientId}&year=${params.year}`);
        if (!checkResponse.ok) {
          throw new Error('Failed to check file status');
        }
        
        const statusData = await checkResponse.json();
        if (!statusData.success) {
          throw new Error(statusData.error || 'Failed to check file status');
        }
        
        // Add a small delay to ensure we get the latest status
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setFileStatus({
          balance_sheet: statusData.balance_sheet || false,
          profit_loss: statusData.profit_loss || false
        });

        // Set initial active tab to the one that has data
        if (!statusData.balance_sheet && statusData.profit_loss) {
          setActiveTab('profitloss');
        }
      } catch (error) {
        console.error('Error in BSPLPage:', error);
        setFileStatus({
          balance_sheet: false,
          profit_loss: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.clientId && params.year) {
      fetchClientInfo();
    }
  }, [params.clientId, params.year]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Render no data state if both files are missing
  if (!fileStatus.balance_sheet && !fileStatus.profit_loss && !isCreatingNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No Financial Data Available</h2>
          <p className="mt-2 text-gray-600">
            Would you like to create a new financial statement for {clientInfo?.name || 'this client'} for the year {params.year}?
          </p>
          <div className="mt-6 space-y-3">
            <button 
              onClick={() => setIsCreatingNew(true)}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Statement
            </button>
            <Link 
              href="/view-client" 
              className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Clients List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show forms for creating new statement
  if (isCreatingNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Financial Statement</h1>
                <p className="text-gray-600">
                  {clientInfo?.name} - {params.year}
                </p>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <BalanceSheet clientId={params.clientId} year={params.year} />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <TradingProfitLoss clientId={params.clientId} year={params.year} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header with client info and year */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Financial Statements</h1>
              <div className="mt-2">
              <h2 className="text-xl font-semibold text-gray-800">{clientInfo?.name}</h2>
              <p className="text-gray-600">Financial Year: {params.year}</p>
              </div>
          </div>

          {/* Tabs for switching between sheets */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex -mb-px">
            <button
              onClick={() => setActiveTab('balancesheet')}
                  disabled={!fileStatus.balance_sheet}
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                activeTab === 'balancesheet'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!fileStatus.balance_sheet ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Balance Sheet {!fileStatus.balance_sheet && '(No Data)'}
            </button>
            <button
                  onClick={() => setActiveTab('profitloss')}
                  disabled={!fileStatus.profit_loss}
                  className={`py-4 px-6 font-medium text-sm focus:outline-none ${
                    activeTab === 'profitloss'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!fileStatus.profit_loss ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Profit & Loss {!fileStatus.profit_loss && '(No Data)'}
                </button>
              </div>
              
              {/* Previous Year Toggle Button */}
              {previousYearExists && (
                <button
                  onClick={togglePreviousYearPreview}
                  className={`mb-2 mr-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showPreviousYear 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {showPreviousYear ? 'Hide Previous Year' : 'Show Previous Year'}
                  </div>
            </button>
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className={showPreviousYear ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : ''}>
            {/* Current Year Component */}
            <div className={showPreviousYear ? 'border-r pr-8' : ''}>
              <h3 className={`text-lg font-semibold mb-4 ${showPreviousYear ? '' : 'sr-only'}`}>
                Current Year ({params.year})
              </h3>
              {activeTab === 'balancesheet' && fileStatus.balance_sheet && <BalanceSheet clientId={params.clientId} year={params.year} />}
              {activeTab === 'profitloss' && fileStatus.profit_loss && <TradingProfitLoss clientId={params.clientId} year={params.year} />}
            </div>

            {/* Previous Year Component */}
            {showPreviousYear && previousYear && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Previous Year ({previousYear})</h3>
                {activeTab === 'balancesheet' && <PreviousBalanceSheet clientId={params.clientId} year={previousYear} />}
                {activeTab === 'profitloss' && <PreviousTradingProfitLoss clientId={params.clientId} year={previousYear} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}