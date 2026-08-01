import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  RefreshCw,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filters?: FilterOption[];
  onRefresh?: () => void;
  onExport?: () => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getItemId?: (item: T) => string;
  actions?: {
    /** Sabit metin ya da satıra göre değişen metin (ör. "Yasakla" / "Yasağı Kaldır") */
    label: string | ((item: T) => string);
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    variant?: "default" | "destructive" | ((item: T) => "default" | "destructive");
  }[];
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (ids: string[]) => void;
    variant?: "default" | "destructive";
  }[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  searchPlaceholder = "Ara...",
  searchKey,
  filters,
  onRefresh,
  onExport,
  selectable,
  selectedIds = [],
  onSelectionChange,
  getItemId,
  actions,
  bulkActions,
  pagination,
  emptyMessage = "Veri bulunamadı",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filteredData = data.filter((item) => {
    if (searchQuery && searchKey) {
      const value = String(item[searchKey]).toLowerCase();
      if (!value.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const allSelected = filteredData.length > 0 && 
    filteredData.every((item) => getItemId && selectedIds.includes(getItemId(item)));

  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (!getItemId || !onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredData.map(getItemId));
    }
  };

  const handleSelectOne = (item: T) => {
    if (!getItemId || !onSelectionChange) return;
    const id = getItemId(item);
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const totalPages = pagination 
    ? Math.ceil(pagination.total / pagination.pageSize) 
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          {searchKey && (
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          )}
          {filters?.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || "all"}
              onValueChange={(value) =>
                setActiveFilters({ ...activeFilters, [filter.key]: value })
              }
            >
              <SelectTrigger className="w-[140px]" data-testid={`filter-${filter.key}`}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && bulkActions && (
            <div className="flex gap-2 mr-2">
              <Badge variant="secondary" className="h-9 px-3">
                {selectedIds.length} seçili
              </Badge>
              {bulkActions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant === "destructive" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => action.onClick(selectedIds)}
                  data-testid={`bulk-action-${i}`}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Yenile" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="icon" onClick={onExport} aria-label="Dışa aktar" data-testid="button-export">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Tümünü seç"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {selectable && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => {
                const id = getItemId?.(item) || String(index);
                const isSelected = selectedIds.includes(id);
                return (
                  <TableRow 
                    key={id} 
                    className={isSelected ? "bg-accent/50" : undefined}
                    data-testid={`row-${id}`}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectOne(item)}
                          aria-label="Seç"
                          data-testid={`checkbox-${id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.cell(item)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="İşlemler" data-testid={`actions-${id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, i) => {
                              const label =
                                typeof action.label === "function" ? action.label(item) : action.label;
                              const variant =
                                typeof action.variant === "function"
                                  ? action.variant(item)
                                  : action.variant;
                              return (
                                <DropdownMenuItem
                                  key={i}
                                  onClick={() => action.onClick(item)}
                                  className={variant === "destructive" ? "text-destructive" : undefined}
                                >
                                  {action.icon}
                                  <span className="ml-2">{label}</span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pagination.total} kayıttan {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} gösteriliyor
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2 text-sm">
                <span>{pagination.page}</span>
                <span className="text-muted-foreground">/</span>
                <span>{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={pagination.page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
