import { BadRequestException } from '@nestjs/common';

/**
 * SVG is deliberately absent.
 *
 * `/uploads` is served statically from the API's own origin, so an uploaded
 * SVG — which can carry inline <script> — would be stored XSS against this
 * application.
 */
const ALLOWED_IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp|avif)$/;
const ALLOWED_VIDEO_MIME = /^video\/(mp4|mpeg|quicktime|x-msvideo|webm)$/;

/** Leading bytes, since the client-supplied MIME type is not evidence. */
const IMAGE_SIGNATURES: { magic: number[]; mask?: number[] }[] = [
  { magic: [0xff, 0xd8, 0xff] }, // JPEG
  { magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  { magic: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  // RIFF....WEBP — bytes 4-7 are the length, so they are masked out.
  {
    magic: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
    mask: [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
  },
];

export const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
    return cb(
      new BadRequestException(
        'Only image files are allowed (jpg, png, gif, webp, avif).',
      ),
      false,
    );
  }
  cb(null, true);
};

export const videoFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_VIDEO_MIME.test(file.mimetype)) {
    return cb(
      new BadRequestException(
        'Only video files are allowed (mp4, mpeg, webm, mov, avi).',
      ),
      false,
    );
  }
  cb(null, true);
};

/** Throws unless the buffer actually starts with a known image signature. */
export function assertIsImage(buffer: Buffer): void {
  const matches = IMAGE_SIGNATURES.some(({ magic, mask }) => {
    if (buffer.length < magic.length) return false;
    return magic.every((byte, index) => mask?.[index] === 0 || buffer[index] === byte);
  });

  if (!matches) {
    throw new BadRequestException('File content is not a recognised image.');
  }
}
