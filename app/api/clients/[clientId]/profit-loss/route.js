import { NextResponse } from 'next/server';
import { getClientById, saveClientFinancialData, getClientFinancialData } from '../../../../../lib/firebase';

// Ensure database is initialized
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

// Helper function to get client name from ID
async function getClientName(db, clientId) {
  const client = await db.get('SELECT name FROM clients WHERE id = ?', [clientId]);
  return client ? client.name : null;
}

export async function GET(request, { params }) {
  try {
    const clientId = params.clientId;
    const { searchParams } = new URL(request.url);
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

    // Get profit & loss data
    const data = await getClientFinancialData(clientId, year, 'profit_loss');
    
    return NextResponse.json({
      success: true,
      data: data ? data.data : null
    });
  } catch (error) {
    console.error('Error fetching profit & loss:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profit & loss' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const clientId = params.clientId;
    const { searchParams } = new URL(request.url);
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

    // Get request body
    const data = await request.json();

    // Save profit & loss data
    const result = await saveClientFinancialData(clientId, year, 'profit_loss', data);
    
    return NextResponse.json({
      success: true,
      message: 'Profit & loss created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating profit & loss:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create profit & loss' },
      { status: 500 }
    );
  }
}