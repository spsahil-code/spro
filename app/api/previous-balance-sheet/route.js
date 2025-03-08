import { NextResponse } from 'next/server';
import { getClientById, getClientFinancialData } from '../../../lib/firebase';

// Add export for dynamic route configuration
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const year = searchParams.get('year');

    if (!clientId || !year) {
      return NextResponse.json(
        { success: false, error: 'Client ID and year are required' },
        { status: 400 }
      );
    }

    // Check if client exists
    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('Fetching previous year data for:', {
      clientId,
      requestedYear: year
    });

    // Get balance sheet data for the requested year (which is already the previous year)
    const data = await getClientFinancialData(clientId, year, 'balance_sheet');
    
    if (!data) {
      console.log('No data found for year:', year);
      return NextResponse.json(
        { success: false, error: 'No data found for previous year' },
        { status: 404 }
      );
    }

    console.log('Found data for year:', year);
    return NextResponse.json({
      success: true,
      data: {
        ...data.data,
        year // Include the year in the response
      }
    });
  } catch (error) {
    console.error('Error fetching previous year balance sheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch previous year balance sheet' },
      { status: 500 }
    );
  }
}