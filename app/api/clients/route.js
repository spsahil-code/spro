import { NextResponse } from 'next/server';
import { listClients, createClient, updateClient, deleteClient } from '../../../lib/firebase';

// GET endpoint to fetch all clients
export async function GET() {
  try {
    const clients = await listClients();
    
    // Ensure each client has an id field
    const formattedClients = clients.map(client => ({
      id: client.id || client.directory, // Use id if available, fallback to directory
      ...client
    }));

    return NextResponse.json({
      success: true,
      data: formattedClients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new client
export async function POST(request) {
  try {
    const data = await request.json();
    const { name, businessName, pan, gst, email, phone, whatsapp, address, city, state, pincode } = data;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Create sanitized ID from name
    const sanitizedId = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();

    // Create client in Firebase
    const clientData = {
      name,
      businessName: businessName || '',
      pan: pan || '',
      gst: gst || '',
      email: email || '',
      phone: phone || '',
      whatsapp: whatsapp || '',
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      id: sanitizedId // Use sanitized name as ID
    };

    const client = await createClient(clientData);

    return NextResponse.json({
      success: true,
      message: `Client ${name} created successfully`,
      data: client
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
