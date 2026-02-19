import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, Profile } from "@shared/schema";
import { Users, Shield, Package, CheckCircle, XCircle, Clock } from "lucide-react";

interface UserWithProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  profile: Profile | null;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const { data: allUsers, isLoading: usersLoading } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: pendingReusses, isLoading: pendingLoading } = useQuery<UserWithProfile[]>({
    queryKey: ["/api/admin/applications"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalSellers: number;
    totalReusses: number;
    pendingApplications: number;
    totalRequests: number;
    activeRequests: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const updateApplication = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${userId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Application updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-admin-title">Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, applications, and platform activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Resellers</p>
                  <p className="text-xl font-bold">{stats?.totalReusses || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                  <p className="text-xl font-bold">{stats?.pendingApplications || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Requests</p>
                  <p className="text-xl font-bold">{stats?.activeRequests || 0}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" data-testid="tab-applications">
            Applications {stats?.pendingApplications ? `(${stats.pendingApplications})` : ""}
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-3">
          {pendingLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
            ))
          ) : pendingReusses && pendingReusses.length > 0 ? (
            pendingReusses.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {u.profile?.city && (
                          <p className="text-xs text-muted-foreground mt-1">{u.profile.city}, {u.profile.department}</p>
                        )}
                        {u.profile?.bio && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{u.profile.bio}</p>
                        )}
                        {u.profile?.experience && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Experience: {u.profile.experience}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                        onClick={() => updateApplication.mutate({ userId: u.id, status: "approved" })}
                        disabled={updateApplication.isPending}
                        data-testid={`button-approve-${u.id}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => updateApplication.mutate({ userId: u.id, status: "rejected" })}
                        disabled={updateApplication.isPending}
                        data-testid={`button-reject-${u.id}`}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">No pending applications</p>
                <p className="text-xs text-muted-foreground">All reseller applications have been reviewed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-3">
          {usersLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12" /></CardContent></Card>
            ))
          ) : allUsers && allUsers.length > 0 ? (
            allUsers.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs bg-muted">
                        {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.profile && (
                      <>
                        <Badge variant="secondary">{u.profile.role}</Badge>
                        {u.profile.role === "reusse" && (
                          <Badge variant="secondary" className={
                            u.profile.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            u.profile.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }>
                            {u.profile.status}
                          </Badge>
                        )}
                      </>
                    )}
                    {!u.profile && <Badge variant="secondary">no profile</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
