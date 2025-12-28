import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  private readonly TOPIC_SUBSCRIBE_CHANNEL =
    process.env.TOPIC_SUBSCRIBE_CHANNEL || "topics.subscribe";

  private readonly TOPIC_UNSUBSCRIBE_CHANNEL =
    process.env.TOPIC_UNSUBSCRIBE_CHANNEL || "topics.unsubscribe";

  constructor(private readonly redisService: RedisService) {}

  async subscribe(receiverId: string, topicId: string): Promise<void> {
    const publisher = this.redisService.getPublisher();
    const payload = { receiverId, topicId };
    await publisher.publish(
      this.TOPIC_SUBSCRIBE_CHANNEL,
      JSON.stringify(payload)
    );
    this.logger.log(
      `Published subscription for receiverId=${receiverId} topicId=${topicId}`
    );
  }

  async unsubscribe(receiverId: string, topicId: string): Promise<void> {
    const publisher = this.redisService.getPublisher();
    const payload = { receiverId, topicId };
    await publisher.publish(
      this.TOPIC_UNSUBSCRIBE_CHANNEL,
      JSON.stringify(payload)
    );
    this.logger.log(
      `Published unsubscription for receiverId=${receiverId} topicId=${topicId}`
    );
  }
}
