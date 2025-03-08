import { NextResponse } from 'next/server';
import { getClientById, listClientFinancialYears } from '../../../lib/firebase';

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

    // Get client from Firebase
    const client = await getClientById(clientId);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get years for this client from Firebase
    const years = await listClientFinancialYears(clientId);

    return NextResponse.json({
      success: true,
      data: years
    });
  } catch (error) {
    console.error('Error fetching client years:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client years' },
      { status: 500 }
    );
  }
}