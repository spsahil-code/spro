import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const data = await request.json();
    const { clientId, year } = data;

    // Add Balance Sheet data
    const balanceSheetRef = await addDoc(collection(db, 'balance_sheets'), {
      clientId,
      year,
      openingCapital: 1000000,
      householdExpenses: 50000,
      createdAt: Timestamp.now(),
      sundryCreditors: [
        { description: 'Supplier A', amount: 75000 },
        { description: 'Supplier B', amount: 45000 }
      ],
      fixedAssets: [
        { description: 'Building', amount: 2500000 },
        { description: 'Land', amount: 1500000 }
      ],
      depreciatingAssets: [
        {
          description: 'Machinery',
          openingBalance: 500000,
          addedDuringYear: 100000,
          total: 600000,
          depreciationRate: 10,
          depreciationAmount: 60000,
          closingBalance: 540000
        },
        {
          description: 'Vehicles',
          openingBalance: 300000,
          addedDuringYear: 0,
          total: 300000,
          depreciationRate: 15,
          depreciationAmount: 45000,
          closingBalance: 255000
        }
      ],
      currentAssets: {
        sundryDebtors: [
          { description: 'Customer A', amount: 125000 },
          { description: 'Customer B', amount: 85000 }
        ],
        cashInBank: [
          { description: 'Current Account', amount: 250000 },
          { description: 'Savings Account', amount: 150000 }
        ],
        cashInHand: [
          { description: 'Office Cash', amount: 25000 }
        ],
        loanAdvances: [
          { description: 'Staff Advance', amount: 30000 },
          { description: 'Security Deposit', amount: 50000 }
        ]
      }
    });

    // Add Profit & Loss data
    const profitLossRef = await addDoc(collection(db, 'profit_loss'), {
      clientId,
      year,
      openingStock: 200000,
      purchases: 1500000,
      directExpenses: 100000,
      sales: 2500000,
      closingStock: 300000,
      grossProfit: 1000000,
      wages: 250000,
      rent: 120000,
      utilities: 50000,
      insurance: 30000,
      officeExpenses: 45000,
      travelExpenses: 35000,
      repairMaintenance: 25000,
      legalProfessional: 40000,
      bankCharges: 5000,
      miscExpenses: 15000,
      depreciation: 105000,
      otherIncome: 50000,
      netProfit: 330000,
      createdAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      message: 'Test data added successfully',
      balanceSheetId: balanceSheetRef.id,
      profitLossId: profitLossRef.id
    });

  } catch (error) {
    console.error('Error adding test data:', error);
    return NextResponse.json(
      { success: false, message: 'Error adding test data', error: error.message },
      { status: 500 }
    );
  }
} 