import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Request, Item, Meeting, Profile } from "@shared/schema";
import { ArrowLeft, Package, Shirt, Calendar, Plus, MapPin, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  matched: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const itemStatusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  listed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sold: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  unsold: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  returned: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  donated: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

const serviceTypeLabels: Record<string, string> = {
  classic: "Classic",
  express: "Express",
  sos_dressing: "SOS Dressing",
};

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  const { data: request, isLoading } = useQuery<Request & { seller?: any; reusse?: any }>({
    queryKey: ["/api/requests", params.id],
  });

  const { data: requestItems, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/requests", params.id, "items"],
  });

  const { data: requestMeetings } = useQuery<Meeting[]>({
    queryKey: ["/api/requests", params.id, "meetings"],
  });

  const acceptRequest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: "Request accepted!" });
    },
  });

  const [itemForm, setItemForm] = useState({
    title: "", description: "", brand: "", size: "", category: "clothing", condition: "good", minPrice: "", maxPrice: "",
  });

  const addItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowAddItem(false);
      setItemForm({ title: "", description: "", brand: "", size: "", category: "clothing", condition: "good", minPrice: "", maxPrice: "" });
      toast({ title: "Item added" });
    },
  });

  const [meetingForm, setMeetingForm] = useState({ date: "", time: "", location: "", notes: "" });

  const scheduleMeeting = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/meetings`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "meetings"] });
      setShowScheduleMeeting(false);
      setMeetingForm({ date: "", time: "", location: "", notes: "" });
      toast({ title: "Meeting scheduled" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <Card><CardContent className="p-8 text-center"><p className="text-muted-foreground">Request not found.</p></CardContent></Card>
      </div>
    );
  }

  const isReusse = profile?.role === "reusse";
  const isSeller = profile?.role === "seller";
  const isAssigned = request.reusseId === user?.id;
  const canAccept = isReusse && request.status === "pending" && !request.reusseId;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => setLocation(isReusse ? "/available" : "/requests")} data-testid="button-back-detail">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold" data-testid="text-request-detail-title">
              {serviceTypeLabels[request.serviceType]} Request #{request.id}
            </h1>
            <Badge variant="secondary" className={statusColors[request.status] || ""}>
              {request.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {request.createdAt ? new Date(request.createdAt).toLocaleDateString("fr-FR") : ""}
          </p>
        </div>
        {canAccept && (
          <Button
            className="bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
            onClick={() => acceptRequest.mutate()}
            disabled={acceptRequest.isPending}
            data-testid="button-accept-request"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-sm font-medium">{request.itemCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium truncate">{request.meetingLocation || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Value</p>
              <p className="text-sm font-medium">{request.estimatedValue ? `${request.estimatedValue} EUR` : "Not specified"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {request.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{request.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items ({requestItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({requestMeetings?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-3">
          {(isReusse && isAssigned) && (
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-add-item">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Item</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addItem.mutate(itemForm); }} className="space-y-3">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={itemForm.title} onChange={(e) => setItemForm({...itemForm, title: e.target.value})} required data-testid="input-item-title" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input value={itemForm.brand} onChange={(e) => setItemForm({...itemForm, brand: e.target.value})} data-testid="input-item-brand" />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input value={itemForm.size} onChange={(e) => setItemForm({...itemForm, size: e.target.value})} data-testid="input-item-size" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={itemForm.category} onValueChange={(v) => setItemForm({...itemForm, category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="shoes">Shoes</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={itemForm.condition} onValueChange={(v) => setItemForm({...itemForm, condition: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Min Price (EUR)</Label>
                      <Input type="number" value={itemForm.minPrice} onChange={(e) => setItemForm({...itemForm, minPrice: e.target.value})} data-testid="input-item-min-price" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Price (EUR)</Label>
                      <Input type="number" value={itemForm.maxPrice} onChange={(e) => setItemForm({...itemForm, maxPrice: e.target.value})} data-testid="input-item-max-price" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="resize-none" rows={2} data-testid="input-item-description" />
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={addItem.isPending} data-testid="button-submit-item">
                    {addItem.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {itemsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)
          ) : requestItems && requestItems.length > 0 ? (
            requestItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Shirt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" data-testid={`text-item-title-${item.id}`}>{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                        {item.size && <span className="text-xs text-muted-foreground">Size {item.size}</span>}
                        <span className="text-xs text-muted-foreground capitalize">{item.condition}</span>
                      </div>
                      {item.minPrice && item.maxPrice && (
                        <p className="text-xs text-muted-foreground mt-1">{item.minPrice} - {item.maxPrice} EUR</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={itemStatusColors[item.status] || ""}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shirt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No items added yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-3">
          {(isReusse && isAssigned) && (
            <Dialog open={showScheduleMeeting} onOpenChange={setShowScheduleMeeting}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-schedule-meeting">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  scheduleMeeting.mutate({
                    scheduledDate: new Date(`${meetingForm.date}T${meetingForm.time}`).toISOString(),
                    location: meetingForm.location,
                    notes: meetingForm.notes || null,
                  });
                }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} required data-testid="input-meeting-date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time *</Label>
                      <Input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} required data-testid="input-meeting-time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input value={meetingForm.location} onChange={(e) => setMeetingForm({...meetingForm, location: e.target.value})} required data-testid="input-meeting-location" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({...meetingForm, notes: e.target.value})} className="resize-none" rows={2} data-testid="input-meeting-notes" />
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={scheduleMeeting.isPending} data-testid="button-submit-meeting">
                    {scheduleMeeting.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {requestMeetings && requestMeetings.length > 0 ? (
            requestMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                        {meeting.duration ? ` - ${meeting.duration} min` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {meeting.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={statusColors[meeting.status] || ""}>
                    {meeting.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
