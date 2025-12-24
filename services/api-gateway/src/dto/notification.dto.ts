import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateNotificationSchema = z.object({
  senderId: z.string().min(1, 'senderId is required'),
  receiverId: z.string().min(1, 'receiverId is required'),
  payload: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export class CreateNotificationDto extends createZodDto(
  CreateNotificationSchema,
) {
  @ApiProperty({ description: 'ID of the sender', example: 'user-123' })
  senderId: string;

  @ApiProperty({ description: 'ID of the receiver', example: 'user-456' })
  receiverId: string;

  @ApiProperty({
    description: 'Notification payload - can be any type',
    example: { message: 'Hello', type: 'info' },
  })
  payload: unknown;

  @ApiPropertyOptional({
    description: 'Optional metadata for the notification',
    example: { source: 'web', priority: 'high' },
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'ISO 8601 timestamp - auto-generated if not provided',
    example: '2024-01-15T10:30:00Z',
    default: new Date().toISOString(),
  })
  timestamp: string;
}

// Response DTO
export class NotificationDto extends createZodDto(CreateNotificationSchema) {
  @ApiProperty({ description: 'ID of the sender' })
  senderId: string;

  @ApiProperty({ description: 'ID of the receiver' })
  receiverId: string;

  @ApiProperty({ description: 'Notification payload' })
  payload: unknown;

  @ApiPropertyOptional({ description: 'Optional metadata' })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  timestamp: string;
}

export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type Notification = z.infer<typeof CreateNotificationSchema>;
export type IdedNotification = z.infer<typeof CreateNotificationSchema> & {
  notificationId: string;
};
