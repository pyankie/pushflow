import mongoose from 'mongoose';

type Uuid = mongoose.Schema.Types.UUID;

export interface INotification {
  notificationId: Uuid;
  senderId: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  status: string;
  timestamp: Date;
}

export const NotificationSchema = new mongoose.Schema<INotification>({
  notificationId: { type: mongoose.Schema.Types.UUID, required: true },
  senderId: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
