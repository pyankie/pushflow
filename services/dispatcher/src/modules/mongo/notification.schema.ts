import mongoose from "mongoose";

export interface INotification {
  notificationId: string;
  senderId: string;
  receiverId?: string;
  topicId?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  status: string;
  timestamp: Date;
}

export const NotificationSchema = new mongoose.Schema<INotification>({
  notificationId: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: false },
  topicId: { type: String, required: false },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, required: true, default: "pending" }, // Add default status
  timestamp: { type: Date, default: Date.now },
});

NotificationSchema.index({ notificationId: 1 }, { unique: true });
