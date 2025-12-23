export interface INotification {
  notificationId: string;
  senderId: string;
  receiverId: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  status: string;
  timestamp: Date;
}
