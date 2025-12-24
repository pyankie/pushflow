import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDto } from 'src/dto/notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Send a notification',
    description:
      'Create and send a notification to a receiver. The notificationId and timestamp are auto-generated if not provided.',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification details',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() notification: CreateNotificationDto) {
    this.logger.log('Sending notification:', notification);
    await this.notificationService.handleNotification(notification);
  }
}
