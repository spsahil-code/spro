'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import PreviousBalanceSheet from './PreviousBalanceSheet';
import PreviousTradingProfitLoss from './PreviousTradingProfitLoss';
import ErrorBoundary from './ErrorBoundary';

const BalanceSheet = ({ clientId, year }) => {
  const [isShowingPreviousYear, setIsShowingPreviousYear] = useState(false);
  const [capitalAccount, setCapitalAccount] = useState({
    openingCapital: 0,
    netProfit: 0,
    otherIncomes: [{ description: '', amount: 0 }],
    householdExpenses: 0,
    otherExpenses: [{ description: '', amount: 0 }]
  });

  const [sundryCreditors, setSundryCreditors] = useState([
    { description: '', amount: 0 }
  ]);

  const [loans, setLoans] = useState([
    { description: '', amount: 0 }
  ]);

  const [provisions, setProvisions] = useState([
    { description: '', amount: 0 }
  ]);

  const [fixedAssets, setFixedAssets] = useState([
    { description: '', amount: 0 }
  ]);

  const [depreciatingAssets, setDepreciatingAssets] = useState([
    {
      description: '',
      openingBalance: 0,
      addedDuringYear: 0,
      total: 0,
      depreciationRate: '10',
      depreciationAmount: 0,
      closingBalance: 0
    }
  ]);

  const [sundryDebtors, setSundryDebtors] = useState([
    { description: '', amount: 0 }
  ]);

  const [cashInBank, setCashInBank] = useState([
    { description: '', amount: 0 }
  ]);

  const [cashInHand, setCashInHand] = useState([
    { description: '', amount: 0 }
  ]);

  const [loanAdvances, setLoanAdvances] = useState([
    { description: '', amount: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    fixedAssets: [],
    depreciatingAssets: [],
    sundryDebtors: [],
    cashInBank: [],
    cashInHand: [],
    loanAdvances: [],
    sundryCreditors: [],
    loans: [],
    provisions: [],
    capitalAccount: {
      openingCapital: 0
    }
  });
  const [profitLossData, setProfitLossData] = useState(null);
  const [assetTotals, setAssetTotals] = useState({
    fixedAssets: 0,
    depreciatingAssets: 0,
    sundryDebtors: 0,
    cashInBank: 0,
    cashInHand: 0,
    loanAdvances: 0,
    sundryCreditors: 0,
    loans: 0,
    provisions: 0,
    currentAssets: 0,
    closingStock: 0,
    grandTotal: 0
  });
  const [closingStock, setClosingStock] = useState(0);

  const DEPRECIATION_RATES = [
    { value: '10', label: '10%' },
    { value: '15', label: '15%' },
    { value: '30', label: '30%' },
    { value: '60', label: '60%' }
  ];

  // Calculate previous year
  const calculatePreviousYear = (year) => {
    if (!year || !year.includes('-')) return null;
    const [startYear, endYear] = year.split('-');
    const previousStartYear = parseInt(startYear) - 1;
    const previousEndYear = parseInt(endYear) - 1;
    return `${previousStartYear}-${previousEndYear}`;
  };

  useEffect(() => {
    fetchData();
  }, [clientId, year]);

    const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize parsedData with default values
      let parsedData = {
        fixedAssets: [],
        depreciatingAssets: [],
        sundryDebtors: [],
        cashInBank: [],
        cashInHand: [],
        loanAdvances: [],
        sundryCreditors: [],
        loans: [],
        provisions: [],
        capitalAccount: {
          openingCapital: 0,
          householdExpenses: 0,
          otherIncomes: [],
          otherExpenses: []
        }
      };

      // Fetch profit & loss data first to get closing stock and net profit
      const plResponse = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`);
      const plResult = await plResponse.json();

      if (plResponse.ok && plResult.success && plResult.data) {
        setProfitLossData(plResult.data);
        // Set closing stock from profit & loss
        setClosingStock(Number(plResult.data.closingStock) || 0);
        // Update capital account with net profit
        setCapitalAccount(prev => ({
          ...prev,
          netProfit: Number(plResult.data.netProfit) || 0,
          otherIncomes: prev.otherIncomes || [{ description: '', amount: 0 }],
          otherExpenses: prev.otherExpenses || [{ description: '', amount: 0 }]
        }));
      } else {
        console.warn('No profit & loss data found or invalid response format');
      }

      // Fetch balance sheet data
      const response = await fetch(`/api/clients/${clientId}/balance-sheet?year=${year}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch balance sheet data');
      }

      if (result.success && result.data) {
        // Parse stringified JSON arrays only if they are strings
        parsedData = {
          fixedAssets: typeof result.data.fixedAssets === 'string' ? JSON.parse(result.data.fixedAssets) : (result.data.fixedAssets || []),
          depreciatingAssets: typeof result.data.depreciatingAssets === 'string' ? JSON.parse(result.data.depreciatingAssets) : (result.data.depreciatingAssets || []),
          sundryDebtors: typeof result.data.sundryDebtors === 'string' ? JSON.parse(result.data.sundryDebtors) : (result.data.sundryDebtors || []),
          cashInBank: typeof result.data.cashInBank === 'string' ? JSON.parse(result.data.cashInBank) : (result.data.cashInBank || []),
          cashInHand: typeof result.data.cashInHand === 'string' ? JSON.parse(result.data.cashInHand) : (result.data.cashInHand || []),
          loanAdvances: typeof result.data.loanAdvances === 'string' ? JSON.parse(result.data.loanAdvances) : (result.data.loanAdvances || []),
          sundryCreditors: typeof result.data.sundryCreditors === 'string' ? JSON.parse(result.data.sundryCreditors) : (result.data.sundryCreditors || []),
          loans: typeof result.data.loans === 'string' ? JSON.parse(result.data.loans) : (result.data.loans || []),
          provisions: typeof result.data.provisions === 'string' ? JSON.parse(result.data.provisions) : (result.data.provisions || []),
          capitalAccount: {
            openingCapital: Number(result.data.openingCapital) || 0,
            householdExpenses: Number(result.data.householdExpenses) || 0,
            otherIncomes: typeof result.data.otherIncomes === 'string' ? JSON.parse(result.data.otherIncomes) : (result.data.otherIncomes || []),
            otherExpenses: typeof result.data.otherExpenses === 'string' ? JSON.parse(result.data.otherExpenses) : (result.data.otherExpenses || [])
          }
        };
      } else {
        console.warn('No balance sheet data found or invalid response format');
      }

      // Update state with parsed data
      setData(parsedData);
      
      // Update capital account state
      setCapitalAccount(prev => ({
        ...prev,
        openingCapital: Number(parsedData.capitalAccount.openingCapital) || 0,
        householdExpenses: Number(parsedData.capitalAccount.householdExpenses) || 0,
        otherIncomes: parsedData.capitalAccount.otherIncomes.length > 0 ? parsedData.capitalAccount.otherIncomes : [{ description: '', amount: 0 }],
        otherExpenses: parsedData.capitalAccount.otherExpenses.length > 0 ? parsedData.capitalAccount.otherExpenses : [{ description: '', amount: 0 }]
      }));

      // Update individual state variables with non-empty arrays or default values
      setFixedAssets(parsedData.fixedAssets.length > 0 ? parsedData.fixedAssets : [{ description: '', amount: 0 }]);
      setDepreciatingAssets(parsedData.depreciatingAssets.length > 0 ? parsedData.depreciatingAssets : [{
        description: '',
        openingBalance: 0,
        addedDuringYear: 0,
        total: 0,
        depreciationRate: '10',
        depreciationAmount: 0,
        closingBalance: 0
      }]);
      setSundryDebtors(parsedData.sundryDebtors.length > 0 ? parsedData.sundryDebtors : [{ description: '', amount: 0 }]);
      setCashInBank(parsedData.cashInBank.length > 0 ? parsedData.cashInBank : [{ description: '', amount: 0 }]);
      setCashInHand(parsedData.cashInHand.length > 0 ? parsedData.cashInHand : [{ description: '', amount: 0 }]);
      setLoanAdvances(parsedData.loanAdvances.length > 0 ? parsedData.loanAdvances : [{ description: '', amount: 0 }]);
      setSundryCreditors(parsedData.sundryCreditors.length > 0 ? parsedData.sundryCreditors : [{ description: '', amount: 0 }]);
      setLoans(parsedData.loans.length > 0 ? parsedData.loans : [{ description: '', amount: 0 }]);
      setProvisions(parsedData.provisions.length > 0 ? parsedData.provisions : [{ description: '', amount: 0 }]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = useCallback(() => {
    if (!data) return;

    const newTotals = {
      // Fixed Assets total
      fixedAssets: data.fixedAssets.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      
      // Depreciating Assets total
      depreciatingAssets: data.depreciatingAssets.reduce((sum, item) => sum + (Number(item.closingBalance) || 0), 0),
      
      // Current Assets components
      sundryDebtors: data.sundryDebtors.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      cashInBank: data.cashInBank.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      cashInHand: data.cashInHand.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      loanAdvances: data.loanAdvances.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      
      // Closing Stock from Profit & Loss
      closingStock: Number(closingStock),
      
      // Liabilities
      sundryCreditors: data.sundryCreditors.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      loans: data.loans.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      provisions: data.provisions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    };

    // Calculate current assets total including closing stock
    newTotals.currentAssets = 
      newTotals.sundryDebtors +
      newTotals.cashInBank +
      newTotals.cashInHand +
      newTotals.loanAdvances +
      newTotals.closingStock;

    // Calculate grand total
    newTotals.grandTotal = 
      newTotals.fixedAssets +
      newTotals.depreciatingAssets +
      newTotals.currentAssets;

    return newTotals;
  }, [data, closingStock]);

  useEffect(() => {
    const newTotals = calculateTotals();
    if (newTotals) {
      setAssetTotals(newTotals);
    }
  }, [calculateTotals]);

  // Handle Fixed Assets
  const handleFixedAssetChange = (index, field, value) => {
    const newFixedAssets = [...fixedAssets];
    newFixedAssets[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFixedAssets(newFixedAssets);
  };

  const addFixedAsset = () => {
    setFixedAssets([...fixedAssets, { description: '', amount: 0 }]);
  };

  const removeFixedAsset = (index) => {
    if (fixedAssets.length > 1) {
      const newFixedAssets = fixedAssets.filter((_, i) => i !== index);
      setFixedAssets(newFixedAssets);
    }
  };

  // Handle Depreciating Assets
  const calculateDepreciatingAsset = (asset) => {
    // Convert values to numbers and ensure they're not NaN
    const openingBalance = Number(asset.openingBalance) || 0;
    const addedDuringYear = Number(asset.addedDuringYear) || 0;
    const depreciationRate = Number(asset.depreciationRate) || 0;
    
    const total = openingBalance + addedDuringYear;
    const depreciationAmount = Math.round((total * depreciationRate) / 100);
    const closingBalance = total - depreciationAmount;

    console.log('Calculating depreciation for:', asset.description, {
      openingBalance,
      addedDuringYear,
      total,
      depreciationRate,
      depreciationAmount,
      closingBalance
    });

    return {
      ...asset,
      total,
      depreciationAmount,
      closingBalance
    };
  };

  const handleDepreciatingAssetChange = (index, field, value) => {
    const newDepreciatingAssets = [...depreciatingAssets];
    const asset = newDepreciatingAssets[index];
    
    // Update the field
    asset[field] = field === 'description' ? value : parseFloat(value) || 0;
    
    // Recalculate totals
    newDepreciatingAssets[index] = calculateDepreciatingAsset(asset);
    setDepreciatingAssets(newDepreciatingAssets);
  };

  const addDepreciatingAsset = () => {
    setDepreciatingAssets([...depreciatingAssets, {
      description: '',
      openingBalance: 0,
      addedDuringYear: 0,
      total: 0,
      depreciationRate: '10',
      depreciationAmount: 0,
      closingBalance: 0
    }]);
  };

  const removeDepreciatingAsset = (index) => {
    if (depreciatingAssets.length > 1) {
      const newDepreciatingAssets = depreciatingAssets.filter((_, i) => i !== index);
      setDepreciatingAssets(newDepreciatingAssets);
    }
  };

  // Add these new handler functions before the handleSubmit function
  const handleCapitalAccountChange = (field, value) => {
    console.log('Handling capital account change:', { field, value });
    const parsedValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    console.log('Parsed value:', parsedValue);
    
    setCapitalAccount(prev => {
      const updated = {
        ...prev,
        [field]: parsedValue
      };
      console.log('Updated capital account:', updated);
      return updated;
    });
  };

  const handleOtherIncomeChange = (index, field, value) => {
    const newOtherIncomes = [...capitalAccount.otherIncomes];
    newOtherIncomes[index][field] = field === 'amount' ? (parseFloat(value) || 0) : value;
    setCapitalAccount(prev => ({
      ...prev,
      otherIncomes: newOtherIncomes
    }));
  };

  const handleOtherExpenseChange = (index, field, value) => {
    const newOtherExpenses = [...capitalAccount.otherExpenses];
    newOtherExpenses[index][field] = field === 'amount' ? (parseFloat(value) || 0) : value;
    setCapitalAccount(prev => ({
      ...prev,
      otherExpenses: newOtherExpenses
    }));
  };

  const addOtherIncome = () => {
    setCapitalAccount(prev => ({
      ...prev,
      otherIncomes: [...prev.otherIncomes, { description: '', amount: 0 }]
    }));
  };

  const addOtherExpense = () => {
    setCapitalAccount(prev => ({
      ...prev,
      otherExpenses: [...prev.otherExpenses, { description: '', amount: 0 }]
    }));
  };

  const removeOtherIncome = (index) => {
    if (capitalAccount.otherIncomes.length > 1) {
      setCapitalAccount(prev => ({
        ...prev,
        otherIncomes: prev.otherIncomes.filter((_, i) => i !== index)
      }));
    }
  };

  const removeOtherExpense = (index) => {
    if (capitalAccount.otherExpenses.length > 1) {
      setCapitalAccount(prev => ({
        ...prev,
        otherExpenses: prev.otherExpenses.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateCapitalAccountTotals = () => {
    if (!capitalAccount) return { firstTotal: 0, finalTotal: 0 };

    const totalOtherIncomes = Array.isArray(capitalAccount.otherIncomes) 
      ? capitalAccount.otherIncomes.reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0)
      : 0;

    const openingCapital = parseFloat(capitalAccount.openingCapital) || 0;
    const netProfit = parseFloat(capitalAccount.netProfit) || 0;
    const firstTotal = openingCapital + netProfit + totalOtherIncomes;

    const totalOtherExpenses = Array.isArray(capitalAccount.otherExpenses)
      ? capitalAccount.otherExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
      : 0;

    const householdExpenses = parseFloat(capitalAccount.householdExpenses) || 0;
    const finalTotal = firstTotal - householdExpenses - totalOtherExpenses;

    return { firstTotal, finalTotal };
  };

  // Add handlers for Sundry Creditors
  const handleSundryCreditorChange = (index, field, value) => {
    const newSundryCreditors = [...sundryCreditors];
    newSundryCreditors[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setSundryCreditors(newSundryCreditors);
  };

  const addSundryCreditor = () => {
    setSundryCreditors([...sundryCreditors, { description: '', amount: 0 }]);
  };

  const removeSundryCreditor = (index) => {
    if (sundryCreditors.length > 1) {
      setSundryCreditors(sundryCreditors.filter((_, i) => i !== index));
    }
  };

  // Add handlers for Loans
  const handleLoanChange = (index, field, value) => {
    const newLoans = [...loans];
    newLoans[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setLoans(newLoans);
  };

  const addLoan = () => {
    setLoans([...loans, { description: '', amount: 0 }]);
  };

  const removeLoan = (index) => {
    if (loans.length > 1) {
      setLoans(loans.filter((_, i) => i !== index));
    }
  };

  // Add handlers for Provisions
  const handleProvisionChange = (index, field, value) => {
    const newProvisions = [...provisions];
    newProvisions[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setProvisions(newProvisions);
  };

  const addProvision = () => {
    setProvisions([...provisions, { description: '', amount: 0 }]);
  };

  const removeProvision = (index) => {
    if (provisions.length > 1) {
      setProvisions(provisions.filter((_, i) => i !== index));
    }
  };

  // Add calculation for total liabilities
  const calculateLiabilitiesTotal = () => {
    const capitalAccountTotal = calculateCapitalAccountTotals().finalTotal;
    const sundryCreditorTotal = sundryCreditors.reduce((sum, creditor) => sum + creditor.amount, 0);
    const loansTotal = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const provisionsTotal = provisions.reduce((sum, provision) => sum + provision.amount, 0);

    return {
      sundryCreditorTotal,
      loansTotal,
      provisionsTotal,
      totalLiabilities: capitalAccountTotal + sundryCreditorTotal + loansTotal + provisionsTotal
    };
  };

  // Add handlers for Sundry Debtors
  const handleSundryDebtorChange = (index, field, value) => {
    const newSundryDebtors = [...sundryDebtors];
    newSundryDebtors[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setSundryDebtors(newSundryDebtors);
  };

  const addSundryDebtor = () => {
    setSundryDebtors([...sundryDebtors, { description: '', amount: 0 }]);
  };

  const removeSundryDebtor = (index) => {
    if (sundryDebtors.length > 1) {
      setSundryDebtors(sundryDebtors.filter((_, i) => i !== index));
    }
  };

  // Add handlers for Cash in Bank
  const handleCashInBankChange = (index, field, value) => {
    const newCashInBank = [...cashInBank];
    newCashInBank[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setCashInBank(newCashInBank);
  };

  const addCashInBank = () => {
    setCashInBank([...cashInBank, { description: '', amount: 0 }]);
  };

  const removeCashInBank = (index) => {
    if (cashInBank.length > 1) {
      setCashInBank(cashInBank.filter((_, i) => i !== index));
    }
  };

  // Add handlers for Cash in Hand
  const handleCashInHandChange = (index, field, value) => {
    const newCashInHand = [...cashInHand];
    newCashInHand[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setCashInHand(newCashInHand);
  };

  const addCashInHand = () => {
    setCashInHand([...cashInHand, { description: '', amount: 0 }]);
  };

  const removeCashInHand = (index) => {
    if (cashInHand.length > 1) {
      setCashInHand(cashInHand.filter((_, i) => i !== index));
    }
  };

  // Add handlers for Loan Advances
  const handleLoanAdvanceChange = (index, field, value) => {
    const newLoanAdvances = [...loanAdvances];
    newLoanAdvances[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setLoanAdvances(newLoanAdvances);
  };

  const addLoanAdvance = () => {
    setLoanAdvances([...loanAdvances, { description: '', amount: 0 }]);
  };

  const removeLoanAdvance = (index) => {
    if (loanAdvances.length > 1) {
      setLoanAdvances(loanAdvances.filter((_, i) => i !== index));
    }
  };

  // Update handleSubmit to include new sections
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get year from URL path
      const pathParts = window.location.pathname.split('/');
      const year = pathParts[pathParts.length - 1];
      
      // Calculate total depreciation from all depreciating assets
      const totalDepreciation = depreciatingAssets.reduce((sum, asset) => {
        const depAmount = Number(asset.depreciationAmount) || 0;
        console.log(`Asset: ${asset.description}, Depreciation Amount: ${depAmount}`);
        return sum + depAmount;
      }, 0);

      console.log('Total Depreciation:', totalDepreciation);

      // First update the balance sheet
      console.log('Submitting balance sheet data with household expenses:', {
        householdExpenses: Number(capitalAccount.householdExpenses),
        capitalAccount
      });

      const balanceSheetResponse = await fetch(`/api/clients/${clientId}/balance-sheet?year=${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capitalAccount: {
            openingCapital: Number(capitalAccount.openingCapital),
            netProfit: Number(capitalAccount.netProfit),
            otherIncomes: capitalAccount.otherIncomes,
            householdExpenses: Number(capitalAccount.householdExpenses),
            otherExpenses: capitalAccount.otherExpenses
          },
          fixedAssets,
          depreciatingAssets,
          sundryDebtors,
          cashInBank,
          cashInHand,
          loanAdvances,
          sundryCreditors,
          loans,
          provisions,
          closingStock: Number(closingStock) // Include closing stock in the submission
        })
      });

      if (!balanceSheetResponse.ok) {
        const errorData = await balanceSheetResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save balance sheet data');
      }

      // Then update the profit & loss data with the depreciation amount
      console.log('Updating P&L with depreciation:', totalDepreciation);
      
      // First fetch existing P&L data
      const existingPLResponse = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`);
      const existingPLData = await existingPLResponse.json();
      
      if (!existingPLResponse.ok) {
        throw new Error('Failed to fetch existing profit & loss data');
      }

      // Then update P&L with existing data plus new depreciation
      const profitLossResponse = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...existingPLData.data,
          depreciation: totalDepreciation
        }),
      });

      if (!profitLossResponse.ok) {
        const errorText = await profitLossResponse.text();
        console.error('P&L Update Error Response:', errorText);
        throw new Error('Failed to update depreciation in profit & loss');
      }

      const plUpdateResult = await profitLossResponse.json();
      console.log('P&L update result:', plUpdateResult);

      const result = await balanceSheetResponse.json();
      if (result.success) {
        toast.success('Balance sheet data saved successfully');
        // Refresh the profit & loss data to show updated depreciation
        const plResponse = await fetch(`/api/clients/${clientId}/profit-loss?year=${year}`);
        const plResult = await plResponse.json();
        if (plResponse.ok && plResult.success && plResult.data) {
          console.log('Updated P&L data:', plResult.data);
          setProfitLossData(plResult.data);
        }
      } else {
        throw new Error(result.message || 'Failed to save balance sheet data');
      }
    } catch (error) {
      console.error('Error saving balance sheet:', error);
      toast.error(error.message || 'Error saving balance sheet data');
    }
  };

  // Update the PDF view handler to use the reports page
  const handleViewPDF = () => {
    // Get year from URL path
      const pathParts = window.location.pathname.split('/');
      const year = pathParts[pathParts.length - 1];
      
    // Navigate to the reports page with the correct parameters
    window.open(`/reports?type=balance-sheet&clientId=${clientId}&year=${year}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading balance sheet data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load balance sheet</h3>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Assets Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assets</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{assetTotals.grandTotal.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
      </div>

        {/* Total Liabilities Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Liabilities</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{calculateLiabilitiesTotal().totalLiabilities.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>
        
        {/* Difference Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Difference</h3>
          <div className="flex items-center gap-2 mt-2">
            {assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities === 0 ? (
              <span className="text-yellow-500 dark:text-yellow-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                </svg>
              </span>
            ) : assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities > 0 ? (
              <span className="text-green-500 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              </span>
            ) : (
              <span className="text-red-500 dark:text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
              </span>
            )}
            <p className={`text-2xl font-bold ${
              assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities === 0
                ? 'text-yellow-600 dark:text-yellow-400'
                : assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              ₹{Math.abs(assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities).toLocaleString()}
            </p>
          </div>
          <div className={`mt-2 h-1 w-full rounded-full ${
            assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities === 0
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
              : assetTotals.grandTotal - calculateLiabilitiesTotal().totalLiabilities > 0
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          }`}></div>
        </div>

        {/* Current Assets Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Assets</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{assetTotals.currentAssets.toLocaleString()}</p>
          <div className="mt-2 h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
        </div>

      {/* View Toggle and Previous Year Button */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Balance Sheet
          {calculatePreviousYear(year) && (
            <button
              type="button"
              onClick={() => setIsShowingPreviousYear(true)}
              className="ml-2 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              View {calculatePreviousYear(year)}
            </button>
          )}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - Liabilities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Liabilities</h2>
            
            {/* Capital Account Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-2 text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Capital Account
              </h3>
              
              {/* Opening Capital */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Capital</label>
              <input
                type="number"
                  value={capitalAccount.openingCapital}
                  onChange={(e) => handleCapitalAccountChange('openingCapital', e.target.value)}
                  className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

              {/* Net Profit from P&L */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Net Profit (from Profit & Loss)</label>
                <input
                  type="number"
                  value={capitalAccount.netProfit}
                  readOnly
                  className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Other Income Items */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other Income</label>
                  <button
                    type="button"
                    onClick={addOtherIncome}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add
                  </button>
                </div>

                {(capitalAccount?.otherIncomes || []).map((income, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={income.description || ''}
                      onChange={(e) => handleOtherIncomeChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={income.amount || 0}
                      onChange={(e) => handleOtherIncomeChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeOtherIncome(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* First Total */}
              <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="text-right font-bold text-green-800 dark:text-green-100">
                  Total: {calculateCapitalAccountTotals().firstTotal}
                </div>
              </div>

              {/* Less: Household Expenses */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Less: Household Expenses</label>
              <input
                type="number"
                  value={capitalAccount.householdExpenses}
                  onChange={(e) => handleCapitalAccountChange('householdExpenses', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
              />
              </div>

              {/* Less: Other Expenses */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Less: Other Expenses</label>
                {(capitalAccount?.otherExpenses || []).map((expense, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={expense.description || ''}
                      onChange={(e) => handleOtherExpenseChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expense.amount || 0}
                      onChange={(e) => handleOtherExpenseChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeOtherExpense(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions Total */}
              <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="text-right font-bold text-green-800 dark:text-green-100">
                  Total Deductions: {calculateCapitalAccountTotals().finalTotal}
                </div>
              </div>

              {/* Closing Capital */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="text-right text-xl font-bold text-green-800 dark:text-green-100">
                  Closing Capital: {calculateCapitalAccountTotals().finalTotal}
                </div>
              </div>
            </div>

            {/* Sundry Creditors Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Sundry Creditors</h3>
              {sundryCreditors.map((creditor, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={creditor.description}
                    onChange={(e) => handleSundryCreditorChange(index, 'description', e.target.value)}
                    className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={creditor.amount}
                    onChange={(e) => handleSundryCreditorChange(index, 'amount', e.target.value)}
                    className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeSundryCreditor(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSundryCreditor}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Creditor
              </button>
              <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                Total Creditors: {calculateLiabilitiesTotal().sundryCreditorTotal}
              </div>
            </div>

            {/* Loans Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Loans</h3>
              {loans.map((loan, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={loan.description}
                    onChange={(e) => handleLoanChange(index, 'description', e.target.value)}
                    className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={loan.amount}
                    onChange={(e) => handleLoanChange(index, 'amount', e.target.value)}
                    className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeLoan(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLoan}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Loan
              </button>
              <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                Total Loans: {calculateLiabilitiesTotal().loansTotal}
              </div>
            </div>

            {/* Provisions Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Provisions</h3>
              {provisions.map((provision, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={provision.description}
                    onChange={(e) => handleProvisionChange(index, 'description', e.target.value)}
                    className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
              <input
                type="number"
                    placeholder="Amount"
                    value={provision.amount}
                    onChange={(e) => handleProvisionChange(index, 'amount', e.target.value)}
                    className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeProvision(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addProvision}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Provision
              </button>
              <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                Total Provisions: {calculateLiabilitiesTotal().provisionsTotal}
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div className="text-right text-xl font-bold text-green-800 dark:text-green-100">
                Total Liabilities: {calculateLiabilitiesTotal().totalLiabilities}
              </div>
            </div>
          </div>

          {/* Right Side - Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">Assets</h2>
            {/* Fixed Assets Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-2 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Fixed Assets
              </h3>
              {fixedAssets.map((asset, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input
                      type="text"
                      value={asset.description}
                      onChange={(e) => handleFixedAssetChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                      value={asset.amount}
                      onChange={(e) => handleFixedAssetChange(index, 'amount', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeFixedAsset(index)}
                      className="mb-1 p-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addFixedAsset}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add More Fixed Assets
              </button>
              <div className="mt-4 text-right font-bold">
                Total Fixed Assets: {assetTotals.fixedAssets.toLocaleString()}
              </div>
            </div>

            {/* Depreciating Assets Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Depreciating Assets</h3>
              {depreciatingAssets.map((asset, index) => (
                <div key={index} className="border p-4 rounded-lg mb-4 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <input
                        type="text"
                        value={asset.description}
                        onChange={(e) => handleDepreciatingAssetChange(index, 'description', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Balance</label>
                      <input
                        type="number"
                        value={asset.openingBalance}
                        onChange={(e) => handleDepreciatingAssetChange(index, 'openingBalance', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Added During Year</label>
                      <input
                        type="number"
                        value={asset.addedDuringYear}
                        onChange={(e) => handleDepreciatingAssetChange(index, 'addedDuringYear', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total</label>
                      <input
                        type="number"
                        value={asset.total}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Depreciation Rate</label>
                      <select
                        value={asset.depreciationRate}
                        onChange={(e) => handleDepreciatingAssetChange(index, 'depreciationRate', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                      >
                        {DEPRECIATION_RATES.map(rate => (
                          <option key={rate.value} value={rate.value}>{rate.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Depreciation Amount</label>
                      <input
                        type="number"
                        value={asset.depreciationAmount}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded-md">
                    <div className="font-bold text-gray-900 dark:text-white">
                      Closing Balance: {asset.closingBalance}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDepreciatingAsset(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addDepreciatingAsset}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add More Depreciating Assets
              </button>
              <div className="mt-4 text-right font-bold text-gray-800 dark:text-white">
                Total Depreciating Assets: {assetTotals.depreciatingAssets.toLocaleString()}
              </div>
            </div>

            {/* Current Assets Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-2 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Current Assets
              </h3>

              {/* Closing Stock Section */}
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Closing Stock
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Auto-fetched from Trading Account)
                      </span>
                    </h4>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{closingStock.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Sundry Debtors */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Sundry Debtors</h4>
                {sundryDebtors.map((debtor, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={debtor.description}
                      onChange={(e) => handleSundryDebtorChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={debtor.amount}
                      onChange={(e) => handleSundryDebtorChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSundryDebtor(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSundryDebtor}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Debtor
                </button>
                <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                  Total Debtors: {assetTotals.sundryDebtors.toLocaleString()}
                </div>
              </div>
              
              {/* Cash in Bank */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Cash in Bank</h4>
                {cashInBank.map((cash, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={cash.description}
                      onChange={(e) => handleCashInBankChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={cash.amount}
                      onChange={(e) => handleCashInBankChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeCashInBank(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCashInBank}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Bank Account
                </button>
                <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                  Total Cash in Bank: {assetTotals.cashInBank.toLocaleString()}
                </div>
              </div>

              {/* Cash in Hand */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Cash in Hand</h4>
                {cashInHand.map((cash, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={cash.description}
                      onChange={(e) => handleCashInHandChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={cash.amount}
                      onChange={(e) => handleCashInHandChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeCashInHand(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCashInHand}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Cash Entry
                </button>
                <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                  Total Cash in Hand: {assetTotals.cashInHand.toLocaleString()}
                </div>
              </div>

              {/* Loan Advances */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Loan Advances</h4>
                {loanAdvances.map((loan, index) => (
                  <div key={index} className="flex gap-4 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={loan.description}
                      onChange={(e) => handleLoanAdvanceChange(index, 'description', e.target.value)}
                      className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={loan.amount}
                      onChange={(e) => handleLoanAdvanceChange(index, 'amount', e.target.value)}
                      className="w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeLoanAdvance(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLoanAdvance}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Loan Advance
                </button>
                <div className="mt-2 text-right font-bold text-gray-800 dark:text-white">
                  Total Loan Advances: {assetTotals.loanAdvances.toLocaleString()}
                </div>
              </div>

              {/* Current Assets Total */}
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="text-right font-bold text-green-800 dark:text-green-100">
                  Total Current Assets: {assetTotals.currentAssets.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Assets Grand Total */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div className="text-right text-xl font-bold text-green-800 dark:text-green-100">
                Total Assets: {assetTotals.grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Balance Sheet
          </button>
        </div>
      </form>

      {/* Previous Year Modal */}
      {isShowingPreviousYear && calculatePreviousYear(year) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[95vw] sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Previous Year Details ({calculatePreviousYear(year)})
                      </h3>
                      <button
                    onClick={() => setIsShowingPreviousYear(false)}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                <div className="mt-2 w-full max-h-[85vh] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Balance Sheet Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-2 text-blue-600 dark:text-blue-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </span>
                          Balance Sheet
                        </h4>
                    </div>
                      <div className="p-4">
                        <ErrorBoundary fallback={<div className="text-red-500 dark:text-red-400 p-4">Error loading previous year's balance sheet</div>}>
                          <Suspense fallback={
                            <div className="flex items-center justify-center p-8">
                              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          }>
                        <PreviousBalanceSheet clientId={clientId} year={calculatePreviousYear(year)} />
                          </Suspense>
                        </ErrorBoundary>
                  </div>
                </div>

                    {/* Trading Profit & Loss Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2 text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          Trading Profit & Loss
                        </h4>
              </div>
                      <div className="p-4">
                        <ErrorBoundary fallback={<div className="text-red-500 dark:text-red-400 p-4">Error loading previous year's profit & loss</div>}>
                          <Suspense fallback={
                            <div className="flex items-center justify-center p-8">
                              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          }>
                        <PreviousTradingProfitLoss clientId={clientId} year={calculatePreviousYear(year)} />
                          </Suspense>
                        </ErrorBoundary>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsShowingPreviousYear(false)}
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

export default BalanceSheet;