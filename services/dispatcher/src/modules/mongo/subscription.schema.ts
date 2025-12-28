import mongoose from "mongoose";

export interface ISubscription {
  receiverId: string;
  topicId: string;
  createdAt: Date;
}

export const SubscriptionSchema = new mongoose.Schema<ISubscription>({
  receiverId: { type: String, required: true, index: true },
  topicId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

SubscriptionSchema.index({ receiverId: 1, topicId: 1 }, { unique: true });
