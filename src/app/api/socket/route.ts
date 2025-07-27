
// src/app/api/socket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { Server as HttpServer } from 'http';
import { initSocketIO } from '@/lib/socket-server';

// This is a bit of a workaround for Next.js App Router.
// We need to get the underlying HTTP server to attach Socket.IO to.
// This API route will be called once by the client to ensure the server is up.
export async function GET(req: NextRequest) {
  // The 'socket' property is monkey-patched by Next.js in its server.
  // We need to access it to get the HTTP server instance.
  const res: any = new NextResponse();
  const server = res.socket?.server as HttpServer;

  if (server) {
    initSocketIO(server);
  } else {
    console.error('Could not get server from response socket.');
  }

  // We don't need to return anything meaningful here.
  // The purpose is just to trigger the server-side code.
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
