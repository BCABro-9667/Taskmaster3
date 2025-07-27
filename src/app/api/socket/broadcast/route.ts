
// src/app/api/socket/broadcast/route.ts
import { getIo } from '@/lib/socket-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { room } = await req.json();
    const io = getIo();
    
    if (io) {
      if (room) {
        // Broadcast to a specific room if provided
        io.to(room).emit('data_changed', 'server-broadcast');
      } else {
        // Otherwise, broadcast to all clients
        io.emit('data_changed', 'server-broadcast');
      }
      return NextResponse.json({ success: true, message: 'Broadcast successful' });
    } else {
      return NextResponse.json({ success: false, message: 'Socket.IO not initialized' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
