import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs, existsSync } from 'fs';

@Injectable()
export class UploadService {
  /** Absolute path to the uploads folder (used by multer's disk storage). */
  static get uploadDir(): string {
    return join(process.cwd(), 'uploads');
  }

  /** Public URL for an uploaded file. Swap for an S3/CDN URL in production. */
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  async listFiles() {
    const dir = UploadService.uploadDir;
    if (!existsSync(dir)) return [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          try {
            const stats = await fs.stat(join(dir, entry.name));
            return {
              filename: entry.name,
              url: this.getFileUrl(entry.name),
              size: stats.size,
              mtime: stats.mtime,
            };
          } catch {
            return null;
          }
        }),
    );

    return files.filter((file): file is NonNullable<typeof file> => file !== null);
  }
}
