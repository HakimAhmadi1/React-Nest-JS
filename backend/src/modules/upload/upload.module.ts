import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';

// multer's disk storage does not create its destination.
mkdirSync(UploadService.uploadDir, { recursive: true });

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
