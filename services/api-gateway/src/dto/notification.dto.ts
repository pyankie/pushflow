import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const NotificationZodSchema = z.object({
  senderId: z.string().nonempty(),
  receiverId: z.string().nonempty(),
  payload: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string(),
});

export class NotificationDto extends createZodDto(NotificationZodSchema) {
  @ApiProperty()
  notificationId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  receiverId: string;

  @ApiProperty()
  payload: unknown;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  timestamp: string;
}

export type Notification = z.infer<typeof NotificationZodSchema>;
