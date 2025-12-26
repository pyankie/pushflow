import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  NotificationCreationResponseDto,
} from 'src/dto/notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Send a notification',
    description: 'Create and send a notification to a receiver. ',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification details',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NotificationCreationResponseDto,
    description: 'Notification created successfully',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() notification: CreateNotificationDto) {
    this.logger.log('Sending notification:', notification);
    return await this.notificationService.handleNotification(notification);
  }
}
