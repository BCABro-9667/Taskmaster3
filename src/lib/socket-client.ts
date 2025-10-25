
'use server';

// This is a server-side client to communicate with the Socket.IO server.
// DISABLED: Socket.IO requires a custom server in Next.js
// This would cause 404 errors without a custom server setup

export async function broadcastDataChange(room: string) {
  // Disabled to prevent 404 errors
  // Socket.IO requires a custom server which is not compatible with Next.js serverless deployment
  return;
  
  /* Original implementation disabled
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
  */
}
