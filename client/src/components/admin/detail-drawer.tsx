import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface DetailSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  sections?: DetailSection[];
  tabs?: DetailSection[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  width?: "default" | "wide" | "full";
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  sections,
  tabs,
  actions,
  children,
  width = "default",
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || "");

  const widthClass = {
    default: "sm:max-w-md",
    wide: "sm:max-w-xl",
    full: "sm:max-w-2xl",
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className={widthClass[width]} data-testid="detail-drawer">
        <SheetHeader className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold truncate">
                {title}
              </SheetTitle>
              {subtitle && (
                <SheetDescription className="truncate">
                  {subtitle}
                </SheetDescription>
              )}
            </div>
            {badge && (
              <Badge variant={badge.variant} className="flex-shrink-0">
                {badge.label}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {tabs && tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : sections && sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={section.id}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    {section.title}
                  </h4>
                  {section.content}
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          ) : (
            children
          )}
        </ScrollArea>

        {actions && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-2">{actions}</div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DetailField({ label, value, className }: DetailFieldProps) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value || "-"}</dd>
    </div>
  );
}

interface DetailGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}

export function DetailGrid({ children, columns = 2 }: DetailGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <dl className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </dl>
  );
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: Date | string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

interface DetailTimelineProps {
  events: TimelineEvent[];
}

export function DetailTimeline({ events }: DetailTimelineProps) {
  const variantStyles = {
    default: "bg-muted",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`h-2 w-2 rounded-full mt-2 ${variantStyles[event.variant || "default"]}`}
            />
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              {event.icon}
              <p className="text-sm font-medium">{event.title}</p>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {typeof event.date === "string"
                ? event.date
                : event.date.toLocaleString("tr-TR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
