import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Share2, Copy, Check } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SocialShareProps {
  listingId: string;
  title: string;
  url?: string;
  compact?: boolean;
}

export function SocialShare({ listingId, title, url, compact = false }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = url || `${window.location.origin}/ilan/${listingId}`;
  const shareText = `${title} - Sahibinden Hayvan`;
  
  const trackShare = async () => {
    try {
      await apiRequest("POST", `/api/listings/${listingId}/share`);
    } catch (error) {
      console.error("Failed to track share:", error);
    }
  };
  
  const handleWhatsAppShare = () => {
    trackShare();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };
  
  const handleFacebookShare = () => {
    trackShare();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };
  
  const handleTwitterShare = () => {
    trackShare();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare();
      toast({
        title: "Link kopyalandı",
        description: "İlan linki panoya kopyalandı",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Link kopyalanamadı",
        variant: "destructive",
      });
    }
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
        trackShare();
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    }
  };
  
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="button-share-compact">
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleWhatsAppShare} data-testid="button-share-whatsapp">
            <SiWhatsapp className="mr-2 h-4 w-4 text-green-500" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFacebookShare} data-testid="button-share-facebook">
            <SiFacebook className="mr-2 h-4 w-4 text-blue-600" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTwitterShare} data-testid="button-share-twitter">
            <SiX className="mr-2 h-4 w-4" />
            X (Twitter)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} data-testid="button-share-copy">
            {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
            Link Kopyala
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="bg-green-50 hover:bg-green-100 border-green-200"
        data-testid="button-share-whatsapp"
      >
        <SiWhatsapp className="mr-2 h-4 w-4 text-green-600" />
        WhatsApp
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
        data-testid="button-share-facebook"
      >
        <SiFacebook className="mr-2 h-4 w-4 text-blue-600" />
        Facebook
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="bg-gray-50 hover:bg-gray-100 border-gray-200"
        data-testid="button-share-twitter"
      >
        <SiX className="mr-2 h-4 w-4" />
        X
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        data-testid="button-share-copy"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Kopyalandi
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Kopyala
          </>
        )}
      </Button>
      
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          data-testid="button-share-native"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Diger
        </Button>
      )}
    </div>
  );
}
