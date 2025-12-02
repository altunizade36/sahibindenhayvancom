import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  User,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Filter,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  level: "info" | "warning" | "error";
}

interface SystemLogEntry {
  id: string;
  type: string;
  message: string;
  source: string;
  level: "info" | "warning" | "error" | "debug";
  createdAt: string;
}

export default function AdminLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const auditLogs: AuditLogEntry[] = [
    {
      id: "1",
      action: "UPDATE",
      entity: "listing",
      entityId: "abc123",
      userId: "user1",
      userName: "Admin Mehmet",
      details: "İlan durumu 'pending' -> 'active' olarak güncellendi",
      ipAddress: "192.168.1.1",
      createdAt: new Date().toISOString(),
      level: "info",
    },
    {
      id: "2",
      action: "DELETE",
      entity: "user",
      entityId: "user456",
      userId: "user1",
      userName: "Admin Mehmet",
      details: "Kullanıcı hesabı silindi",
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      level: "warning",
    },
    {
      id: "3",
      action: "CREATE",
      entity: "store",
      entityId: "store789",
      userId: "user2",
      userName: "Admin Ayşe",
      details: "Yeni mağaza onaylandı: PetWorld",
      ipAddress: "192.168.1.2",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      level: "info",
    },
    {
      id: "4",
      action: "UPDATE",
      entity: "settings",
      entityId: "security",
      userId: "user1",
      userName: "Admin Mehmet",
      details: "Güvenlik ayarları güncellendi",
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      level: "warning",
    },
    {
      id: "5",
      action: "BAN",
      entity: "user",
      entityId: "user999",
      userId: "user1",
      userName: "Admin Mehmet",
      details: "Kullanıcı yasaklandı: Spam aktivitesi",
      ipAddress: "192.168.1.1",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      level: "error",
    },
  ];

  const systemLogs: SystemLogEntry[] = [
    {
      id: "1",
      type: "AUTH",
      message: "Başarılı giriş: admin@example.com",
      source: "AuthService",
      level: "info",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      type: "EMAIL",
      message: "Email gönderildi: user@example.com",
      source: "EmailService",
      level: "info",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "3",
      type: "ERROR",
      message: "Veritabanı bağlantı hatası (yeniden denendi)",
      source: "Database",
      level: "warning",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "4",
      type: "CACHE",
      message: "Önbellek temizlendi",
      source: "CacheService",
      level: "info",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const stats = {
    totalActions: 1250,
    todayActions: 45,
    warnings: 12,
    errors: 3,
  };

  const getActionIcon = (entity: string) => {
    switch (entity) {
      case "user":
        return <User className="h-4 w-4" />;
      case "listing":
        return <FileText className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      case "store":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return <Badge variant="default" className="bg-blue-500">Bilgi</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Uyarı</Badge>;
      case "error":
        return <Badge variant="destructive">Hata</Badge>;
      case "debug":
        return <Badge variant="outline">Debug</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (entityFilter !== "all" && log.entity !== entityFilter) return false;
    if (searchQuery && !log.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-logs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Aktivite Logları</h1>
            <p className="text-muted-foreground">
              Admin aktivitelerini ve sistem loglarını izleyin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam İşlem"
            value={stats.totalActions}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Bugün"
            value={stats.todayActions}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Uyarılar"
            value={stats.warnings}
            icon={<AlertCircle className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Hatalar"
            value={stats.errors}
            icon={<AlertCircle className="h-4 w-4" />}
            variant="danger"
          />
        </StatCardGrid>

        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList>
            <TabsTrigger value="audit">Admin Aktiviteleri</TabsTrigger>
            <TabsTrigger value="system">Sistem Logları</TabsTrigger>
          </TabsList>

          <TabsContent value="audit">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <CardTitle>Audit Log</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Seviye" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="info">Bilgi</SelectItem>
                        <SelectItem value="warning">Uyarı</SelectItem>
                        <SelectItem value="error">Hata</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tür" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="user">Kullanıcı</SelectItem>
                        <SelectItem value="listing">İlan</SelectItem>
                        <SelectItem value="store">Mağaza</SelectItem>
                        <SelectItem value="settings">Ayarlar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg"
                      >
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            log.level === "error"
                              ? "bg-red-100 text-red-600"
                              : log.level === "warning"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {getActionIcon(log.entity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.entity}
                            </Badge>
                            {getLevelBadge(log.level)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{log.userName}</span>
                            <span>{log.ipAddress}</span>
                            <span>
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Logları</CardTitle>
                <CardDescription>Uygulama ve servis logları</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 font-mono text-sm">
                    {systemLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded border-l-4 ${
                          log.level === "error"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                            : log.level === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                            : log.level === "debug"
                            ? "bg-gray-50 dark:bg-gray-900/20 border-gray-500"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold ${
                              log.level === "error"
                                ? "text-red-600"
                                : log.level === "warning"
                                ? "text-yellow-600"
                                : log.level === "debug"
                                ? "text-gray-600"
                                : "text-blue-600"
                            }`}
                          >
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "HH:mm:ss")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                        </div>
                        <p className="text-sm">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
