import { NextResponse } from 'next/server';
import { db, listClients, deleteClientFinancialData, deleteClient } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    // Get all clients
    const clients = await listClients();
    
    // For each client, delete their financial data and then the client itself
    for (const client of clients) {
      try {
        // Delete all financial data for the client
        await deleteClientFinancialData(client.id);
        
        // Delete the client
        await deleteClient(client.id);
        
        console.log(`Successfully deleted client ${client.id} and their data`);
      } catch (error) {
        console.error(`Error deleting client ${client.id}:`, error);
        // Continue with other clients even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data reset successful. All clients and their data have been deleted.',
      details: {
        clientsDeleted: clients.length
      }
    });

  } catch (error) {
    console.error('Error during data reset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset data',
        details: error.message
      },
      { status: 500 }
    );
  }
} 