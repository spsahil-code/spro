'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PreviousBalanceSheet = ({ clientId, year }) => {
  const [previousData, setPreviousData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreviousYearData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching previous balance sheet for clientId=${clientId}, year=${year}`);
        
        // First fetch the balance sheet data
        const bsResponse = await fetch(`/api/previous-balance-sheet?clientId=${clientId}&year=${year}`);
        
        if (!bsResponse.ok) {
          const errorData = await bsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch previous year data');
        }
        
        const bsData = await bsResponse.json();
        console.log('Previous year balance sheet data:', bsData);
        
        if (!bsData || !bsData.data) {
          throw new Error('Invalid data format received from server');
        }

        // Also fetch profit & loss data to get closing stock and net profit
        const plResponse = await fetch(`/api/previous-trading-pl?clientId=${clientId}&year=${year}`);
        const plData = await plResponse.json();
        
        console.log('Previous year profit & loss data:', plData);

        // Parse numeric values and combine data
        const parsedData = {
          ...bsData.data,
          capitalAccount: {
            openingCapital: parseFloat(bsData.data.openingCapital || 0),
            netProfit: parseFloat(plData?.data?.netProfit || 0),
            householdExpenses: parseFloat(bsData.data.householdExpenses || 0),
            otherIncomes: Array.isArray(bsData.data.otherIncomes) ? bsData.data.otherIncomes : [],
            otherExpenses: Array.isArray(bsData.data.otherExpenses) ? bsData.data.otherExpenses : [],
            closingCapital: calculateClosingCapital(bsData.data, plData?.data?.netProfit || 0)
          },
          closingStock: parseFloat(plData?.data?.closingStock || 0),
          fixedAssets: Array.isArray(bsData.data.fixedAssets) ? bsData.data.fixedAssets : [],
          depreciatingAssets: Array.isArray(bsData.data.depreciatingAssets) ? bsData.data.depreciatingAssets : [],
          sundryDebtors: Array.isArray(bsData.data.sundryDebtors) ? bsData.data.sundryDebtors : [],
          cashInBank: Array.isArray(bsData.data.cashInBank) ? bsData.data.cashInBank : [],
          cashInHand: Array.isArray(bsData.data.cashInHand) ? bsData.data.cashInHand : [],
          loanAdvances: Array.isArray(bsData.data.loanAdvances) ? bsData.data.loanAdvances : [],
          sundryCreditors: Array.isArray(bsData.data.sundryCreditors) ? bsData.data.sundryCreditors : [],
          loans: Array.isArray(bsData.data.loans) ? bsData.data.loans : [],
          provisions: Array.isArray(bsData.data.provisions) ? bsData.data.provisions : []
        };
        
        setPreviousData(parsedData);
      } catch (err) {
        console.error('Error in PreviousBalanceSheet:', err);
        setError(err.message);
        if (!err.message.includes('No data found')) {
          toast.error(`Previous year balance sheet: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Helper function to calculate closing capital
    const calculateClosingCapital = (balanceSheetData, netProfit) => {
      const openingCapital = parseFloat(balanceSheetData.openingCapital || 0);
      const householdExpenses = parseFloat(balanceSheetData.householdExpenses || 0);
      
      // Calculate total other incomes
      const otherIncomes = Array.isArray(balanceSheetData.otherIncomes)
        ? balanceSheetData.otherIncomes.reduce((sum, income) => sum + parseFloat(income.amount || 0), 0)
        : 0;
      
      // Calculate total other expenses
      const otherExpenses = Array.isArray(balanceSheetData.otherExpenses)
        ? balanceSheetData.otherExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
        : 0;
      
      // Calculate closing capital
      return openingCapital + (netProfit || 0) + otherIncomes - householdExpenses - otherExpenses;
    };

    if (clientId && year) {
      fetchPreviousYearData();
    } else {
      setIsLoading(false);
      setError('Missing client ID or year');
    }
  }, [clientId, year]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mt-4 text-sm text-gray-500">Loading previous year data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Year Balance Sheet</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error.includes('No data found') ? 'No previous year data available' : `Error: ${error}`}
          </p>
        </div>
      </div>
    );
  }

  if (!previousData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Year Balance Sheet</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
          <p>No previous year data available for {year}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Year Balance Sheet ({year})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liabilities Side */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 border-b pb-1">Liabilities</h3>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mt-3 mb-1">Capital Account</h4>
            <div className="pl-2 border-l-2 border-gray-200">
              <p className="text-sm py-1 flex justify-between">
                <span>Opening Capital:</span> 
                <span className="font-medium">₹{previousData.capitalAccount?.openingCapital?.toLocaleString() || 0}</span>
              </p>
              <p className="text-sm py-1 flex justify-between">
                <span>Net Profit:</span> 
                <span className="font-medium">₹{previousData.capitalAccount?.netProfit?.toLocaleString() || 0}</span>
              </p>
              
              {/* Other Incomes */}
              {previousData.capitalAccount?.otherIncomes?.map((income, index) => (
                <p key={index} className="text-sm py-1 flex justify-between">
                  <span>{income.description || 'Other Income'}:</span>
                  <span className="font-medium">₹{parseFloat(income.amount || 0).toLocaleString()}</span>
                </p>
              ))}
              
              <p className="text-sm py-1 flex justify-between">
                <span>Household Expenses:</span> 
                <span className="font-medium text-red-600">-₹{previousData.capitalAccount?.householdExpenses?.toLocaleString() || 0}</span>
              </p>
              
              {/* Other Expenses */}
              {previousData.capitalAccount?.otherExpenses?.map((expense, index) => (
                <p key={index} className="text-sm py-1 flex justify-between">
                  <span>{expense.description || 'Other Expense'}:</span>
                  <span className="font-medium text-red-600">-₹{parseFloat(expense.amount || 0).toLocaleString()}</span>
                </p>
              ))}
              
              <p className="text-sm py-1 flex justify-between font-medium text-gray-900 border-t mt-2 pt-2">
                <span>Closing Capital:</span> 
                <span>₹{previousData.capitalAccount?.closingCapital?.toLocaleString() || 0}</span>
              </p>
            </div>
          </div>

          {previousData.sundryCreditors?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Sundry Creditors</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.sundryCreditors.map((creditor, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{creditor.description}:</span> 
                    <span className="font-medium">₹{creditor.amount?.toLocaleString() || 0}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {previousData.loans?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Loans</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.loans.map((loan, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{loan.description}:</span>
                    <span className="font-medium">₹{loan.amount?.toLocaleString() || 0}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assets Side */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 border-b pb-1">Assets</h3>
          
          {previousData.fixedAssets?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Fixed Assets</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.fixedAssets.map((asset, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{asset.description}:</span>
                    <span className="font-medium">₹{parseFloat(asset.amount || 0).toLocaleString()}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {previousData.depreciatingAssets?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Depreciating Assets</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.depreciatingAssets.map((asset, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-sm font-medium">{asset.description}</p>
                    <div className="pl-2 text-sm">
                      <p className="flex justify-between">
                        <span>Opening Balance:</span>
                        <span>₹{parseFloat(asset.openingBalance || 0).toLocaleString()}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Added During Year:</span>
                        <span>₹{parseFloat(asset.addedDuringYear || 0).toLocaleString()}</span>
                      </p>
                      <p className="flex justify-between font-medium">
                        <span>Closing Balance:</span>
                        <span>₹{parseFloat(asset.closingBalance || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Closing Stock section */}
          {previousData.closingStock > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Current Assets</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                <p className="text-sm py-1 flex justify-between">
                  <span>Closing Stock:</span>
                  <span className="font-medium">₹{previousData.closingStock.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {previousData.sundryDebtors?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Sundry Debtors</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.sundryDebtors.map((debtor, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{debtor.description}:</span>
                    <span className="font-medium">₹{parseFloat(debtor.amount || 0).toLocaleString()}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {previousData.cashInBank?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Cash & Bank</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.cashInBank.map((cash, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{cash.description}:</span>
                    <span className="font-medium">₹{parseFloat(cash.amount || 0).toLocaleString()}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {previousData.cashInHand?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Cash in Hand</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.cashInHand.map((cash, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{cash.description}:</span>
                    <span className="font-medium">₹{parseFloat(cash.amount || 0).toLocaleString()}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {previousData.loanAdvances?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mt-3 mb-1">Loan & Advances</h4>
              <div className="pl-2 border-l-2 border-gray-200">
                {previousData.loanAdvances.map((loan, index) => (
                  <p key={index} className="text-sm py-1 flex justify-between">
                    <span>{loan.description}:</span>
                    <span className="font-medium">₹{parseFloat(loan.amount || 0).toLocaleString()}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviousBalanceSheet; 