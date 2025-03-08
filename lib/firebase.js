import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let analytics = null;
let auth;
let db;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

export { db, auth, analytics };

// Helper function to get client by ID
export async function getClientById(clientId) {
  try {
    const clientRef = doc(db, 'clients', clientId);
    const clientDoc = await getDoc(clientRef);

    if (!clientDoc.exists()) {
      return null;
    }

    return {
      id: clientDoc.id,
      ...clientDoc.data()
    };
  } catch (error) {
    console.error('Error getting client by ID:', error);
    throw error;
  }
}

// Helper function to get client by name
export async function getClientByName(name) {
  try {
    if (!name) return null;
    
    const clientsRef = collection(db, 'clients');
    const querySnapshot = await getDocs(clientsRef);
    
    // Normalize the search name - handle special characters and multiple spaces
    const searchName = name.toLowerCase()
      .trim()
      .normalize('NFKD')  // Normalize Unicode characters
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters except spaces and hyphens
      .replace(/\s+/g, ' ');  // Normalize multiple spaces to single space
    
    // Create variations of the search name
    const searchVariations = [
      searchName,
      searchName.replace(/\s+/g, '_'),  // Replace spaces with underscores
      searchName.replace(/[-\s]+/g, '_'),  // Replace both hyphens and spaces with underscores
      searchName.replace(/[-_\s]+/g, ''),  // Remove all separators
      searchName.replace(/\s+/g, ''),      // Remove spaces
      searchName.replace(/-+/g, '')        // Remove hyphens
    ];
    
    console.log('Searching for client with normalized names:', {
      original: name,
      variations: searchVariations
    });
    
    // Find client with case-insensitive name match, trying different variations
    const matchingDoc = querySnapshot.docs.find(doc => {
      const clientData = doc.data();
      
      // Normalize stored names the same way as search name
      const storedName = (clientData.name || '').toLowerCase()
        .trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-_]/g, '')
        .replace(/\s+/g, ' ');
      
      const storedBusinessName = (clientData.businessName || '').toLowerCase()
        .trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-_]/g, '')
        .replace(/\s+/g, ' ');
      
      // Create variations of stored names
      const storedVariations = [
        storedName,
        storedName.replace(/\s+/g, '_'),
        storedName.replace(/[-\s]+/g, '_'),
        storedName.replace(/[-_\s]+/g, ''),
        storedName.replace(/\s+/g, ''),
        storedName.replace(/-+/g, '')
      ];
      
      const businessVariations = [
        storedBusinessName,
        storedBusinessName.replace(/\s+/g, '_'),
        storedBusinessName.replace(/[-\s]+/g, '_'),
        storedBusinessName.replace(/[-_\s]+/g, ''),
        storedBusinessName.replace(/\s+/g, ''),
        storedBusinessName.replace(/-+/g, '')
      ];
      
      console.log('Comparing with stored variations:', {
        docId: doc.id,
        storedVariations,
        businessVariations
      });
      
      // Check if any variation matches
      return searchVariations.some(searchVar => 
        storedVariations.includes(searchVar) || 
        businessVariations.includes(searchVar) ||
        // Also check if the document ID matches
        doc.id.toLowerCase() === searchVar
      );
    });
    
    if (matchingDoc) {
      console.log('Found client by name:', {
        id: matchingDoc.id,
        name: matchingDoc.data().name,
        businessName: matchingDoc.data().businessName
      });
      return {
        id: matchingDoc.id,
        ...matchingDoc.data()
      };
    }
    
    console.log('No client found with name:', name);
    return null;
  } catch (error) {
    console.error('Error getting client by name:', error);
    return null;
  }
}

