import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  views: number;
  readTime: number;
  categoryTags: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

const blogFormSchema = z.object({
  title: z.string().min(10, "Başlık en az 10 karakter olmalı"),
  slug: z.string().min(5, "Slug en az 5 karakter olmalı").regex(/^[a-z0-9-]+$/, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  excerpt: z.string().min(50, "Özet en az 50 karakter olmalı").optional(),
  content: z.string().min(100, "İçerik en az 100 karakter olmalı"),
  categoryTagsString: z.string(),
  readTime: z.number().min(1, "Okuma süresi en az 1 dakika olmalı"),
  published: z.boolean().default(true),
  featuredImage: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormSubmitData extends Omit<BlogFormValues, 'categoryTagsString'> {
  categoryTags: string[];
}

export default function AdminBlog() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<BlogPost | null>(null);

  const { data: blogs = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog"],
  });

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
      featuredImage: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BlogFormSubmitData) => {
      return apiRequest("/api/admin/blog", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı oluşturuldu" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error.message || "Blog yazısı oluşturulamadı",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogFormSubmitData }) => {
      return apiRequest(`/api/admin/blog/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı güncellendi" });
      setEditingBlog(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error.message || "Blog yazısı güncellenemedi",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/blog/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Blog yazısı silindi" });
      setDeletingBlog(null);
    },
    onError: () => {
      toast({ title: "Blog yazısı silinemedi", variant: "destructive" });
    },
  });

  const onSubmit = (data: BlogFormValues) => {
    const submitData: BlogFormSubmitData = {
      ...data,
      categoryTags: data.categoryTagsString.split(',').map(s => s.trim()).filter(Boolean),
    };
    
    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    form.reset({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: "", // Content is not fetched in list view
      categoryTagsString: blog.categoryTags.join(", "),
      readTime: blog.readTime,
      published: blog.published,
      featuredImage: "",
    });
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingBlog(null);
    form.reset();
  };

  if (isLoading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-8" data-testid="page-admin-blog">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Blog Yönetimi</h1>
        <Dialog open={isCreateDialogOpen || !!editingBlog} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-blog">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Blog Yazısı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBlog ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
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
                          data-testid="input-blog-title"
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
                        <Input 
                          placeholder="kopeklerde-asi-takvimi" 
                          {...field} 
                          data-testid="input-blog-slug"
                        />
                      </FormControl>
                      <FormDescription>
                        Sadece küçük harf, rakam ve tire kullanın
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Özet (İsteğe Bağlı)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Blog yazısının kısa özeti..."
                          className="resize-none"
                          rows={2}
                          {...field} 
                          data-testid="input-blog-excerpt"
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
                          placeholder="# Blog İçeriği\n\nMarkdown formatında yazın..."
                          className="resize-none font-mono text-sm"
                          rows={12}
                          {...field} 
                          data-testid="input-blog-content"
                        />
                      </FormControl>
                      <FormDescription>
                        Markdown formatı desteklenir (başlıklar, listeler, linkler vb.)
                      </FormDescription>
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
                        <FormLabel>Kategori Etiketleri</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="köpek, sağlık, aşı"
                            {...field} 
                            data-testid="input-blog-tags"
                          />
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
                            data-testid="input-blog-readtime"
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
                        <FormDescription>
                          Blog yazısını hemen yayınla
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-blog-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-blog"
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-blog"
                  >
                    {editingBlog ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Yazıları ({blogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Henüz blog yazısı yok
              </p>
            ) : (
              blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`blog-item-${blog.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{blog.title}</h3>
                      {blog.published ? (
                        <Badge variant="default" className="text-xs">Yayında</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Taslak</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      /{blog.slug}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {blog.views} görüntülenme
                      </span>
                      <span>{blog.readTime} dk</span>
                      <span>{format(new Date(blog.createdAt), "dd MMM yyyy")}</span>
                      <span className="text-xs">
                        {blog.categoryTags.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(blog)}
                      data-testid={`button-edit-blog-${blog.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletingBlog(blog)}
                      data-testid={`button-delete-blog-${blog.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingBlog} onOpenChange={() => setDeletingBlog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog Yazısını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingBlog?.title}" blog yazısını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBlog && deleteMutation.mutate(deletingBlog.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
