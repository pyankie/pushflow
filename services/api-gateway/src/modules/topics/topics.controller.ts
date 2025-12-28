import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TopicsService } from './topics.service'

class SubscribeDto {
    receiverId: string
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
}
