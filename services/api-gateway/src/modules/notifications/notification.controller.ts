import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Get,
  Param,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateNotificationDto,
  NotificationCreationResponseDto,
  NotificationStatusResponseDto,
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

  @ApiOperation({
    summary: 'Get notification status',
    description: 'Check the current status of a notification by its ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: NotificationStatusResponseDto,
    description: 'Notification status retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or missing notificationId',
  })
  @ApiResponse({
    status: HttpStatus.GATEWAY_TIMEOUT,
    description: 'Status query timed out',
  })
  @Get(':notificationId/status')
  @HttpCode(HttpStatus.OK)
  async getNotificationStatus(@Param('notificationId') notificationId: string) {
    this.logger.log(`Querying status for notification: ${notificationId}`);
    return await this.notificationService.getNotificationStatus(notificationId);
  }
}
