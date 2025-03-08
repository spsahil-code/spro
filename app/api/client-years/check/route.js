import { NextResponse } from 'next/server';
import { getClientById, getClientFinancialData } from '../../../../lib/firebase';

// Add export for dynamic route configuration
export const dynamic = 'force-dynamic';

/**
 * API endpoint to check if client data files exist for a specific year
 * @param {Request} request - The request object
 * @returns {NextResponse} - Response with file existence status
 */
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const year = searchParams.get('year');
    
    if (!clientId || !year) {
      return NextResponse.json(
        { success: false, error: 'Client ID and year are required' },
        { status: 400 }
      );
    }
    
    try {
      // Get client from Firebase
      const client = await getClientById(clientId);
      
      if (!client) {
        return NextResponse.json(
          { 
            success: true, 
            clientId,
            year,
            balance_sheet: false,
            profit_loss: false,
            message: 'Client not found'
          }
        );
      }
      
      // Check if balance sheet data exists
      let balanceSheetExists = false;
      let profitLossExists = false;
      
      try {
        const balanceSheetData = await getClientFinancialData(clientId, year, 'balance_sheet');
        balanceSheetExists = balanceSheetData !== null;
      } catch (error) {
        console.warn('Error checking balance sheet:', error);
        // Continue with false
      }
      
      try {
        const profitLossData = await getClientFinancialData(clientId, year, 'profit_loss');
        profitLossExists = profitLossData !== null;
      } catch (error) {
        console.warn('Error checking profit & loss:', error);
        // Continue with false
      }
      
      // Return results
      return NextResponse.json({
        success: true,
        clientId,
        year,
        balance_sheet: balanceSheetExists,
        profit_loss: profitLossExists
      });
      
    } catch (error) {
      console.error('Error checking client files:', error);
      // Return a successful response with false values instead of an error
      return NextResponse.json({
        success: true,
        clientId,
        year,
        balance_sheet: false,
        profit_loss: false,
        message: 'Error checking files'
      });
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    return NextResponse.json({
      success: true,
      balance_sheet: false,
      profit_loss: false,
      message: 'Internal server error'
    });
  }
}