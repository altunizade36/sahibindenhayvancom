import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ImagePlus, 
  Loader2, 
  X, 
  Star, 
  GripVertical,
  Upload,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingImage {
  id: string;
  listingId: string | null;
  originalUrl: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  displayOrder: number;
  isCover: boolean;
  status: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  previewUrl?: string;
}

interface ListingImageUploaderProps {
  listingId?: string;
  maxImages?: number;
  onImagesChange?: (images: ListingImage[]) => void;
  existingImageUrls?: string[];
}

export function ListingImageUploader({
  listingId,
  maxImages = 10,
  onImagesChange,
  existingImageUrls = [],
}: ListingImageUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const { data: images = [] } = useQuery<ListingImage[]>({
    queryKey: ['/api/listing-images', listingId],
    enabled: !!listingId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      if (listingId) {
        formData.append('listingId', listingId);
      }

      const response = await fetch('/api/listing-images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Yükleme başarısız');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadQueue([]);
      if (listingId) {
        queryClient.invalidateQueries({ queryKey: ['/api/listing-images', listingId] });
      }
      onImagesChange?.(data.images);
      toast({
        title: "Başarılı",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Yükleme Hatası",
        description: error.message,
        variant: "destructive",
      });
      setUploadQueue(prev => prev.map(item => ({
        ...item,
        status: 'error' as const,
        error: error.message,
      })));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/listing-images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Silme başarısız');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-images', listingId] });
      toast({
        title: "Silindi",
        description: "Görsel başarıyla silindi.",
      });
    },
  });

  const setCoverMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/listing-images/${imageId}/cover`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Kapak ayarlama başarısız');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-images', listingId] });
      toast({
        title: "Kapak Görseli",
        description: "Kapak görseli güncellendi.",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const response = await fetch('/api/listing-images/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId, imageIds }),
      });
      if (!response.ok) {
        throw new Error('Sıralama başarısız');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-images', listingId] });
    },
  });

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = images.length + uploadQueue.length;
    
    if (currentCount + fileArray.length > maxImages) {
      toast({
        title: "Limit Aşıldı",
        description: `En fazla ${maxImages} görsel yükleyebilirsiniz.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const newQueue: UploadProgress[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Geçersiz Dosya",
          description: `${file.name} bir görsel dosyası değil.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Dosya Çok Büyük",
          description: `${file.name} 10MB'dan büyük olamaz.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
      newQueue.push({
        file,
        progress: 0,
        status: 'pending',
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setUploadQueue(prev => [...prev, ...newQueue]);
      
      setTimeout(() => {
        setUploadQueue(prev => prev.map(item => ({
          ...item,
          status: 'uploading' as const,
          progress: 30,
        })));
      }, 100);

      setTimeout(() => {
        setUploadQueue(prev => prev.map(item => ({
          ...item,
          status: 'processing' as const,
          progress: 70,
        })));
      }, 500);

      uploadMutation.mutate(validFiles);
    }
  }, [images.length, uploadQueue.length, maxImages, toast, uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleImageDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedImageId || draggedImageId === targetId) return;
  };

  const handleImageDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedImageId || draggedImageId === targetId) return;

    const newOrder = [...images];
    const draggedIndex = newOrder.findIndex(img => img.id === draggedImageId);
    const targetIndex = newOrder.findIndex(img => img.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      
      reorderMutation.mutate(newOrder.map(img => img.id));
    }
    
    setDraggedImageId(null);
  };

  const totalImages = images.length + uploadQueue.length + existingImageUrls.length;
  const canUploadMore = totalImages < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalImages} / {maxImages} görsel
        </div>
        {canUploadMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-add-more-images"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Görsel Ekle
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        data-testid="input-image-upload"
      />

      {totalImages === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center w-full p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            isDragging 
              ? "border-primary bg-primary/10" 
              : "border-muted-foreground/30 hover:border-primary/50 bg-muted/30"
          )}
          data-testid="dropzone-images"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
              <span className="text-lg font-medium">Yükleniyor...</span>
              <span className="text-sm text-muted-foreground mt-1">Görseller işleniyor</span>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <span className="text-lg font-medium">Görsel Yükle</span>
              <span className="text-sm text-muted-foreground mt-1">
                Sürükleyip bırakın veya tıklayın
              </span>
              <span className="text-xs text-muted-foreground mt-3">
                JPG, PNG, WebP - En fazla {maxImages} görsel, her biri max 10MB
              </span>
            </>
          )}
        </div>
      )}

      {(images.length > 0 || uploadQueue.length > 0 || existingImageUrls.length > 0) && (
        <div 
          className={cn(
            "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3",
            isDragging && "ring-2 ring-primary ring-offset-2 rounded-lg"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleImageDragStart(e, image.id)}
              onDragOver={(e) => handleImageDragOver(e, image.id)}
              onDrop={(e) => handleImageDrop(e, image.id)}
              className={cn(
                "group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move",
                image.isCover ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/50",
                draggedImageId === image.id && "opacity-50"
              )}
              data-testid={`image-item-${image.id}`}
            >
              <img
                src={image.thumbnailUrl || image.originalUrl}
                alt={`Görsel ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
              </div>

              {image.isCover && (
                <div className="absolute top-1 right-1">
                  <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Kapak
                  </div>
                </div>
              )}

              <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                {!image.isCover && listingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCoverMutation.mutate(image.id);
                    }}
                    disabled={setCoverMutation.isPending}
                    data-testid={`button-set-cover-${image.id}`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Kapak Yap
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(image.id);
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-image-${image.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {existingImageUrls.map((url, index) => (
            <div
              key={`existing-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent"
            >
              <img
                src={url}
                alt={`Mevcut görsel ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}

          {uploadQueue.map((item, index) => (
            <div
              key={`upload-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/30 bg-muted"
            >
              {item.previewUrl && (
                <img
                  src={item.previewUrl}
                  alt="Yükleniyor..."
                  className="w-full h-full object-cover opacity-50"
                />
              )}
              
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                {item.status === 'error' ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                    <span className="text-xs text-white text-center px-2">{item.error}</span>
                  </>
                ) : item.status === 'complete' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <span className="text-xs text-white">
                      {item.status === 'uploading' ? 'Yükleniyor...' : 'İşleniyor...'}
                    </span>
                  </>
                )}
              </div>

              {item.status !== 'error' && item.status !== 'complete' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}

          {canUploadMore && images.length > 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/30 hover:border-primary/50 bg-muted/30"
              )}
              data-testid="button-add-image-grid"
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Ekle</span>
            </div>
          )}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Sıralamayı değiştirmek için görselleri sürükleyin. İlk görsel kapak olarak kullanılır.
        </p>
      )}
    </div>
  );
}
