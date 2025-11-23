import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Users, FileText, TrendingUp } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
}

interface Listing {
  id: string;
  title: string;
  status: string;
  price: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/listings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Listing status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (statsLoading || listingsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8" data-testid="page-admin-dashboard">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">
              {stats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-listings">
              {stats?.totalListings || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-listings">
              {stats?.activeListings || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Listings - Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listings.slice(0, 20).map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`listing-${listing.id}`}
              >
                <div className="flex-1">
                  <h3 className="font-medium" data-testid={`listing-title-${listing.id}`}>
                    {listing.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {listing.price} TRY • {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                    {listing.status}
                  </Badge>

                  {listing.status !== "active" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateStatusMutation.mutate({ id: listing.id, status: "active" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-approve-${listing.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}

                  {listing.status === "active" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ id: listing.id, status: "rejected" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-reject-${listing.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
