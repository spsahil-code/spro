'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import PreviousTradingProfitLoss from './PreviousTradingProfitLoss';

const TradingProfitLoss = ({ clientId, year, showPreviousYear }) => {
  const [tradingData, setTradingData] = useState({
    debit: {
      openingStock: 0,
      purchases: 0,
      directExpenses: 0,
      grossProfit: 0
    },
    credit: {
      sales: 0,
      closingStock: 0
    }
  });

  const [profitLossData, setProfitLossData] = useState({
    debit: {
      wages: 0,
      rent: 0,
      utilities: 0,
      insurance: 0,
      officeExpenses: 0,
      travelExpenses: 0,
      repairMaintenance: 0,
      legalProfessional: 0,
      bankCharges: 0,
      miscExpenses: 0,
      depreciation: 0,
      netProfit: 0,
      customExpenses: []
    },
    credit: {
      grossProfit: 0,
      otherIncome: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    trading: { debitTotal: 0, creditTotal: 0 },
    profitLoss: { debitTotal: 0, creditTotal: 0 }
  });

  // Remove old preview states and keep only previous year states
  const [previousYear, setPreviousYear] = useState(null);
  const [previousYearData, setPreviousYearData] = useState(null);

  const [balanceSheetData, setBalanceSheetData] = useState(null);

  // Calculate totals whenever the data changes
  useEffect(() => {
    // Calculate trading totals
    const { openingStock, purchases, directExpenses } = tradingData.debit;
    const { sales, closingStock } = tradingData.credit;
    
    const tradingDebitSubtotal = openingStock + purchases + directExpenses;
    const tradingCreditTotal = sales + closingStock;
    const grossProfit = tradingCreditTotal - tradingDebitSubtotal;
    
    const newTradingData = {
      ...tradingData,
      debit: {
        ...tradingData.debit,
        grossProfit: grossProfit > 0 ? grossProfit : 0
      }
    };

    const newProfitLossData = {
      ...profitLossData,
      credit: {
        ...profitLossData.credit,
        grossProfit: grossProfit > 0 ? grossProfit : 0
      }
    };

    // Calculate profit & loss totals
    const { wages, rent, utilities, insurance, officeExpenses, travelExpenses, repairMaintenance, legalProfessional, bankCharges, miscExpenses, depreciation, customExpenses } = profitLossData.debit;
    const customExpensesTotal = customExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const plDebitSubtotal = wages + rent + utilities + insurance + officeExpenses + travelExpenses + repairMaintenance + legalProfessional + bankCharges + miscExpenses + depreciation + customExpensesTotal;
    const plCreditTotal = (grossProfit > 0 ? grossProfit : 0) + profitLossData.credit.otherIncome;
    const netProfit = plCreditTotal - plDebitSubtotal;

    newProfitLossData.debit.netProfit = netProfit > 0 ? netProfit : 0;

    setTradingData(newTradingData);
    setProfitLossData(newProfitLossData);

    setTotals({
      trading: {
        debitTotal: tradingDebitSubtotal + (grossProfit > 0 ? grossProfit : 0),
        creditTotal: tradingCreditTotal
      },
      profitLoss: {
        debitTotal: plDebitSubtotal + (netProfit > 0 ? netProfit : 0),
        creditTotal: plCreditTotal
      }
    });
  }, [
    tradingData.debit.openingStock,
    tradingData.debit.purchases,
    tradingData.debit.directExpenses,
    tradingData.credit.sales,
    tradingData.credit.closingStock,
    profitLossData.debit.wages,
    profitLossData.debit.rent,
    profitLossData.debit.utilities,
    profitLossData.debit.insurance,
    profitLossData.debit.officeExpenses,
    profitLossData.debit.travelExpenses,
    profitLossData.debit.repairMaintenance,
    profitLossData.debit.legalProfessional,
    profitLossData.debit.bankCharges,
    profitLossData.debit.miscExpenses,
    profitLossData.debit.depreciation,
    profitLossData.debit.customExpenses,
    profitLossData.credit.otherIncome
  ]);

  useEffect(() => {
    const fetchBalanceSheetData = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/balance-sheet?year=${year}`);
        if (!response.ok) {
          throw new Error('Failed to fetch balance sheet data');
        }
        
        const data = await response.json();
        console.log('Balance sheet data:', data);

        if (data.success && data.data) {
          setBalanceSheetData(data.data);
          
          // Calculate total depreciation from depreciating assets
          const totalDepreciation = data.data.depreciatingAssets?.reduce((sum, asset) => {
            const depAmount = Number(asset.depreciationAmount) || 0;
            console.log(`Asset: ${asset.description}, Depreciation: ${depAmount}`);
            return sum + depAmount;
          }, 0) || 0;
          
          console.log('Total depreciation calculated:', totalDepreciation);
          
          // Update profit & loss data with the depreciation amount
          setProfitLossData(prev => {
            const updatedData = {
              ...prev,
              debit: {
                ...prev.debit,
                depreciation: totalDepreciation
              }
            };
            console.log('Updated profit & loss data:', updatedData);
            return updatedData;
          });
        } else {
          console.warn('No balance sheet data found or invalid response format');
        }
      } catch (error) {
        console.error('Error fetching balance sheet data:', error);
        toast.error('Failed to fetch depreciation data from balance sheet');
      }
    };

    if (clientId && year) {
      fetchBalanceSheetData();
    }
  }, [clientId, year]);

  // Calculate previous year
  const calculatePreviousYear = (year) => {
    if (!year || !year.includes('-')) return null;
    const [startYear, endYear] = year.split('-').map(y => parseInt(y));
    return `${startYear - 1}-${endYear - 1}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First check if the client exists
        const clientResponse = await fetch(`/api/clients/${clientId}`);
        if (!clientResponse.ok) {
          throw new Error('Invalid client ID');
        }

        const response = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`);
        const data = await response.json();

        if (response.ok && data.success && data.data) {
          // If data exists, populate the form
          const profitLossData = data.data;
          
          // Set trading data
          setTradingData({
            debit: {
              openingStock: profitLossData.openingStock || 0,
              purchases: profitLossData.purchases || 0,
              directExpenses: profitLossData.directExpenses || 0,
              grossProfit: profitLossData.grossProfit || 0
            },
            credit: {
              sales: profitLossData.sales || 0,
              closingStock: profitLossData.closingStock || 0
            }
          });

          // Set profit & loss data
          setProfitLossData({
            debit: {
              wages: profitLossData.wages || 0,
              rent: profitLossData.rent || 0,
              utilities: profitLossData.utilities || 0,
              insurance: profitLossData.insurance || 0,
              officeExpenses: profitLossData.officeExpenses || 0,
              travelExpenses: profitLossData.travelExpenses || 0,
              repairMaintenance: profitLossData.repairMaintenance || 0,
              legalProfessional: profitLossData.legalProfessional || 0,
              bankCharges: profitLossData.bankCharges || 0,
              miscExpenses: profitLossData.miscExpenses || 0,
              depreciation: profitLossData.depreciation || 0,
              netProfit: profitLossData.netProfit || 0,
              customExpenses: profitLossData.customExpenses || []
            },
            credit: {
              grossProfit: profitLossData.grossProfit || 0,
              otherIncome: profitLossData.otherIncome || 0
            }
          });
        } else {
          // For new entries, keep the default empty values
          console.log('Creating new Trading Profit & Loss for year:', year);
          toast.success('Creating new Trading Profit & Loss Statement');
          // The default state values will be used
        }
      } catch (err) {
        console.error('Error in trading profit & loss:', err);
        if (err.message === 'Invalid client ID') {
          setError('Invalid client ID');
          toast.error('Invalid client ID');
        } else {
          // For other errors, just log them but allow the form to be used
          console.warn('Using empty form due to error:', err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId && year) {
      fetchData();
    }
  }, [clientId, year]);

  // Calculate totals for Trading Account
  const tradingDebitTotal = useMemo(() => {
    return (
      parseFloat(tradingData.debit.openingStock || 0) +
      parseFloat(tradingData.debit.purchases || 0) +
      parseFloat(tradingData.debit.directExpenses || 0) +
      parseFloat(tradingData.debit.grossProfit || 0)
    );
  }, [tradingData.debit]);

  const tradingCreditTotal = useMemo(() => {
    return (
      parseFloat(tradingData.credit.sales || 0) +
      parseFloat(tradingData.credit.closingStock || 0)
    );
  }, [tradingData.credit]);

  // Calculate totals for Profit & Loss Account
  const profitLossDebitTotal = useMemo(() => {
    return (
      parseFloat(profitLossData.debit.wages || 0) +
      parseFloat(profitLossData.debit.rent || 0) +
      parseFloat(profitLossData.debit.utilities || 0) +
      parseFloat(profitLossData.debit.insurance || 0) +
      parseFloat(profitLossData.debit.officeExpenses || 0) +
      parseFloat(profitLossData.debit.travelExpenses || 0) +
      parseFloat(profitLossData.debit.repairMaintenance || 0) +
      parseFloat(profitLossData.debit.legalProfessional || 0) +
      parseFloat(profitLossData.debit.bankCharges || 0) +
      parseFloat(profitLossData.debit.miscExpenses || 0) +
      parseFloat(profitLossData.debit.depreciation || 0) +
      parseFloat(profitLossData.debit.netProfit || 0)
    );
  }, [profitLossData.debit]);

  const profitLossCreditTotal = useMemo(() => {
    return (
      parseFloat(profitLossData.credit.grossProfit || 0) +
      parseFloat(profitLossData.credit.otherIncome || 0)
    );
  }, [profitLossData.credit]);

  useEffect(() => {
    const fetchPreviousYears = async () => {
      try {
        const response = await fetch(`/api/client-years?clientId=${clientId}`);
        if (response.ok) {
          const result = await response.json();
          // Ensure we have an array of years
          const years = Array.isArray(result) ? result : (result.data || []);
          
          if (years.length > 0) {
            // Sort the years in descending order
            const sortedYears = years.sort((a, b) => {
              const [aStart] = a.split('-').map(Number);
              const [bStart] = b.split('-').map(Number);
              return bStart - aStart;
            });
            
            const currentYear = sortedYears[0];
            const prevYear = sortedYears[1];
            
            console.log('Trading P&L - Available years:', years);
            console.log('Trading P&L - Current year:', currentYear);
            console.log('Trading P&L - Previous year:', prevYear);
            
            if (prevYear) {
              setPreviousYear(prevYear);
            }
          }
        } else {
          console.error('Failed to fetch years:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching previous years:', error);
      }
    };

    if (clientId) {
      fetchPreviousYears();
    }
  }, [clientId]);

  // Add debug logging for visibility state
  useEffect(() => {
    console.log('Trading P&L - Show previous year:', showPreviousYear);
    console.log('Trading P&L - Previous year value:', previousYear);
  }, [showPreviousYear, previousYear]);

  // Add function to fetch previous year data
  const fetchPreviousYearData = async (year) => {
    try {
      const response = await fetch(`/api/previous-trading-pl?clientId=${clientId}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setPreviousYearData(data.data);
        }
      } else {
        console.error('Failed to fetch previous year data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching previous year data:', error);
    }
  };

  // Update useEffect to fetch previous year data when previousYear changes
  useEffect(() => {
    if (showPreviousYear && previousYear) {
      fetchPreviousYearData(previousYear);
    }
  }, [showPreviousYear, previousYear, clientId]);

  const handleTradingInputChange = (side, field, value) => {
    const numValue = parseFloat(value) || 0;
    setTradingData(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [field]: numValue
      }
    }));
  };

  const handleProfitLossInputChange = (side, field, value) => {
    const numValue = parseFloat(value) || 0;
    setProfitLossData(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [field]: numValue
      }
    }));
  };

  const handleAddCustomExpense = () => {
    setProfitLossData(prev => ({
      ...prev,
      debit: {
        ...prev.debit,
        customExpenses: [
          ...prev.debit.customExpenses,
          { description: '', amount: 0 }
        ]
      }
    }));
  };

  const handleCustomExpenseChange = (index, field, value) => {
    setProfitLossData(prev => {
      const updatedExpenses = [...prev.debit.customExpenses];
      updatedExpenses[index] = {
        ...updatedExpenses[index],
        [field]: field === 'amount' ? Number(value) : value
      };
      return {
        ...prev,
        debit: {
          ...prev.debit,
          customExpenses: updatedExpenses
        }
      };
    });
  };

  const handleRemoveCustomExpense = (index) => {
    setProfitLossData(prev => ({
      ...prev,
      debit: {
        ...prev.debit,
        customExpenses: prev.debit.customExpenses.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get year from URL path
      const pathParts = window.location.pathname.split('/');
      const year = pathParts[pathParts.length - 1];

      // Log the data being sent
      console.log('Submitting profit & loss data with depreciation:', profitLossData.debit.depreciation);

      const response = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          tradingAccount: {
            openingStock: tradingData.debit.openingStock,
            purchases: tradingData.debit.purchases,
            directExpenses: tradingData.debit.directExpenses,
            sales: tradingData.credit.sales,
            closingStock: tradingData.credit.closingStock,
            grossProfit: tradingData.debit.grossProfit
          },
          expenses: {
            wages: profitLossData.debit.wages,
            rent: profitLossData.debit.rent,
            utilities: profitLossData.debit.utilities,
            insurance: profitLossData.debit.insurance,
            officeExpenses: profitLossData.debit.officeExpenses,
            travelExpenses: profitLossData.debit.travelExpenses,
            repairMaintenance: profitLossData.debit.repairMaintenance,
            legalProfessional: profitLossData.debit.legalProfessional,
            bankCharges: profitLossData.debit.bankCharges,
            miscExpenses: profitLossData.debit.miscExpenses,
            depreciation: Number(profitLossData.debit.depreciation) || 0 // Ensure depreciation is a number
          },
          otherIncome: profitLossData.credit.otherIncome,
          netProfit: profitLossData.debit.netProfit,
          customExpenses: profitLossData.debit.customExpenses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save profit & loss data:', errorData);
        throw new Error(errorData.message || 'Failed to save data');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Data saved successfully');
        // Refresh balance sheet data to ensure depreciation is up to date
        fetchBalanceSheetData();
      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving profit and loss:', error);
      toast.error(error.message || 'Error saving data');
    }
  };

  // Update the PDF view handler to use the reports page
  const handleViewPDF = () => {
    // Get year from URL path
    const pathParts = window.location.pathname.split('/');
    const year = pathParts[pathParts.length - 1];
    
    // Navigate to the reports page with the correct parameters
    window.open(`/reports?type=profit-loss&clientId=${clientId}&year=${year}`, '_blank');
  };

  // Update the button click handler to be more explicit
  const handlePreviousYearClick = () => {
    console.log('Button clicked - Current state:', showPreviousYear);
    console.log('Previous year available:', previousYear);
    setShowPreviousYear(!showPreviousYear);
    console.log('New state:', !showPreviousYear);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gross Profit</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{tradingData.debit.grossProfit.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{profitLossData.debit.netProfit.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{tradingData.credit.sales.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
        </div>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Trading Profit & Loss
          {previousYear && (
            <button
              type="button"
              onClick={() => setShowPreviousYear(true)}
              className="ml-2 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              View {previousYear}
            </button>
          )}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleViewPDF}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate PDF
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - Trading Account */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Trading Account</h2>
            
            {/* Debit Side */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-2 text-red-600 dark:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </span>
                Debit Side
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={tradingData.debit.openingStock}
                    onChange={(e) => handleTradingInputChange('debit', 'openingStock', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchases</label>
                  <input
                    type="number"
                    value={tradingData.debit.purchases}
                    onChange={(e) => handleTradingInputChange('debit', 'purchases', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direct Expenses</label>
                  <input
                    type="number"
                    value={tradingData.debit.directExpenses}
                    onChange={(e) => handleTradingInputChange('debit', 'directExpenses', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gross Profit</label>
                  <input
                    type="number"
                    value={tradingData.debit.grossProfit}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Credit Side */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2 text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
                Credit Side
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales</label>
                  <input
                    type="number"
                    value={tradingData.credit.sales}
                    onChange={(e) => handleTradingInputChange('credit', 'sales', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Stock</label>
                  <input
                    type="number"
                    value={tradingData.credit.closingStock}
                    onChange={(e) => handleTradingInputChange('credit', 'closingStock', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Trading Total Row */}
            <div className="mt-6 grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <div className="text-right font-bold text-gray-900 dark:text-white">
                Total Debit: ₹{totals.trading.debitTotal.toLocaleString()}
              </div>
              <div className="text-right font-bold text-gray-900 dark:text-white">
                Total Credit: ₹{totals.trading.creditTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Right Side - Profit & Loss Account */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Profit & Loss Account</h2>
            
            {/* Debit Side */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-2 text-red-600 dark:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </span>
                Expenses
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wages</label>
                  <input
                    type="number"
                    value={profitLossData.debit.wages}
                    onChange={(e) => handleProfitLossInputChange('debit', 'wages', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rent</label>
                  <input
                    type="number"
                    value={profitLossData.debit.rent}
                    onChange={(e) => handleProfitLossInputChange('debit', 'rent', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilities</label>
                  <input
                    type="number"
                    value={profitLossData.debit.utilities}
                    onChange={(e) => handleProfitLossInputChange('debit', 'utilities', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance</label>
                  <input
                    type="number"
                    value={profitLossData.debit.insurance}
                    onChange={(e) => handleProfitLossInputChange('debit', 'insurance', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Office Expenses</label>
                  <input
                    type="number"
                    value={profitLossData.debit.officeExpenses}
                    onChange={(e) => handleProfitLossInputChange('debit', 'officeExpenses', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Expenses</label>
                  <input
                    type="number"
                    value={profitLossData.debit.travelExpenses}
                    onChange={(e) => handleProfitLossInputChange('debit', 'travelExpenses', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repair & Maintenance</label>
                  <input
                    type="number"
                    value={profitLossData.debit.repairMaintenance}
                    onChange={(e) => handleProfitLossInputChange('debit', 'repairMaintenance', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal & Professional</label>
                  <input
                    type="number"
                    value={profitLossData.debit.legalProfessional}
                    onChange={(e) => handleProfitLossInputChange('debit', 'legalProfessional', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Charges</label>
                  <input
                    type="number"
                    value={profitLossData.debit.bankCharges}
                    onChange={(e) => handleProfitLossInputChange('debit', 'bankCharges', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miscellaneous Expenses</label>
                  <input
                    type="number"
                    value={profitLossData.debit.miscExpenses}
                    onChange={(e) => handleProfitLossInputChange('debit', 'miscExpenses', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div className="mb-4 col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Depreciation (Auto-calculated from Balance Sheet)
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      (Sum of depreciation from all depreciating assets)
                    </span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={profitLossData.debit.depreciation}
                      readOnly
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Custom Expenses Section - Moved here */}
                <div className="col-span-2 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Expenses</h4>
                    <button
                      type="button"
                      onClick={handleAddCustomExpense}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add More
                    </button>
                  </div>
                  
                  {/* Header for custom expenses columns */}
                  <div className="grid grid-cols-12 gap-4 mb-2">
                    <div className="col-span-8">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                    </div>
                  </div>
                  
                  {profitLossData.debit.customExpenses.map((expense, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow duration-200">
                      <div className="col-span-8">
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => handleCustomExpenseChange(index, 'description', e.target.value)}
                          placeholder="Enter expense description"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => handleCustomExpenseChange(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomExpense(index)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                          title="Remove expense"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {profitLossData.debit.customExpenses.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                      No custom expenses added yet. Click "Add More" to add an expense.
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Net Profit</label>
                  <input
                    type="number"
                    value={profitLossData.debit.netProfit}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Credit Side */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2 text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
                Income
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gross Profit</label>
                  <input
                    type="number"
                    value={profitLossData.credit.grossProfit}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other Income</label>
                  <input
                    type="number"
                    value={profitLossData.credit.otherIncome}
                    onChange={(e) => handleProfitLossInputChange('credit', 'otherIncome', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Profit & Loss Total Row */}
            <div className="mt-6 grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <div className="text-right font-bold text-gray-900 dark:text-white">
                Total Debit: ₹{totals.profitLoss.debitTotal.toLocaleString()}
              </div>
              <div className="text-right font-bold text-gray-900 dark:text-white">
                Total Credit: ₹{totals.profitLoss.creditTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Save Statement
          </button>
        </div>
      </form>

      {/* Previous Year Modal */}
      {showPreviousYear && previousYear && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Previous Year Trading Profit & Loss ({previousYear})
                  </h3>
                  <button
                    onClick={() => setShowPreviousYear(false)}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 w-full max-h-[80vh] overflow-y-auto">
                  <PreviousTradingProfitLoss clientId={clientId} year={previousYear} />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowPreviousYear(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingProfitLoss;