import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/admin/admin-layout";
import { DataTable, Column } from "@/components/admin/data-table";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  published: boolean;
  views: number;
  readTime: number;
  categoryTags: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

interface BlogStats {
  total: number;
  published: number;
  draft: number;
  totalViews: number;
}

const blogFormSchema = z.object({
  title: z.string().min(10, "Başlık en az 10 karakter olmalı"),
  slug: z.string().min(5, "Slug en az 5 karakter olmalı"),
  excerpt: z.string().min(50, "Özet en az 50 karakter olmalı").optional().or(z.literal("")),
  content: z.string().min(100, "İçerik en az 100 karakter olmalı"),
  categoryTagsString: z.string(),
  readTime: z.number().min(1, "Okuma süresi en az 1 dakika olmalı"),
  published: z.boolean().default(true),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<BlogPost | null>(null);
  const [deleteBlog, setDeleteBlog] = useState<BlogPost | null>(null);

  const { data: blogs = [], isLoading, refetch } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog"],
  });

  const stats: BlogStats = {
    total: blogs.length,
    published: blogs.filter((b) => b.published).length,
    draft: blogs.filter((b) => !b.published).length,
    totalViews: blogs.reduce((acc, b) => acc + (b.views || 0), 0),
  };

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      categoryTagsString: "",
      readTime: 5,
      published: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/blog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı oluşturuldu" });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/admin/blog/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı güncellendi" });
      setEditBlog(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/blog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı silindi" });
      setDeleteBlog(null);
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    form.reset({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      categoryTagsString: "",
      readTime: 5,
      published: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    form.reset({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: "",
      categoryTagsString: blog.categoryTags.join(", "),
      readTime: blog.readTime,
      published: blog.published,
    });
    setEditBlog(blog);
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

  const onSubmit = (data: BlogFormValues) => {
    const submitData = {
      ...data,
      categoryTags: data.categoryTagsString.split(",").map((s) => s.trim()).filter(Boolean),
    };

    if (editBlog) {
      updateMutation.mutate({ id: editBlog.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      header: "Başlık",
      cell: (blog) => (
        <div>
          <p className="font-medium">{blog.title}</p>
          <p className="text-sm text-muted-foreground">/{blog.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      cell: (blog) =>
        blog.published ? (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Yayında
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Taslak
          </Badge>
        ),
    },
    {
      key: "stats",
      header: "İstatistik",
      cell: (blog) => (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {blog.views}
          </span>
          <span>{blog.readTime} dk</span>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Etiketler",
      cell: (blog) => (
        <div className="flex flex-wrap gap-1">
          {blog.categoryTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {blog.categoryTags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{blog.categoryTags.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Tarih",
      cell: (blog) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(blog.createdAt), "dd MMM yyyy", { locale: tr })}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-blog">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Blog Yönetimi</h1>
            <p className="text-muted-foreground">
              Blog yazılarını oluşturun ve yönetin
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Yazı
          </Button>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam Yazı"
            value={stats.total}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <StatCard
            title="Yayında"
            value={stats.published}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Taslak"
            value={stats.draft}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Toplam Görüntülenme"
            value={stats.totalViews}
            icon={<Eye className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Blog Yazıları</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={blogs}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Yazı ara..."
              searchKey="title"
              onRefresh={refetch}
              getItemId={(b) => b.id}
              actions={[
                {
                  label: "Görüntüle",
                  icon: <ExternalLink className="h-4 w-4" />,
                  onClick: (blog) => window.open(`/blog/${blog.slug}`, "_blank"),
                },
                {
                  label: "Düzenle",
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: (blog) => handleOpenEdit(blog),
                },
                {
                  label: "Sil",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: (blog) => setDeleteBlog(blog),
                  variant: "destructive",
                },
              ]}
              emptyMessage="Blog yazısı bulunamadı"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isCreateOpen || !!editBlog}
        onOpenChange={() => {
          setIsCreateOpen(false);
          setEditBlog(null);
          form.reset();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editBlog ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
            </DialogTitle>
            <DialogDescription>
              Blog yazısı detaylarını girin. Markdown formatı desteklenir.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Örn: Köpeklerde Aşı Takvimi"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!editBlog) {
                            form.setValue("slug", handleSlugify(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="kopeklerde-asi-takvimi" {...field} />
                    </FormControl>
                    <FormDescription>Sadece küçük harf, rakam ve tire</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Özet</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Blog yazısının kısa özeti..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İçerik (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="# Blog İçeriği&#10;&#10;Markdown formatında yazın..."
                        className="font-mono text-sm min-h-[200px]"
                        rows={12}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Markdown formatı desteklenir</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryTagsString"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiketler</FormLabel>
                      <FormControl>
                        <Input placeholder="köpek, sağlık, aşı" {...field} />
                      </FormControl>
                      <FormDescription>Virgülle ayırın</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Okuma Süresi (dk)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Yayınla</FormLabel>
                      <FormDescription>Yazıyı hemen yayınla</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditBlog(null);
                    form.reset();
                  }}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editBlog ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBlog} onOpenChange={() => setDeleteBlog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog Yazısını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteBlog?.title}" yazısını silmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBlog && deleteMutation.mutate(deleteBlog.id)}
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
