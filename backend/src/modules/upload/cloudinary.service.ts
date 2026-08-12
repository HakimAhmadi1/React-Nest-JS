import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'node:stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return this.upload(file, {
      folder: 'app/images',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
  }

  uploadVideo(file: Express.Multer.File): Promise<UploadApiResponse> {
    return this.upload(file, {
      folder: 'app/videos',
      resource_type: 'video',
      chunk_size: 6_000_000,
    });
  }

  private upload(
    file: Express.Multer.File,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    if (!this.config.get('CLOUDINARY_CLOUD_NAME')) {
      throw new InternalServerErrorException('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        options,
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException('Upload to Cloudinary failed'),
            );
          }
          resolve(result);
        },
      );

      // `Readable.from` replaces the unmaintained `buffer-to-stream` package.
      Readable.from(file.buffer).pipe(upload);
    });
  }
}
