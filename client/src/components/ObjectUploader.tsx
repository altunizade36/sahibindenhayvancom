import { useState, useRef } from "react";
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
    
    // Validate file sizes
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast({
          title: "Dosya çok büyük",
          description: `${file.name} boyutu ${Math.round(maxFileSize / 1024 / 1024)}MB'dan büyük`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        // Get upload URL from backend
        const response = await apiRequest("POST", "/api/objects/upload") as { uploadURL: string };
        const uploadURL = response.uploadURL;
        
        // Upload file to object storage
        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }
        
        // Extract object path from upload URL
        const url = new URL(uploadURL);
        const objectPath = url.pathname;
        uploadedUrls.push(objectPath);
      }
      
      const allUrls = [...uploadedFiles, ...uploadedUrls];
      setUploadedFiles(allUrls);
      onComplete?.(allUrls);
      
      toast({
        title: "Başarılı",
        description: `${files.length} dosya yüklendi`,
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
