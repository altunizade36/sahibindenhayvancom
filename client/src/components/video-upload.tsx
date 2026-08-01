import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Video, Upload, X, Play, Loader2 } from "lucide-react";
import type { ListingVideo } from "@shared/schema";

interface VideoUploadProps {
  listingId: string;
  maxVideos?: number;
  onUploadComplete?: () => void;
}

export function VideoUpload({ listingId, maxVideos = 3, onUploadComplete }: VideoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: videos, isLoading } = useQuery<ListingVideo[]>({
    queryKey: ["/api/listing-videos", listingId],
    enabled: !!listingId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("listingId", listingId);

      const response = await fetch("/api/listing-videos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Video yüklenemedi");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listing-videos", listingId] });
      toast({
        title: "Video Yüklendi",
        description: "Video başarıyla yüklendi.",
      });
      setUploading(false);
      setUploadProgress(0);
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("DELETE", `/api/listing-videos/${videoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listing-videos", listingId] });
      toast({
        title: "Video Silindi",
        description: "Video başarıyla silindi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Geçersiz Dosya",
        description: "Lütfen MP4, WebM, MOV veya AVI formatında bir video seçin.",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB — Supabase ucretsiz plan dosya siniri
    if (file.size > maxSize) {
      toast({
        title: "Dosya Çok Büyük",
        description: "Video boyutu 50MB'ı geçemez.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    uploadMutation.mutate(file, {
      onSettled: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
      },
    });

    if (event.target) {
      event.target.value = "";
    }
  }, [uploadMutation, toast]);

  const currentVideoCount = videos?.length || 0;
  const canUploadMore = currentVideoCount < maxVideos;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <span className="font-medium">Videolar</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentVideoCount}/{maxVideos}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {videos && videos.length > 0 && (
              <div className="space-y-2">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="relative w-20 h-14 bg-black rounded overflow-hidden flex items-center justify-center">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <Play className="absolute w-6 h-6 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Video {video.order}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.size ? `${(video.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(video.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Video yükleniyor...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {canUploadMore && !uploading && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-video-file"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-video"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Video Yükle
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  MP4, WebM, MOV, AVI • Maks. 50MB
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface VideoGalleryProps {
  listingId: string;
}

export function VideoGallery({ listingId }: VideoGalleryProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const { data: videos, isLoading } = useQuery<ListingVideo[]>({
    queryKey: ["/api/listing-videos", listingId],
    enabled: !!listingId,
  });

  if (isLoading || !videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Videolar</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setActiveVideo(activeVideo === video.id ? null : video.id)}
            data-testid={`video-thumbnail-${video.id}`}
          >
            {activeVideo === video.id ? (
              <video
                src={video.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                data-testid={`video-player-${video.id}`}
              />
            ) : (
              <>
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary ml-0.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
