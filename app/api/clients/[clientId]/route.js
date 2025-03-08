import { NextResponse } from 'next/server';
import { getClientById, updateClient, deleteClient } from '../../../../lib/firebase';

// GET endpoint to fetch a specific client
export async function GET(request, { params }) {
  try {
    const clientId = params.clientId;
    
    // Get client from Firebase
    const client = await getClientById(clientId);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client information' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update client details
export async function PUT(request, { params }) {
  try {
    const clientId = params.clientId;
    const data = await request.json();
    
    // Get existing client data
    const existingClient = await getClientById(clientId);
    
    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Update client details
    const updatedData = {
      ...existingClient,
      name: data.name || existingClient.name,
      businessName: data.businessName || existingClient.businessName || '',
      address: data.address || existingClient.address || '',
      phone: data.phone || existingClient.phone || '',
      email: data.email || existingClient.email || '',
      pan: data.pan || existingClient.pan || '',
      gst: data.gst || existingClient.gst || '',
      whatsapp: data.whatsapp || existingClient.whatsapp || '',
      city: data.city || existingClient.city || '',
      state: data.state || existingClient.state || '',
      pincode: data.pincode || existingClient.pincode || ''
    };
    
    await updateClient(clientId, updatedData);

    return NextResponse.json({
      success: true,
      message: 'Client details updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update client information' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a client
export async function DELETE(request, { params }) {
  try {
    const clientId = params.clientId;
    
    // Check if client exists
    const client = await getClientById(clientId);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete client from Firebase
    await deleteClient(clientId);

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}