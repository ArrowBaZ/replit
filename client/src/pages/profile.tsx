import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@shared/schema";
import { User, MapPin, Phone, Mail, Pencil, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState<Partial<Profile>>({});

  const startEditing = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        department: profile.department || "",
        bio: profile.bio || "",
        experience: profile.experience || "",
        siretNumber: profile.siretNumber || "",
      });
    }
    setEditing(true);
  };

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setEditing(false);
      toast({ title: "Profile updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">Profile</h1>
        {!editing && (
          <Button variant="outline" onClick={startEditing} data-testid="button-edit-profile">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg bg-muted">
                {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-profile-name">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">{profile?.role || "unknown"}</Badge>
                {profile?.role === "reusse" && profile.status && (
                  <Badge variant="secondary" className={
                    profile.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    profile.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }>
                    {profile.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(formData); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone || ""} onChange={(e) => updateField("phone", e.target.value)} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address || ""} onChange={(e) => updateField("address", e.target.value)} data-testid="input-edit-address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city || ""} onChange={(e) => updateField("city", e.target.value)} data-testid="input-edit-city" />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input value={formData.postalCode || ""} onChange={(e) => updateField("postalCode", e.target.value)} data-testid="input-edit-postal" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department || ""} onChange={(e) => updateField("department", e.target.value)} data-testid="input-edit-department" />
              </div>
              {profile?.role === "reusse" && (
                <>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={formData.bio || ""} onChange={(e) => updateField("bio", e.target.value)} className="resize-none" rows={3} data-testid="input-edit-bio" />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience</Label>
                    <Textarea value={formData.experience || ""} onChange={(e) => updateField("experience", e.target.value)} className="resize-none" rows={3} data-testid="input-edit-experience" />
                  </div>
                  <div className="space-y-2">
                    <Label>SIRET Number</Label>
                    <Input value={formData.siretNumber || ""} onChange={(e) => updateField("siretNumber", e.target.value)} data-testid="input-edit-siret" />
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={updateProfile.isPending} data-testid="button-save-profile">
                  <Save className="h-4 w-4 mr-2" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {profile?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-profile-phone">{profile.phone}</span>
                </div>
              )}
              {(profile?.address || profile?.city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span data-testid="text-profile-address">
                    {[profile?.address, profile?.city, profile?.postalCode, profile?.department].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {profile?.bio && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm" data-testid="text-profile-bio">{profile.bio}</p>
                </div>
              )}
              {profile?.experience && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Experience</p>
                  <p className="text-sm" data-testid="text-profile-experience">{profile.experience}</p>
                </div>
              )}
              {profile?.siretNumber && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">SIRET</p>
                  <p className="text-sm" data-testid="text-profile-siret">{profile.siretNumber}</p>
                </div>
              )}
              {!profile?.phone && !profile?.address && !profile?.bio && (
                <p className="text-sm text-muted-foreground">No additional information added yet. Click Edit to add your details.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
