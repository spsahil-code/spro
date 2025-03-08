'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function CreateBSPL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingFiles, setExistingFiles] = useState({ balance_sheet: false, profit_loss: false });
  const [existingData, setExistingData] = useState(null);

  // Generate financial years (previous 4 years to 2029-30)
  const financialYears = [];
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;  // 4 years back
  const endYear = 2029;
  
  for (let year = startYear; year <= endYear; year++) {
    financialYears.push(`${year}-${year + 1}`);
  }

  // Pre-select client and year from URL parameters
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const year = searchParams.get('year');
    if (clientId) setSelectedClient(clientId);
    if (year) setSelectedYear(year);
  }, [searchParams]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Check for existing files when client or year changes
  useEffect(() => {
    if (selectedClient && selectedYear) {
      checkExistingFiles();
    }
  }, [selectedClient, selectedYear]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/clients');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clients');
      }
      
      setClients(data.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return false;
    }
    if (!selectedYear) {
      toast.error('Please select a financial year');
      return false;
    }
    return true;
  };

  const fetchExistingData = async () => {
    try {
      // Fetch balance sheet data if it exists
      if (existingFiles.balance_sheet) {
        const bsResponse = await fetch(`/api/clients/${selectedClient}/balance-sheet?year=${selectedYear}`);
        if (bsResponse.ok) {
          const bsData = await bsResponse.json();
          if (bsData.success) {
            setExistingData(prev => ({ ...prev, balanceSheet: bsData.data }));
          }
        }
      }

      // Fetch profit & loss data if it exists
      if (existingFiles.profit_loss) {
        const plResponse = await fetch(`/api/clients/${selectedClient}/profit-loss?year=${selectedYear}`);
        if (plResponse.ok) {
          const plData = await plResponse.json();
          if (plData.success) {
            setExistingData(prev => ({ ...prev, profitLoss: plData.data }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching existing data:', err);
      toast.error('Failed to fetch existing data');
    }
  };

  const checkExistingFiles = async () => {
    try {
      const response = await fetch(`/api/client-years/check?clientId=${selectedClient}&year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to check existing files');
      }
      
      const data = await response.json();
      if (data.success) {
        const fileStatus = {
          balance_sheet: data.balance_sheet,
          profit_loss: data.profit_loss
        };
        setExistingFiles(fileStatus);
        
        // If any files exist, fetch their data
        if (fileStatus.balance_sheet || fileStatus.profit_loss) {
          await fetchExistingData();
        }
      }
    } catch (err) {
      console.error('Error checking existing files:', err);
      toast.error('Failed to check existing files');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Initialize balance sheet if it doesn't exist
      if (!existingFiles.balance_sheet) {
        const bsResponse = await fetch(`/api/clients/${selectedClient}/balance-sheet?year=${selectedYear}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            capitalAccount: { openingCapital: 0 },
            fixedAssets: [],
            depreciatingAssets: [],
            sundryDebtors: [],
            cashInBank: [],
            cashInHand: [],
            loanAdvances: [],
            sundryCreditors: [],
            loans: [],
            provisions: []
          })
        });

        if (!bsResponse.ok) {
          throw new Error('Failed to initialize balance sheet');
        }
      }

      // Initialize profit & loss if it doesn't exist
      if (!existingFiles.profit_loss) {
        const plResponse = await fetch(`/api/clients/${selectedClient}/profit-loss?year=${selectedYear}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trading: {
              debit: { openingStock: 0, purchases: 0, directExpenses: 0 },
              credit: { sales: 0, closingStock: 0 }
            },
            debit: {
              wages: 0, rent: 0, utilities: 0, insurance: 0,
              officeExpenses: 0, travelExpenses: 0, repairMaintenance: 0,
              legalProfessional: 0, bankCharges: 0, miscExpenses: 0,
              depreciation: 0
            },
            credit: { otherIncome: 0 }
          })
        });

        if (!plResponse.ok) {
          throw new Error('Failed to initialize profit & loss');
        }
      }
      
      // Navigate to the BS PL page
      router.push(`/bspl/${selectedClient}/${selectedYear}`);
      
    } catch (err) {
      console.error('Error:', err);
      toast.error(err.message || 'Failed to proceed');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Balance Sheet & Profit/Loss Statement
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Select a client and financial year to proceed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Client Selection */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Client
              </label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName ? `${client.name} (${client.businessName})` : client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Financial Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              >
                <option value="">Select a year</option>
                {financialYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* File Status */}
            {selectedClient && selectedYear && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Existing Files Status:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${existingFiles.balance_sheet ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Balance Sheet {existingFiles.balance_sheet ? '(Exists)' : '(Not created)'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${existingFiles.profit_loss ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Profit & Loss {existingFiles.profit_loss ? '(Exists)' : '(Not created)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/view-client"
                className="btn btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Proceed'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}