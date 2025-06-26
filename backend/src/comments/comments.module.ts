import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { ReactionsService } from 'src/reactions/reactions.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, ReactionsService],
})
export class CommentsModule {}
