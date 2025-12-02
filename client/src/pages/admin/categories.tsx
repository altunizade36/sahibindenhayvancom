import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  Search,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  sortOrder: number;
  listingCount?: number;
  children?: Category[];
}

interface CategoryStats {
  total: number;
  mainCategories: number;
  subCategories: number;
  totalListings: number;
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    icon: "",
  });

  const { data: categories = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ["/api/categories/tree"],
  });

  const flatCategories = categories.reduce<Category[]>((acc, cat) => {
    acc.push(cat);
    if (cat.children) {
      acc.push(...cat.children);
      cat.children.forEach((child) => {
        if (child.children) {
          acc.push(...child.children);
        }
      });
    }
    return acc;
  }, []);

  const stats: CategoryStats = {
    total: flatCategories.length,
    mainCategories: categories.length,
    subCategories: flatCategories.length - categories.length,
    totalListings: flatCategories.reduce((acc, cat) => acc + (cat.listingCount || 0), 0),
  };

  const filteredCategories = searchQuery
    ? flatCategories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  const handleOpenCreate = (parentId?: string) => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      parentId: parentId || "",
      icon: "",
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parentId: category.parentId || "",
      icon: category.icon || "",
    });
    setEditCategory(category);
  };

  const handleSlugify = (name: string) => {
    const turkishChars: Record<string, string> = {
      ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
      Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
    };
    return name
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => turkishChars[char] || char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const renderCategoryTree = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <AccordionItem key={category.id} value={category.id} className="border-0">
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-accent/50 rounded-lg group"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren ? (
            <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>svg]:rotate-90">
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
            </AccordionTrigger>
          ) : (
            <div className="w-4" />
          )}
          
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="flex-1 font-medium text-sm">{category.name}</span>

          <Badge variant="outline" className="text-xs">
            {category.listingCount || 0} ilan
          </Badge>

          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCreate(category.id);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(category);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteCategory(category);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {hasChildren && (
          <AccordionContent className="pb-0">
            {category.children!.map((child) => renderCategoryTree(child, level + 1))}
          </AccordionContent>
        )}
      </AccordionItem>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-categories">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Kategori Yönetimi</h1>
            <p className="text-muted-foreground">
              Hayvan kategorilerini düzenleyin ve yönetin
            </p>
          </div>
          <Button onClick={() => handleOpenCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kategori
          </Button>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam Kategori"
            value={stats.total}
            icon={<FolderTree className="h-4 w-4" />}
          />
          <StatCard
            title="Ana Kategori"
            value={stats.mainCategories}
            icon={<Folder className="h-4 w-4" />}
          />
          <StatCard
            title="Alt Kategori"
            value={stats.subCategories}
            icon={<FolderOpen className="h-4 w-4" />}
          />
          <StatCard
            title="Toplam İlan"
            value={stats.totalListings}
            icon={<FileText className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Kategori Ağacı</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kategori ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : searchQuery ? (
              <div className="space-y-2">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
                  >
                    <Folder className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">/{cat.slug}</p>
                    </div>
                    <Badge variant="outline">{cat.listingCount || 0} ilan</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Kategori bulunamadı
                  </p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Accordion type="multiple" className="w-full">
                  {categories.map((cat) => renderCategoryTree(cat))}
                </Accordion>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen || !!editCategory} onOpenChange={() => {
        setIsCreateOpen(false);
        setEditCategory(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Kategoriyi Düzenle" : "Yeni Kategori"}
            </DialogTitle>
            <DialogDescription>
              Kategori bilgilerini girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Kategori Adı</label>
              <Input
                placeholder="Örn: Köpekler"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: handleSlugify(e.target.value),
                  });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Slug (URL)</label>
              <Input
                placeholder="kopekler"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Üst Kategori</label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ana kategori (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ana Kategori</SelectItem>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Açıklama</label>
              <Textarea
                placeholder="Kategori açıklaması..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditCategory(null);
              }}
            >
              İptal
            </Button>
            <Button
              onClick={() => {
                toast({ title: "Bu özellik yakında eklenecek" });
                setIsCreateOpen(false);
                setEditCategory(null);
              }}
            >
              {editCategory ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteCategory?.name}" kategorisini silmek istediğinizden emin misiniz?
              {deleteCategory?.listingCount && deleteCategory.listingCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Bu kategoride {deleteCategory.listingCount} ilan bulunmaktadır!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast({ title: "Bu özellik yakında eklenecek" });
                setDeleteCategory(null);
              }}
              className="bg-destructive"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