// Helper function to list all clients
async function listClients() {
  const clientsRef = collection(db, 'clients');
  const q = query(clientsRef, orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper function to create or update client yearly data
async function setClientYearlyData(clientId, year, data) {
  const yearlyDataRef = doc(db, 'clients', clientId, 'yearlyData', year);
  await setDoc(yearlyDataRef, data);
  return { id: year, ...data };
}

// Helper function to get client yearly data
async function getClientYearlyData(clientId, year) {
  const yearlyDataRef = doc(db, 'clients', clientId, 'yearlyData', year);
  const docSnap = await getDoc(yearlyDataRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// Helper function to list all yearly data for a client
async function listClientYearlyData(clientId) {
  const yearlyDataRef = collection(db, 'clients', clientId, 'yearlyData');
  const querySnapshot = await getDocs(yearlyDataRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Helper function to delete client yearly data
async function deleteClientYearlyData(clientId, year) {
  const yearlyDataRef = doc(db, 'clients', clientId, 'yearlyData', year);
  await deleteDoc(yearlyDataRef);
}

// Helper function to save client financial data
async function saveClientFinancialData(clientId, year, type, data) {
  try {
    console.log(`\nPreparing to save ${type} data for client ${clientId} - year ${year}`);

    // Create document ID using client, year, and type
    const docId = `${clientId}_${year}_${type}`;
    
    // Get the appropriate collection reference based on type
    const collectionRef = collection(db, type === 'balance_sheet' ? 'balanceSheets' : 'profitAndLoss');
    const docRef = doc(collectionRef, docId);

    // Base data structure with metadata
    const firestoreData = {
      clientId: String(clientId),
      year: String(year),
      type: String(type),
      lastUpdated: new Date().toISOString()
    };

    if (type === 'balance_sheet') {
      // Store balance sheet data in a flat structure
      firestoreData.openingCapital = Number(data.capitalAccount?.openingCapital) || 0;
      firestoreData.householdExpenses = Number(data.capitalAccount?.householdExpenses) || 0;
      firestoreData.otherIncomes = JSON.stringify(data.capitalAccount?.otherIncomes || []);
      firestoreData.otherExpenses = JSON.stringify(data.capitalAccount?.otherExpenses || []);

      // Store arrays as stringified JSON
      firestoreData.fixedAssets = JSON.stringify(data.fixedAssets || []);
      firestoreData.depreciatingAssets = JSON.stringify(data.depreciatingAssets || []);
      firestoreData.sundryDebtors = JSON.stringify(data.sundryDebtors || []);
      firestoreData.cashInBank = JSON.stringify(data.cashInBank || []);
      firestoreData.cashInHand = JSON.stringify(data.cashInHand || []);
      firestoreData.loanAdvances = JSON.stringify(data.loanAdvances || []);
      firestoreData.sundryCreditors = JSON.stringify(data.sundryCreditors || []);
      firestoreData.loans = JSON.stringify(data.loans || []);
      firestoreData.provisions = JSON.stringify(data.provisions || []);

      // Store totals for quick access
      firestoreData.totalFixedAssets = (data.fixedAssets || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalDepreciatingAssets = (data.depreciatingAssets || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalDepreciation = (data.depreciatingAssets || []).reduce((sum, item) => sum + (Number(item.depreciationAmount) || 0), 0);
      firestoreData.totalSundryDebtors = (data.sundryDebtors || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalCashInBank = (data.cashInBank || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalCashInHand = (data.cashInHand || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalLoanAdvances = (data.loanAdvances || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalSundryCreditors = (data.sundryCreditors || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalLoans = (data.loans || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      firestoreData.totalProvisions = (data.provisions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      // After saving balance sheet, update profit & loss with depreciation
      const plDocId = `${clientId}_${year}_profit_loss`;
      const plDocRef = doc(db, 'profitAndLoss', plDocId);
      const plDoc = await getDoc(plDocRef);
      
      if (plDoc.exists()) {
        // Update only the depreciation field in profit & loss
        await updateDoc(plDocRef, {
          depreciation: firestoreData.totalDepreciation,
          lastUpdated: new Date().toISOString()
        });
        console.log('Updated depreciation in profit & loss:', firestoreData.totalDepreciation);
      }

    } else if (type === 'profit_loss') {
      // Store trading account data
      firestoreData.openingStock = Number(data.tradingAccount?.openingStock) || 0;
      firestoreData.purchases = Number(data.tradingAccount?.purchases) || 0;
      firestoreData.directExpenses = Number(data.tradingAccount?.directExpenses) || 0;
      firestoreData.sales = Number(data.tradingAccount?.sales) || 0;
      firestoreData.closingStock = Number(data.tradingAccount?.closingStock) || 0;
      firestoreData.grossProfit = Number(data.tradingAccount?.grossProfit) || 0;

      // Store expenses
      firestoreData.wages = Number(data.expenses?.wages) || 0;
      firestoreData.rent = Number(data.expenses?.rent) || 0;
      firestoreData.utilities = Number(data.expenses?.utilities) || 0;
      firestoreData.insurance = Number(data.expenses?.insurance) || 0;
      firestoreData.officeExpenses = Number(data.expenses?.officeExpenses) || 0;
      firestoreData.travelExpenses = Number(data.expenses?.travelExpenses) || 0;
      firestoreData.repairMaintenance = Number(data.expenses?.repairMaintenance) || 0;
      firestoreData.legalProfessional = Number(data.expenses?.legalProfessional) || 0;
      firestoreData.bankCharges = Number(data.expenses?.bankCharges) || 0;
      firestoreData.miscExpenses = Number(data.expenses?.miscExpenses) || 0;
      firestoreData.depreciation = Number(data.expenses?.depreciation) || 0;
      firestoreData.customExpenses = JSON.stringify(data.customExpenses || []);
      const customExpensesTotal = (data.customExpenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      // Store summary
      firestoreData.otherIncome = Number(data.otherIncome) || 0;
      firestoreData.netProfit = Number(data.netProfit) || 0;
      
      // Calculate total expenses (including custom expenses)
      firestoreData.totalExpenses = 
        firestoreData.wages +
        firestoreData.rent +
        firestoreData.utilities +
        firestoreData.insurance +
        firestoreData.officeExpenses +
        firestoreData.travelExpenses +
        firestoreData.repairMaintenance +
        firestoreData.legalProfessional +
        firestoreData.bankCharges +
        firestoreData.miscExpenses +
        firestoreData.depreciation +
        customExpensesTotal;  // Add custom expenses to total

      // Get depreciation from balance sheet if available
      const bsDocId = `${clientId}_${year}_balance_sheet`;
      const bsDocRef = doc(db, 'balanceSheets', bsDocId);
      const bsDoc = await getDoc(bsDocRef);
      
      if (bsDoc.exists()) {
        const bsData = bsDoc.data();
        const depreciatingAssets = JSON.parse(bsData.depreciatingAssets || '[]');
        const totalDepreciation = depreciatingAssets.reduce((sum, item) => sum + (Number(item.depreciationAmount) || 0), 0);
        
        // Update depreciation if it's different
        if (totalDepreciation !== firestoreData.depreciation) {
          firestoreData.depreciation = totalDepreciation;
          firestoreData.totalExpenses = firestoreData.totalExpenses - data.expenses.depreciation + totalDepreciation;
          console.log('Updated depreciation from balance sheet:', totalDepreciation);
        }
      }
    }

    console.log('Prepared Firestore data:', JSON.stringify(firestoreData, null, 2));

    // Save the document
    await setDoc(docRef, firestoreData);

    return {
      success: true,
      message: `${type} data saved successfully for year ${year}`
    };
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Helper function to get client financial data
export async function getClientFinancialData(clientId, year, type) {
  try {
    if (!clientId || !year) {
      console.error('Missing required parameters:', { clientId, year, type });
      return null;
    }

    // If no type is specified, fetch both balance sheet and profit & loss
    if (!type) {
      console.log(`[Firebase] Fetching both balance sheet and profit & loss data for client ${clientId} - year ${year}`);
      
      const balanceSheetId = `${clientId}_${year}_balance_sheet`;
      const profitLossId = `${clientId}_${year}_profit_loss`;
      
      const balanceSheetRef = doc(db, 'balanceSheets', balanceSheetId);
      const profitLossRef = doc(db, 'profitAndLoss', profitLossId);
      
      const [balanceSheetSnap, profitLossSnap] = await Promise.all([
        getDoc(balanceSheetRef),
        getDoc(profitLossRef)
      ]);

      const balanceSheetData = balanceSheetSnap.exists() ? balanceSheetSnap.data() : null;
      const profitLossData = profitLossSnap.exists() ? profitLossSnap.data() : null;

      // Parse stringified arrays in balance sheet data if they exist
      const parsedBalanceSheet = balanceSheetData ? {
        ...balanceSheetData,
        openingCapital: Number(balanceSheetData.openingCapital) || 0,
        householdExpenses: Number(balanceSheetData.householdExpenses) || 0,
        otherIncomes: balanceSheetData.otherIncomes ? JSON.parse(balanceSheetData.otherIncomes) : [],
        otherExpenses: balanceSheetData.otherExpenses ? JSON.parse(balanceSheetData.otherExpenses) : [],
        fixedAssets: balanceSheetData.fixedAssets ? JSON.parse(balanceSheetData.fixedAssets) : [],
        depreciatingAssets: balanceSheetData.depreciatingAssets ? JSON.parse(balanceSheetData.depreciatingAssets) : [],
        sundryDebtors: balanceSheetData.sundryDebtors ? JSON.parse(balanceSheetData.sundryDebtors) : [],
        cashInBank: balanceSheetData.cashInBank ? JSON.parse(balanceSheetData.cashInBank) : [],
        cashInHand: balanceSheetData.cashInHand ? JSON.parse(balanceSheetData.cashInHand) : [],
        loanAdvances: balanceSheetData.loanAdvances ? JSON.parse(balanceSheetData.loanAdvances) : [],
        sundryCreditors: balanceSheetData.sundryCreditors ? JSON.parse(balanceSheetData.sundryCreditors) : [],
        loans: balanceSheetData.loans ? JSON.parse(balanceSheetData.loans) : [],
        provisions: balanceSheetData.provisions ? JSON.parse(balanceSheetData.provisions) : []
      } : null;

      return {
        balanceSheet: parsedBalanceSheet,
        profitLoss: profitLossData
      };
    }

    // If type is specified, proceed with existing logic
    console.log(`[Firebase] Fetching ${type} data for client ${clientId} - year ${year}`);
    
    const collectionName = type === 'balance_sheet' ? 'balanceSheets' : 'profitAndLoss';
    const docId = `${clientId}_${year}_${type}`;
    
    console.log(`[Firebase] Looking in collection: ${collectionName}, docId: ${docId}`);
    
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log(`[Firebase] No ${type} data found for client ${clientId} - year ${year}`);
    return null;
    }

    const data = docSnap.data();
    console.log(`[Firebase] Found ${type} data:`, JSON.stringify(data, null, 2));

    // Parse stringified arrays if they exist
    const parsedData = type === 'balance_sheet' ? {
      ...data,
      fixedAssets: data.fixedAssets ? JSON.parse(data.fixedAssets) : [],
      depreciatingAssets: data.depreciatingAssets ? JSON.parse(data.depreciatingAssets) : [],
      sundryDebtors: data.sundryDebtors ? JSON.parse(data.sundryDebtors) : [],
      cashInBank: data.cashInBank ? JSON.parse(data.cashInBank) : [],
      cashInHand: data.cashInHand ? JSON.parse(data.cashInHand) : [],
      loanAdvances: data.loanAdvances ? JSON.parse(data.loanAdvances) : [],
      sundryCreditors: data.sundryCreditors ? JSON.parse(data.sundryCreditors) : [],
      loans: data.loans ? JSON.parse(data.loans) : [],
      provisions: data.provisions ? JSON.parse(data.provisions) : []
    } : {
      ...data,
      // Parse custom expenses for profit & loss data
      customExpenses: data.customExpenses ? JSON.parse(data.customExpenses) : []
    };

    return {
      id: docSnap.id,
      data: parsedData
    };
  } catch (error) {
    console.error(`[Firebase] Error getting financial data:`, error);
    return null; // Return null instead of throwing to handle errors gracefully
  }
}

// Helper function to list client years
async function listClientFinancialYears(clientId) {
  try {
    const years = new Set();
    
    // Get years from balance sheets
    const balanceSheetsRef = collection(db, 'balanceSheets');
    const balanceSheetsQuery = query(balanceSheetsRef, where('clientId', '==', clientId));
    const balanceSheetsSnap = await getDocs(balanceSheetsQuery);
    balanceSheetsSnap.docs.forEach(doc => {
      const year = doc.data().year;
      if (year) years.add(year);
    });

    // Get years from profit and loss
    const profitLossRef = collection(db, 'profitAndLoss');
    const profitLossQuery = query(profitLossRef, where('clientId', '==', clientId));
    const profitLossSnap = await getDocs(profitLossQuery);
    profitLossSnap.docs.forEach(doc => {
      const year = doc.data().year;
      if (year) years.add(year);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  } catch (error) {
    console.error('Error listing client years:', error);
    return [];
  }
}

// Helper function to delete client financial data
async function deleteClientFinancialData(clientId) {
  try {
    // Delete balance sheets
    const balanceSheetsRef = collection(db, 'balanceSheets');
    const balanceSheetsQuery = query(balanceSheetsRef, where('clientId', '==', clientId));
    const balanceSheetsSnap = await getDocs(balanceSheetsQuery);
    const balanceSheetDeletes = balanceSheetsSnap.docs.map(doc => deleteDoc(doc.ref));

    // Delete profit and loss statements
    const profitLossRef = collection(db, 'profitAndLoss');
    const profitLossQuery = query(profitLossRef, where('clientId', '==', clientId));
    const profitLossSnap = await getDocs(profitLossQuery);
    const profitLossDeletes = profitLossSnap.docs.map(doc => deleteDoc(doc.ref));

    // Execute all deletes
    await Promise.all([...balanceSheetDeletes, ...profitLossDeletes]);
    
    return true;
  } catch (error) {
    console.error('Error deleting client financial data:', error);
    throw error;
  }
}

// Helper function to create a new client
async function createClient(clientData) {
  const { id, ...data } = clientData;
  const clientsRef = collection(db, 'clients');
  const docRef = doc(clientsRef, id);
  await setDoc(docRef, data);
  
  return {
    id,
    ...data
  };
}

// Helper function to update a client
async function updateClient(clientId, updates) {
  const docRef = doc(db, 'clients', clientId);
  await updateDoc(docRef, updates);
  
  return {
    id: clientId,
    ...updates
  };
}

// Helper function to delete a client
async function deleteClient(clientId) {
  const docRef = doc(db, 'clients', clientId);
  await deleteDoc(docRef);
  return true;
}

// Add a new function to update profit & loss depreciation
async function updateProfitLossDepreciation(clientId, year, depreciation) {
  try {
    const docId = `${clientId}_${year}_profit_loss`;
    const docRef = doc(db, 'profitAndLoss', docId);
    
    await updateDoc(docRef, {
      depreciation: Number(depreciation) || 0,
      lastUpdated: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Depreciation updated successfully'
    };
  } catch (error) {
    console.error('Error updating depreciation:', error);
    throw error;
  }
}

module.exports = {
  db,
  auth,
  getClientById,
  getClientByName,
  listClients,
  setClientYearlyData,
  getClientYearlyData,
  listClientYearlyData,
  deleteClientYearlyData,
  saveClientFinancialData,
  getClientFinancialData,
  listClientFinancialYears,
  deleteClientFinancialData,
  createClient,
  updateClient,
  deleteClient,
  updateProfitLossDepreciation
};