import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { Injectable } from '@nestjs/common';

interface RoomState {
  doc: Y.Doc;
  clients: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, RoomState> = new Map();
  private clientRooms: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const roomId = this.clientRooms.get(client.id);
    if (roomId) {
      this.leaveRoom(roomId, client);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; userName: string },
  ) {
    const { roomId, userId, userName } = data;
    
    client.join(roomId);
    this.clientRooms.set(client.id, roomId);

    if (!this.rooms.has(roomId)) {
      const doc = new Y.Doc();
      this.rooms.set(roomId, { doc, clients: new Set() });
    }

    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.clients.add(client.id);

    const stateVector = Y.encodeStateVector(room.doc);
    client.emit('sync', 1, stateVector);

    client.to(roomId).emit('user-joined', {
      userId,
      userName,
      clientId: client.id,
    });

    client.emit('room-state', {
      clientCount: room.clients.size,
      users: Array.from(room.clients).map((cid) => this.getClientUserInfo(cid)),
    });

    console.log(`User ${userName} joined room ${roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomId = this.clientRooms.get(client.id);
    if (roomId) {
      this.leaveRoom(roomId, client);
    }
  }

  private leaveRoom(roomId: string, client: Socket) {
    client.leave(roomId);
    this.clientRooms.delete(client.id);

    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(client.id);

      if (room.clients.size === 0) {
        this.saveRoomToDatabase(roomId, room.doc);
        this.rooms.delete(roomId);
      }
    }

    client.to(roomId).emit('user-left', { clientId: client.id });
  }

  @SubscribeMessage('sync')
  handleSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; update: Uint8Array },
  ) {
    const { roomId, update } = data;
    const room = this.rooms.get(roomId);

    if (room) {
      Y.applyUpdate(room.doc, new Uint8Array(update));
      client.to(roomId).emit('sync', update);
    }
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; state: any },
  ) {
    const { roomId, state } = data;
    client.to(roomId).emit('awareness-update', {
      clientId: client.id,
      state,
    });
  }

  @SubscribeMessage('cursor-move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; x: number; y: number; cardId?: string },
  ) {
    const { roomId, x, y, cardId } = data;
    client.to(roomId).emit('cursor-move', {
      clientId: client.id,
      x,
      y,
      cardId,
    });
  }

  private getClientUserInfo(clientId: string) {
    return { clientId };
  }

  private async saveRoomToDatabase(roomId: string, doc: Y.Doc) {
    const state = Y.encodeStateAsUpdate(doc);
    console.log(`Saving room ${roomId} state to database (${state.length} bytes)`);
  }

  async loadRoomFromDatabase(roomId: string): Promise<Y.Doc | null> {
    console.log(`Loading room ${roomId} state from database`);
    return null;
  }
}
