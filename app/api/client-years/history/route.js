import { NextResponse } from 'next/server';
import { getClientFinancialData } from '../../../../lib/firebase';

// Add export for dynamic route configuration
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching history for client: ${clientId}`);
    
    // Get the last 5 years of data
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = 0; i < 5; i++) {
      const year = `${currentYear - i}-${currentYear - i + 1}`;
      console.log(`[API] Checking year: ${year}`);
      
      try {
        // Get both balance sheet and profit & loss data
        const balanceSheetData = await getClientFinancialData(clientId, year, 'balance_sheet');
        const profitLossData = await getClientFinancialData(clientId, year, 'profit_loss');
        
        console.log(`[API] Balance Sheet data for ${year}:`, JSON.stringify(balanceSheetData, null, 2));
        console.log(`[API] Profit & Loss data for ${year}:`, JSON.stringify(profitLossData, null, 2));
        
        if (balanceSheetData || profitLossData) {
          const yearData = {
            year,
            balanceSheet: balanceSheetData !== null,
            profitLoss: profitLossData !== null,
            balanceSheetLastUpdated: balanceSheetData?.data?.lastUpdated || null,
            profitLossLastUpdated: profitLossData?.data?.lastUpdated || null
          };

          console.log(`[API] Adding year data for ${year}:`, JSON.stringify(yearData, null, 2));
          years.push(yearData);
        } else {
          console.log(`[API] No valid statements found for ${year}`);
        }
      } catch (error) {
        console.error(`[API] Error fetching data for year ${year}:`, error);
      }
    }

    console.log('[API] Final years data:', JSON.stringify(years, null, 2));

    return NextResponse.json({
      success: true,
      years: years.sort((a, b) => b.year.localeCompare(a.year)) // Sort years in descending order
    });
  } catch (error) {
    console.error('[API] Error fetching client history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client history' },
      { status: 500 }
    );
  }
} 