import { useState, useRef, useCallback } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (uploadedUrls: string[]) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  children?: ReactNode;
  existingImages?: string[];
  onRemove?: (url: string) => void;
}

export function ObjectUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  buttonVariant = "outline",
  children,
  existingImages = [],
  onRemove,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Otomatik fotoğraf optimize etme fonksiyonu
  const optimizeImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Maksimum boyutlar (orantılı küçültme)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        let { width, height } = img;
        
        // Orantılı küçültme
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Canvas context error'));
          return;
        }
        
        // Beyaz arka plan (şeffaf PNG'ler için)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Yüksek kaliteli yeniden boyutlandırma
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG olarak sıkıştır (kalite: 0.85)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Blob oluşturulamadı'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => reject(new Error('Fotoğraf yüklenemedi'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (uploadedFiles.length + files.length > maxNumberOfFiles) {
      toast({
        title: "Çok fazla dosya",
        description: `En fazla ${maxNumberOfFiles} dosya yükleyebilirsiniz`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        // Sadece resim dosyalarını kabul et
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Hata",
            description: `${file.name} bir resim dosyası değil`,
            variant: "destructive",
          });
          continue;
        }

        // Fotoğrafı otomatik optimize et (boyut ve kalite)
        let optimizedFile: Blob;
        try {
          optimizedFile = await optimizeImage(file);
        } catch (err) {
          console.error('Image optimization error:', err);
          toast({
            title: "Hata",
            description: `${file.name} optimize edilemedi`,
            variant: "destructive",
          });
          continue;
        }

        // Get upload URL from backend
        const response = await apiRequest("POST", "/api/objects/upload") as unknown as { uploadURL: string; normalizedPath: string };
        const { uploadURL, normalizedPath } = response;
        
        // Upload optimized file to object storage
        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: optimizedFile,
          headers: {
            "Content-Type": "image/jpeg",
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }
        
        // Use normalized path for displaying the image
        uploadedUrls.push(normalizedPath);
      }
      
      const allUrls = [...uploadedFiles, ...uploadedUrls];
      setUploadedFiles(allUrls);
      onComplete?.(allUrls);
      
      toast({
        title: "Başarılı",
        description: `${uploadedUrls.length} dosya yüklendi`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Yükleme hatası",
        description: "Dosyalar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (url: string) => {
    const newFiles = uploadedFiles.filter((f) => f !== url);
    setUploadedFiles(newFiles);
    onRemove?.(url);
    onComplete?.(newFiles);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      <Button 
        type="button"
        variant={buttonVariant}
        onClick={() => fileInputRef.current?.click()} 
        className={buttonClassName}
        disabled={uploading || uploadedFiles.length >= maxNumberOfFiles}
        data-testid="button-upload-images"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          children || (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Fotoğraf Yükle
            </>
          )
        )}
      </Button>
      
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-remove-image-${index}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
