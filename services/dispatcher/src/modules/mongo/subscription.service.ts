import { Inject, Injectable, Logger } from '@nestjs/common'
import { Connection, Model } from 'mongoose'
import { ISubscription, SubscriptionSchema } from './subscription.schema'

@Injectable()
export class SubscriptionService {
    private readonly subscriptionModel: Model<ISubscription>
    private readonly logger = new Logger(SubscriptionService.name)

    constructor(
        @Inject('MONGO_CONNECTION')
        private readonly mongoConnection: Connection,
    ) {
        this.subscriptionModel = this.mongoConnection.model<ISubscription>(
            'Subscription',
            SubscriptionSchema,
        )
    }

    async subscribe(receiverId: string, topicId: string): Promise<void> {
        try {
            await this.subscriptionModel.updateOne(
                { receiverId, topicId },
                { $setOnInsert: { receiverId, topicId } },
                { upsert: true },
            )
            this.logger.log(`Subscribed receiverId=${receiverId} to topicId=${topicId}`)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`Failed to subscribe receiverId=${receiverId} to topicId=${topicId}: ${message}`)
            throw error
        }
    }

    async unsubscribe(receiverId: string, topicId: string): Promise<void> {
        try {
            await this.subscriptionModel.deleteOne({ receiverId, topicId })
            this.logger.log(`Unsubscribed receiverId=${receiverId} from topicId=${topicId}`)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`Failed to unsubscribe receiverId=${receiverId} from topicId=${topicId}: ${message}`)
            throw error
        }
    }

    async getSubscriptions(receiverId: string): Promise<string[]> {
        try {
            const docs = await this.subscriptionModel
                .find({ receiverId })
                .select('topicId -_id')
                .lean()
            return docs.map((d) => d.topicId)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            this.logger.error(`Failed to fetch subscriptions for receiverId=${receiverId}: ${message}`)
            throw error
        }
    }
}
