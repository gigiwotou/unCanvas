import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { ModelConfig } from './model-config.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModelConfig]), CommonModule],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule implements OnModuleInit {
  constructor(private readonly modelsService: ModelsService) {}

  async onModuleInit() {
    const configs = await this.modelsService.findAllConfigs();
    for (const config of configs) {
      try {
        await this.modelsService.initializeAdapter(config);
      } catch (e) {
        console.warn(`Failed to initialize adapter ${config.id}:`, e);
      }
    }
  }
}
