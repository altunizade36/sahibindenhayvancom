import sharp from 'sharp';
import { objectStorage } from './objectStorage';
import { randomUUID } from 'crypto';

export interface ProcessedImage {
  originalKey: string;
  originalUrl: string;
  thumbnailKey: string;
  thumbnailUrl: string;
  mediumKey: string;
  mediumUrl: string;
  largeKey: string;
  largeUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

interface ImageVariant {
  suffix: string;
  width: number;
  height: number;
  quality: number;
}

const IMAGE_VARIANTS: ImageVariant[] = [
  { suffix: 'thumb', width: 400, height: 400, quality: 90 },
  { suffix: 'medium', width: 1200, height: 1200, quality: 92 },
  { suffix: 'large', width: 2000, height: 2000, quality: 95 },
];

export async function processAndUploadImage(
  buffer: Buffer,
  originalFilename: string,
  listingId?: string
): Promise<ProcessedImage> {
  const uuid = randomUUID();
  const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const baseName = cleanFilename.replace(/\.[^/.]+$/, '');
  const prefix = listingId ? `listings/${listingId}` : 'images';
  
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  
  const originalBuffer = await sharp(buffer)
    .rotate()
    .webp({ quality: 90 })
    .toBuffer();
  
  const originalObjectName = `${prefix}/${uuid}_${baseName}_original.webp`;
  await objectStorage.uploadBufferAt(originalObjectName, originalBuffer, 'image/webp');

  const results: Record<string, { key: string; url: string }> = {};
  
  for (const variant of IMAGE_VARIANTS) {
    const variantBuffer = await sharp(buffer)
      .rotate()
      .resize(variant.width, variant.height, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 0.5 })
      .webp({ quality: variant.quality, effort: 6 })
      .toBuffer();
    
    const variantObjectName = `${prefix}/${uuid}_${baseName}_${variant.suffix}.webp`;
    await objectStorage.uploadBufferAt(variantObjectName, variantBuffer, 'image/webp');

    results[variant.suffix] = {
      key: `/objects/${variantObjectName}`,
      url: `/objects/${variantObjectName}`,
    };
  }
  
  return {
    originalKey: `/objects/${originalObjectName}`,
    originalUrl: `/objects/${originalObjectName}`,
    thumbnailKey: results.thumb.key,
    thumbnailUrl: results.thumb.url,
    mediumKey: results.medium.key,
    mediumUrl: results.medium.url,
    largeKey: results.large.key,
    largeUrl: results.large.url,
    width: originalWidth,
    height: originalHeight,
    fileSize: originalBuffer.length,
    mimeType: 'image/webp',
  };
}

export async function deleteImageVariants(keys: string[]): Promise<void> {
  await objectStorage.deleteMultipleFiles(keys);
}

export function validateImageFile(
  file: Express.Multer.File
): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024;
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Sadece JPEG, PNG, WebP ve GIF formatları desteklenmektedir.',
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Dosya boyutu 10MB\'dan büyük olamaz.',
    };
  }
  
  return { valid: true };
}

export interface StoreImageResult {
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  width: number;
  height: number;
  fileSize: number;
}

interface StoreImageConfig {
  type: 'logo' | 'banner';
  storeId: string;
}

const STORE_IMAGE_VARIANTS = {
  logo: [
    { suffix: 'thumb', width: 100, height: 100, quality: 92 },
    { suffix: 'medium', width: 300, height: 300, quality: 94 },
    { suffix: 'original', width: 500, height: 500, quality: 96 },
  ],
  banner: [
    { suffix: 'thumb', width: 600, height: 200, quality: 90 },
    { suffix: 'medium', width: 1200, height: 400, quality: 92 },
    { suffix: 'original', width: 1920, height: 640, quality: 95 },
  ],
};

export async function processStoreImage(
  buffer: Buffer,
  config: StoreImageConfig
): Promise<StoreImageResult> {
  const uuid = randomUUID();
  const prefix = `stores/${config.storeId}`;
  const variants = STORE_IMAGE_VARIANTS[config.type];
  
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  
  const results: Record<string, string> = {};
  let finalFileSize = 0;
  
  for (const variant of variants) {
    const resizeOptions = config.type === 'logo' 
      ? { width: variant.width, height: variant.height, fit: 'cover' as const }
      : { width: variant.width, height: variant.height, fit: 'cover' as const };
    
    const variantBuffer = await sharp(buffer)
      .rotate()
      .resize(resizeOptions.width, resizeOptions.height, {
        fit: resizeOptions.fit,
        position: 'center',
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 0.5 })
      .webp({ quality: variant.quality, effort: 6 })
      .toBuffer();
    
    if (variant.suffix === 'original') {
      finalFileSize = variantBuffer.length;
    }
    
    const objectName = `${prefix}/${config.type}_${uuid}_${variant.suffix}.webp`;
    await objectStorage.uploadBufferAt(objectName, variantBuffer, 'image/webp');

    results[variant.suffix] = `/objects/${objectName}`;
  }
  
  return {
    originalUrl: results.original,
    thumbnailUrl: results.thumb,
    mediumUrl: results.medium,
    width: originalWidth,
    height: originalHeight,
    fileSize: finalFileSize,
  };
}
