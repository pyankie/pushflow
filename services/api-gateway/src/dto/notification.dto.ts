import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

enum Status {
  ACCEPTED = "accepted",
  SENT = "sent",
  FAILED = "failed",
  PENDING = "pending",
}

export const CreateNotificationSchema = z
  .object({
    senderId: z.string().min(1, "senderId is required"),
    receiverId: z.string().min(1).optional(),
    topicId: z.string().min(1).optional(),
    payload: z.unknown(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    timestamp: z
      .string()
      .datetime()
      .default(() => new Date().toISOString()),
  })
  .refine((data) => data.receiverId || data.topicId, {
    message: "Either receiverId or topicId must be provided",
    path: ["receiverId"],
  });

export class CreateNotificationDto extends createZodDto(
  CreateNotificationSchema
) {
  @ApiProperty({ description: "ID of the sender", example: "user-123" })
  senderId: string;

  @ApiPropertyOptional({
    description: "ID of the receiver",
    example: "user-456",
  })
  receiverId?: string;

  @ApiPropertyOptional({
    description: "Optional topic id for multicast",
    example: "topic-123",
  })
  topicId?: string;

  @ApiProperty({
    description: "Notification payload - can be any type",
    example: { message: "Hello", type: "info" },
  })
  payload: unknown;

  @ApiPropertyOptional({
    description: "Optional metadata for the notification",
    example: { source: "web", priority: "high" },
  })
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: "ISO 8601 timestamp - auto-generated if not provided",
    example: "2024-01-15T10:30:00Z",
    default: new Date().toISOString(),
  })
  timestamp: string;
}

export class NotificationCreationResponseDto {
  @ApiProperty({
    description: "Unique identifier for the notification",
    example: "31aaf24f-bccb-4419-b0ee-47c72963b985",
  })
  @IsString()
  notificationId: string;

  @ApiProperty({
    description: "ISO 8601 timestamp when the notification was created",
    example: "2024-01-15T10:30:00Z",
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: "Current status of the notification",
    example: Status.ACCEPTED,
    enum: Status,
  })
  @IsEnum(Status)
  status: Status;
}

export class NotificationStatusResponseDto {
  @ApiProperty({
    description: "Unique identifier for the notification",
    example: "31aaf24f-bccb-4419-b0ee-47c72963b985",
  })
  @IsString()
  notificationId: string;

  @ApiProperty({
    description: "Current status of the notification",
    example: "pending",
    enum: ["pending", "delivered", "failed"],
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: "ISO 8601 timestamp of the notification",
    example: "2024-01-15T10:30:00Z",
  })
  @IsString()
  timestamp: string;
}

export type Notification = z.infer<typeof CreateNotificationSchema>;
export type IdedNotification = z.infer<typeof CreateNotificationSchema> & {
  notificationId: string;
};
