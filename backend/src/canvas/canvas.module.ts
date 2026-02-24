import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { Canvas, Storyboard, Card } from './canvas.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Canvas, Storyboard, Card]),
    WorkspacesModule,
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
