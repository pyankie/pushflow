import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnectionRegistry {
  private receiverToSocket = new Map<string, string>();
  private socketToReceiver = new Map<string, string>();

  constructor() {}

  register(receiverId: string, socketId: string) {
    const normalizedReceiverId = receiverId.toLowerCase();
    this.receiverToSocket.set(normalizedReceiverId, socketId);
    this.socketToReceiver.set(socketId, normalizedReceiverId);
  }

  unregister(socketId: string) {
    const receiverId = this.socketToReceiver.get(socketId);
    if (!receiverId) return;

    this.socketToReceiver.delete(socketId);
    this.receiverToSocket.delete(receiverId);
  }

  getSocket(receiverId: string) {
    return this.receiverToSocket.get(receiverId.toLowerCase());
  }
}
