import sharp from 'sharp';
import { objectStorageClient, ObjectStorageService } from './objectStorage';
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
  { suffix: 'thumb', width: 320, height: 320, quality: 80 },
  { suffix: 'medium', width: 800, height: 800, quality: 85 },
  { suffix: 'large', width: 1600, height: 1600, quality: 90 },
];

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  return {
    bucketName: pathParts[1],
    objectName: pathParts.slice(2).join("/"),
  };
}

export async function processAndUploadImage(
  buffer: Buffer,
  originalFilename: string,
  listingId?: string
): Promise<ProcessedImage> {
  const objectStorage = new ObjectStorageService();
  const privateDir = objectStorage.getPrivateObjectDir();
  
  const timestamp = Date.now();
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
  const originalFullPath = `${privateDir}/${originalObjectName}`;
  const { bucketName, objectName: originalObjName } = parseObjectPath(originalFullPath);
  
  const bucket = objectStorageClient.bucket(bucketName);
  const originalFile = bucket.file(originalObjName);
  await originalFile.save(originalBuffer, {
    contentType: 'image/webp',
    metadata: { contentType: 'image/webp' },
  });
  
  const results: Record<string, { key: string; url: string }> = {};
  
  for (const variant of IMAGE_VARIANTS) {
    const variantBuffer = await sharp(buffer)
      .rotate()
      .resize(variant.width, variant.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: variant.quality })
      .toBuffer();
    
    const variantObjectName = `${prefix}/${uuid}_${baseName}_${variant.suffix}.webp`;
    const variantFullPath = `${privateDir}/${variantObjectName}`;
    const { objectName: variantObjName } = parseObjectPath(variantFullPath);
    
    const variantFile = bucket.file(variantObjName);
    await variantFile.save(variantBuffer, {
      contentType: 'image/webp',
      metadata: { contentType: 'image/webp' },
    });
    
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
  const objectStorage = new ObjectStorageService();
  const privateDir = objectStorage.getPrivateObjectDir();
  
  for (const key of keys) {
    try {
      const objectName = key.replace('/objects/', '');
      const fullPath = `${privateDir}/${objectName}`;
      const { bucketName, objectName: objName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objName);
      await file.delete();
    } catch (error) {
      console.error(`Error deleting image ${key}:`, error);
    }
  }
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
