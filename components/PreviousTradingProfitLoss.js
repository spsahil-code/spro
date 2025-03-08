'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PreviousTradingProfitLoss = ({ clientId, year }) => {
  const [previousData, setPreviousData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreviousYearData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching previous trading P&L for clientId=${clientId}, year=${year}`);
        const response = await fetch(`/api/previous-trading-pl?clientId=${clientId}&year=${year}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch previous year data');
        }
        
        const data = await response.json();
        console.log('Previous year trading P&L data:', data);
        
        if (!data || !data.data) {
          throw new Error('Invalid data format received from server');
        }

        // Parse numeric values and structure the data
        const parsedData = {
          trading: {
            debit: {
              openingStock: parseFloat(data.data.openingStock || 0),
              purchases: parseFloat(data.data.purchases || 0),
              directExpenses: parseFloat(data.data.directExpenses || 0),
              grossProfit: parseFloat(data.data.grossProfit || 0)
            },
            credit: {
              sales: parseFloat(data.data.sales || 0),
              closingStock: parseFloat(data.data.closingStock || 0)
            }
          },
          profitLoss: {
            debit: {
              wages: parseFloat(data.data.wages || 0),
              rent: parseFloat(data.data.rent || 0),
              utilities: parseFloat(data.data.utilities || 0),
              insurance: parseFloat(data.data.insurance || 0),
              officeExpenses: parseFloat(data.data.officeExpenses || 0),
              travelExpenses: parseFloat(data.data.travelExpenses || 0),
              repairMaintenance: parseFloat(data.data.repairMaintenance || 0),
              legalProfessional: parseFloat(data.data.legalProfessional || 0),
              bankCharges: parseFloat(data.data.bankCharges || 0),
              miscExpenses: parseFloat(data.data.miscExpenses || 0),
              depreciation: parseFloat(data.data.depreciation || 0),
              netProfit: parseFloat(data.data.netProfit || 0)
            },
            credit: {
              grossProfit: parseFloat(data.data.grossProfit || 0),
              otherIncome: parseFloat(data.data.otherIncome || 0)
            }
          }
        };
        
        setPreviousData(parsedData);
      } catch (err) {
        console.error('Error in PreviousTradingProfitLoss:', err);
        setError(err.message);
        if (!err.message.includes('No data found')) {
          toast.error(`Previous year Trading P&L: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
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
          <div className="h-4 bg-gray-200 rounded w-3/6"></div>
        </div>
        <div className="mt-4 text-sm text-gray-500">Loading previous year data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Previous Year Trading Profit & Loss</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 mb-4">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error.includes('No data found') ? 'No previous year data available' : `Error: ${error}`}
          </p>
        </div>
        <p className="text-sm text-gray-600">
          {error.includes('No data found') 
            ? `We couldn't find any profit & loss data for the previous financial year (${year}).` 
            : 'There was a problem loading the previous year data. Please try again later.'}
        </p>
      </div>
    );
  }

  if (!previousData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Previous Year Trading Profit & Loss</h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
          <p>No previous year data available for {year}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Previous Year Trading and Profit & Loss ({year})</h2>
      
      {/* Trading Account */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-800 border-b pb-1">Trading Account</h3>
        <div className="grid grid-cols-1 gap-4">
          {/* Debit Side */}
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2 text-gray-700">Debit</h4>
            <div className="pl-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Particulars</div>
                <div className="font-medium text-gray-600 text-right">Amount (₹)</div>
                <div className="font-medium text-gray-600 text-right">Total (₹)</div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>Opening Stock</div>
                  <div className="text-right">{previousData.trading?.debit?.openingStock?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Purchases</div>
                  <div className="text-right">{previousData.trading?.debit?.purchases?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Direct Expenses</div>
                  <div className="text-right">{previousData.trading?.debit?.directExpenses?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="font-semibold">Gross Profit</div>
                  <div className="text-right font-semibold">{previousData.trading?.debit?.grossProfit?.toLocaleString() || 0}</div>
                  <div className="text-right font-semibold"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Credit Side */}
          <div>
            <h4 className="font-medium mb-2 text-gray-700">Credit</h4>
            <div className="pl-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Particulars</div>
                <div className="font-medium text-gray-600 text-right">Amount (₹)</div>
                <div className="font-medium text-gray-600 text-right">Total (₹)</div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>Sales</div>
                  <div className="text-right">{previousData.trading?.credit?.sales?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Closing Stock</div>
                  <div className="text-right">{previousData.trading?.credit?.closingStock?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Account */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-800 border-b pb-1">Profit & Loss Account</h3>
        <div className="grid grid-cols-1 gap-4">
          {/* Debit Side */}
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2 text-gray-700">Expenses</h4>
            <div className="pl-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Particulars</div>
                <div className="font-medium text-gray-600 text-right">Amount (₹)</div>
                <div className="font-medium text-gray-600 text-right">Total (₹)</div>
              </div>
              
              <div className="mt-2 space-y-2">
                {previousData.profitLoss?.debit?.wages > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Wages</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.wages?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.rent > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Rent</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.rent?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.utilities > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Utilities</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.utilities?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.insurance > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Insurance</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.insurance?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.officeExpenses > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Office Expenses</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.officeExpenses?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.travelExpenses > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Travel Expenses</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.travelExpenses?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.repairMaintenance > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Repair & Maintenance</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.repairMaintenance?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.legalProfessional > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Legal & Professional</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.legalProfessional?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.bankCharges > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Bank Charges</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.bankCharges?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.miscExpenses > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Miscellaneous Expenses</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.miscExpenses?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                {previousData.profitLoss?.debit?.depreciation > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>Depreciation</div>
                    <div className="text-right">{previousData.profitLoss?.debit?.depreciation?.toLocaleString() || 0}</div>
                    <div className="text-right"></div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="font-semibold">Net Profit</div>
                  <div className="text-right font-semibold">{previousData.profitLoss?.debit?.netProfit?.toLocaleString() || 0}</div>
                  <div className="text-right font-semibold"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Credit Side */}
          <div>
            <h4 className="font-medium mb-2 text-gray-700">Income</h4>
            <div className="pl-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-medium text-gray-600">Particulars</div>
                <div className="font-medium text-gray-600 text-right">Amount (₹)</div>
                <div className="font-medium text-gray-600 text-right">Total (₹)</div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div>Gross Profit</div>
                  <div className="text-right">{previousData.profitLoss?.credit?.grossProfit?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>Other Income</div>
                  <div className="text-right">{previousData.profitLoss?.credit?.otherIncome?.toLocaleString() || 0}</div>
                  <div className="text-right"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviousTradingProfitLoss; 