import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  User,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Store,
  Flag,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userName: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  level: "info" | "warning" | "error";
}

interface LogStats {
  totalActions: number;
  todayActions: number;
  warnings: number;
  errors: number;
}

export default function AdminLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs = [], isLoading, refetch } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/admin/audit-logs", { level: levelFilter === "all" ? undefined : levelFilter, entity: entityFilter === "all" ? undefined : entityFilter }],
  });

  const { data: stats } = useQuery<LogStats>({
    queryKey: ["/api/admin/audit-logs/stats"],
  });

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(query) ||
        log.entity.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        (log.details && log.details.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getActionIcon = (entity: string) => {
    switch (entity) {
      case "user":
        return <User className="h-4 w-4" />;
      case "listing":
        return <FileText className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      case "store":
        return <Store className="h-4 w-4" />;
      case "report":
        return <Flag className="h-4 w-4" />;
      case "broadcast":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Bilgi
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3" />
            Uyarı
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Hata
          </Badge>
        );
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Oluşturma",
      UPDATE: "Güncelleme",
      DELETE: "Silme",
      LOGIN: "Giriş",
      LOGOUT: "Çıkış",
      BAN: "Yasaklama",
      UNBAN: "Yasak Kaldırma",
      APPROVE: "Onaylama",
      REJECT: "Reddetme",
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      user: "Kullanıcı",
      listing: "İlan",
      store: "Mağaza",
      report: "Şikayet",
      settings: "Ayarlar",
      blog: "Blog",
      category: "Kategori",
      broadcast: "Bildirim",
    };
    return labels[entity] || entity;
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-logs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sistem Logları</h1>
            <p className="text-muted-foreground">
              Admin işlemlerini ve sistem aktivitelerini izleyin
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-logs">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam İşlem"
            value={(stats?.totalActions || 0).toLocaleString("tr-TR")}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Bugünkü İşlem"
            value={stats?.todayActions || 0}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Uyarılar"
            value={stats?.warnings || 0}
            icon={<AlertCircle className="h-4 w-4" />}
            variant="warning"
          />
          <StatCard
            title="Hatalar"
            value={stats?.errors || 0}
            icon={<AlertCircle className="h-4 w-4" />}
            variant="danger"
          />
        </StatCardGrid>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Aktivite Logları</CardTitle>
                <CardDescription>Tüm admin işlemlerinin kaydı</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Log ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-logs"
                  />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32" data-testid="select-level-filter">
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
                  <SelectTrigger className="w-32" data-testid="select-entity-filter">
                    <SelectValue placeholder="Varlık" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                    <SelectItem value="listing">İlan</SelectItem>
                    <SelectItem value="store">Mağaza</SelectItem>
                    <SelectItem value="report">Şikayet</SelectItem>
                    <SelectItem value="settings">Ayarlar</SelectItem>
                    <SelectItem value="broadcast">Bildirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz log kaydı yok</p>
                <p className="text-sm mt-2">Admin işlemleri burada görüntülenecek</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`log-item-${log.id}`}
                    >
                      <div className="p-2 rounded-full bg-muted">
                        {getActionIcon(log.entity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{getActionLabel(log.action)}</span>
                          <Badge variant="outline">{getEntityLabel(log.entity)}</Badge>
                          {getLevelBadge(log.level)}
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {log.details}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.userName}
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        <div>{format(new Date(log.createdAt), "HH:mm", { locale: tr })}</div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(log.createdAt), { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
