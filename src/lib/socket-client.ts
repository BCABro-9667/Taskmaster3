
'use server';

// This is a server-side client to communicate with the Socket.IO server.
// It sends a POST request to our own API route to trigger the broadcast.

export async function broadcastDataChange(room: string) {
  // Ensure we have a full URL for fetch, especially on the server
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    await fetch(`${url}/api/socket/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room }),
    });
  } catch (error) {
    console.error('Failed to broadcast data change:', error);
  }
}
