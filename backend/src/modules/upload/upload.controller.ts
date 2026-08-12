import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { UserRole } from '@common/constants/roles.config';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';
import { assertIsImage, imageFileFilter, videoFileFilter } from './file-validation';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const storage = diskStorage({
  destination: UploadService.uploadDir,
  // `randomUUID` from node:crypto — drops the `uuid` dependency.
  filename: (_req, file, cb) =>
    cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
});

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Returns { url }' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');

    // The declared MIME type came from the client; verify the actual bytes.
    assertIsImage(await readFile(join(UploadService.uploadDir, file.filename)));

    return {
      url: this.uploadService.getFileUrl(file.filename),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('cloudinary/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async uploadImageCloudinary(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    assertIsImage(file.buffer);

    const result = await this.cloudinaryService.uploadImage(file);
    return {
      url: result.secure_url,
      public_id: result.public_id,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('cloudinary/video')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: videoFileFilter,
      limits: { fileSize: MAX_VIDEO_BYTES },
    }),
  )
  async uploadVideoCloudinary(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    const result = await this.cloudinaryService.uploadVideo(file);
    return {
      url: result.secure_url,
      public_id: result.public_id,
      originalName: file.originalname,
      size: file.size,
    };
  }

  // Was @Public(): this enumerated every uploaded filename to anonymous callers.
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @RequirePermissions('upload.view')
  @ApiResponse({ status: 200, description: 'Lists uploaded files' })
  async listFiles() {
    return this.uploadService.listFiles();
  }
}
