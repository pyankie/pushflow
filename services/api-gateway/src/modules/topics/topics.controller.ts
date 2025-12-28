import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiProperty,
} from '@nestjs/swagger'
import { TopicsService } from './topics.service'
import { IsNotEmpty, IsString } from 'class-validator'

class SubscribeDto {
    @ApiProperty({ description: 'ID of the receiver', example: 'user-123' })
    @IsString()
    @IsNotEmpty()
    receiverId: string

    @ApiProperty({
        description: 'ID of the topic to subscribe',
        example: 'alerts',
    })
    @IsString()
    @IsNotEmpty()
    topicId: string
}

class UnsubscribeDto {
    @ApiProperty({ description: 'ID of the receiver', example: 'user-123' })
    @IsString()
    @IsNotEmpty()
    receiverId: string

    @ApiProperty({
        description: 'ID of the topic to unsubscribe',
        example: 'alerts',
    })
    @IsString()
    @IsNotEmpty()
    topicId: string
}

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) {}

    @ApiOperation({ summary: 'Subscribe a receiver to a topic' })
    @ApiBody({ type: SubscribeDto })
    @ApiResponse({ status: HttpStatus.ACCEPTED })
    @Post('subscribe')
    @HttpCode(HttpStatus.ACCEPTED)
    async subscribe(@Body() body: SubscribeDto) {
        await this.topicsService.subscribe(body.receiverId, body.topicId)
        return { status: 'ACCEPTED' }
    }

    @ApiOperation({ summary: 'Unsubscribe a receiver from a topic' })
    @ApiBody({ type: UnsubscribeDto })
    @ApiResponse({ status: HttpStatus.ACCEPTED })
    @Post('unsubscribe')
    @HttpCode(HttpStatus.ACCEPTED)
    async unsubscribe(@Body() body: UnsubscribeDto) {
        await this.topicsService.unsubscribe(body.receiverId, body.topicId)
        return { status: 'ACCEPTED' }
    }
}
