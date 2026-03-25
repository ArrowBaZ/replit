import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
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
import { ArrowLeft, Package, Shirt, Calendar, Plus, MapPin, Clock, CheckCircle, DollarSign, ThumbsUp, ThumbsDown, ShoppingBag, XCircle, Tag, Camera, X, Loader2, Phone, Copy, AlertCircle, Award } from "lucide-react";
import { ITEM_CATEGORIES, type ItemCategory } from "@shared/schema";
import { useState, useRef } from "react";
import { useUpload } from "@/hooks/use-upload";

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
  returned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  donated: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
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

  const { data: contactInfo } = useQuery<{
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    role: string | null;
  } | null>({
    queryKey: ["/api/requests", params.id, "contact"],
    enabled: !!request && (!!request.reusseId),
  });

  const conditionLabel = (cond: string | null): string => {
    const map: Record<string, string> = {
      new_with_tags: t("condNew"),
      like_new: t("condLikeNew"),
      good: t("condGood"),
      fair: t("condFair"),
    };
    return cond ? (map[cond] || cond.replace(/_/g, " ")) : "";
  };

  const acceptRequest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("acceptRequest") });
    },
  });

  const emptyItemForm = {
    title: "", description: "", brand: "", size: "", category: "vetements" as ItemCategory, condition: "good",
    minPrice: "", maxPrice: "", material: "", dimensions: "", author: "", genre: "", language: "",
    vintage: "", ageRange: "", model: "", deviceStorage: "", ram: "", volume: "", frameSize: "",
    instrumentType: "", applianceType: "", decorStyle: "", subcategory: "",
  };
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemPhotos, setItemPhotos] = useState<string[]>([]);
  const [certPhotos, setCertPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading: isUploadingPhoto } = useUpload({
    onSuccess: (response) => {
      setItemPhotos((prev) => [...prev, response.objectPath]);
    },
  });
  const { uploadFile: uploadCertFile, isUploading: isUploadingCert } = useUpload({
    onSuccess: (response) => {
      setCertPhotos((prev) => [...prev, response.objectPath]);
    },
  });

  const MAX_PHOTOS = 5;
  const MAX_CERT_PHOTOS = 3;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - itemPhotos.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const file of filesToUpload) {
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_CERT_PHOTOS - certPhotos.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const file of filesToUpload) {
      await uploadCertFile(file);
    }
    if (certFileInputRef.current) certFileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setItemPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeCertPhoto = (index: number) => {
    setCertPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddItemPrefilled = (item: Item) => {
    setItemForm({
      title: item.title,
      description: item.description || "",
      brand: item.brand || "",
      size: item.size || "",
      category: (ITEM_CATEGORIES.includes(item.category as ItemCategory) ? item.category : "vetements") as ItemCategory,
      condition: item.condition || "good",
      minPrice: item.minPrice || "",
      maxPrice: item.maxPrice || "",
      material: item.material || "",
      dimensions: item.dimensions || "",
      author: item.author || "",
      genre: item.genre || "",
      language: item.language || "",
      vintage: item.vintage || "",
      ageRange: item.ageRange || "",
      model: item.model || "",
      deviceStorage: item.deviceStorage || "",
      ram: item.ram || "",
      volume: item.volume || "",
      frameSize: item.frameSize || "",
      instrumentType: item.instrumentType || "",
      applianceType: item.applianceType || "",
      decorStyle: item.decorStyle || "",
      subcategory: item.subcategory || "",
    });
    setItemPhotos(item.photos || []);
    setCertPhotos(item.certificatePhotos || []);
    setShowAddItem(true);
  };

  const addItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/requests/${params.id}/items`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowAddItem(false);
      setItemForm(emptyItemForm);
      setItemPhotos([]);
      setCertPhotos([]);
      toast({ title: t("addItem") });
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
      toast({ title: t("scheduleMeeting") });
    },
  });

  const [showMarkSold, setShowMarkSold] = useState<number | null>(null);
  const [soldPrice, setSoldPrice] = useState("");
  const [showCounterOffer, setShowCounterOffer] = useState<number | null>(null);
  const [counterMin, setCounterMin] = useState("");
  const [counterMax, setCounterMax] = useState("");
  const [showListItem, setShowListItem] = useState<number | null>(null);
  const [listPlatform, setListPlatform] = useState("");
  const [showReschedule, setShowReschedule] = useState<number | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "", location: "" });
  const [showDeclineReason, setShowDeclineReason] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const approveItem = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      toast({ title: t("itemApproved") });
    },
  });

  const counterOfferItem = useMutation({
    mutationFn: async ({ itemId, minPrice, maxPrice }: { itemId: number; minPrice: string; maxPrice: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/counter-offer`, { minPrice, maxPrice });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowCounterOffer(null);
      setCounterMin("");
      setCounterMax("");
      toast({ title: t("counterOfferSent") });
    },
  });

  const declineItem = useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/decline`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowDeclineReason(null);
      setDeclineReason("");
      toast({ title: t("itemDeclined") });
    },
  });

  const duplicateItem = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/duplicate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      toast({ title: t("duplicateItem") });
    },
  });

  const listItem = useMutation({
    mutationFn: async ({ itemId, platformListedOn }: { itemId: number; platformListedOn: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/list`, { platformListedOn });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowListItem(null);
      setListPlatform("");
      toast({ title: t("itemListed") });
    },
  });

  const markSold = useMutation({
    mutationFn: async ({ itemId, salePrice }: { itemId: number; salePrice: string }) => {
      const res = await apiRequest("POST", `/api/items/${itemId}/mark-sold`, { salePrice });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "items"] });
      setShowMarkSold(null);
      setSoldPrice("");
      toast({ title: t("itemMarkedSold") });
    },
  });

  const cancelMeeting = useMutation({
    mutationFn: async (meetingId: number) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "meetings"] });
      toast({ title: t("meetingCancelled") });
    },
  });

  const rescheduleMeeting = useMutation({
    mutationFn: async ({ meetingId, scheduledDate, location }: { meetingId: number; scheduledDate: string; location: string }) => {
      const res = await apiRequest("PATCH", `/api/meetings/${meetingId}/reschedule`, { scheduledDate, location });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id, "meetings"] });
      setShowReschedule(null);
      setRescheduleForm({ date: "", time: "", location: "" });
      toast({ title: t("meetingRescheduled") });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/requests/${params.id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("requestCancelled") });
    },
  });

  const completeRequest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/requests/${params.id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("requestCompleted") });
    },
  });

  const serviceTypeLabels: Record<string, string> = {
    classic: t("classic"),
    express: t("express"),
    sos_dressing: t("sosDressing"),
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t("statusPending"),
      matched: t("statusMatched"),
      scheduled: t("statusScheduled"),
      in_progress: t("statusInProgress"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
      pending_approval: t("statusPendingApproval"),
      approved: t("statusApproved"),
      listed: t("statusListed"),
      sold: t("statusSold"),
    };
    return statusMap[status] || status.replace(/_/g, " ");
  };

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

  const CATEGORY_LABELS: Record<string, string> = {
    tout_mode: t("catToutMode"),
    vetements: t("catVetements"),
    montres_bijoux: t("catMontrsBijoux"),
    accessoires_bagagerie: t("catAccessoiresBagagerie"),
    ameublement: t("catAmeublement"),
    electromenager: t("catElectromenager"),
    decoration: t("catDecoration"),
    linge_de_maison: t("catLingeDeMaison"),
    electronique: t("catElectronique"),
    ordinateurs: t("catOrdinateurs"),
    telephones_objets_connectes: t("catTelephonesObjetsConnectes"),
    livres: t("catLivres"),
    vins: t("catVins"),
    instruments_de_musique: t("catInstrumentsDeMsique"),
    jeux_jouets: t("catJeuxJouets"),
    velos: t("catVelos"),
  };

  const CATEGORY_FIELDS: Record<string, string[]> = {
    tout_mode: [],
    vetements: ["brand", "size", "condition"],
    montres_bijoux: ["brand", "material", "condition", "certificatePhotos"],
    accessoires_bagagerie: ["brand", "subcategory", "condition", "certificatePhotos"],
    ameublement: ["brand", "material", "dimensions", "condition"],
    electromenager: ["brand", "applianceType", "condition"],
    decoration: ["decorStyle", "material", "condition"],
    linge_de_maison: ["subcategory", "size", "condition"],
    electronique: ["brand", "subcategory", "condition"],
    ordinateurs: ["brand", "ram", "deviceStorage", "condition"],
    telephones_objets_connectes: ["brand", "model", "deviceStorage", "condition"],
    livres: ["author", "genre", "language", "condition"],
    vins: ["subcategory", "vintage", "volume"],
    instruments_de_musique: ["instrumentType", "brand", "condition"],
    jeux_jouets: ["ageRange", "brand", "condition"],
    velos: ["brand", "subcategory", "frameSize", "condition"],
  };

  const showCertPhotos = ["montres_bijoux", "accessoires_bagagerie"].includes(itemForm.category);
  const categoryFields = CATEGORY_FIELDS[itemForm.category] || [];

  const handleCategoryChange = (newCategory: ItemCategory) => {
    const allowedFields = CATEGORY_FIELDS[newCategory] || [];
    const allMetaFields = [
      "brand", "size", "condition", "subcategory", "material", "dimensions",
      "author", "genre", "language", "vintage", "ageRange", "model",
      "deviceStorage", "ram", "volume", "frameSize", "instrumentType",
      "applianceType", "decorStyle",
    ] as const;
    const cleared: Partial<typeof itemForm> = {};
    for (const field of allMetaFields) {
      if (!allowedFields.includes(field)) {
        cleared[field] = "";
      }
    }
    if (!allowedFields.includes("certificatePhotos")) {
      setCertPhotos([]);
    }
    setItemForm({ ...itemForm, category: newCategory, ...cleared });
  };

  const ItemPhotoUploadArea = () => (
    <div className="space-y-2">
      <Label>{t("photos")}</Label>
      <div className="flex flex-wrap gap-2">
        {itemPhotos.map((photo, idx) => (
          <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border">
            <img src={photo} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-0 right-0 bg-black/60 rounded-bl-md p-0.5"
              data-testid={`button-remove-photo-${idx}`}
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {itemPhotos.length < MAX_PHOTOS && (
          <label
            className="h-16 w-16 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-[hsl(var(--success))] transition-colors"
            data-testid="button-upload-photo"
          >
            {isUploadingPhoto ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Camera className="h-5 w-5 text-muted-foreground" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
    </div>
  );

  const CertPhotoUploadArea = () => (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />{t("certificatePhotos")}</Label>
      <div className="flex flex-wrap gap-2">
        {certPhotos.map((photo, idx) => (
          <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border border-amber-300">
            <img src={photo} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeCertPhoto(idx)}
              className="absolute top-0 right-0 bg-black/60 rounded-bl-md p-0.5"
              data-testid={`button-remove-cert-photo-${idx}`}
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {certPhotos.length < MAX_CERT_PHOTOS && (
          <label
            className="h-16 w-16 rounded-md border-2 border-dashed border-amber-300 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"
            data-testid="button-upload-cert-photo"
          >
            {isUploadingCert ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Award className="h-5 w-5 text-amber-500" />
            )}
            <input
              ref={certFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleCertUpload}
              disabled={isUploadingCert}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("certificatePhotoHint")}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => setLocation(isReusse ? "/available" : "/requests")} data-testid="button-back-detail">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold" data-testid="text-request-detail-title">
              {serviceTypeLabels[request.serviceType]} {t("requestDetail")} #{request.id}
            </h1>
            <Badge variant="secondary" className={statusColors[request.status] || ""}>
              {translateStatus(request.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("created")} {request.createdAt ? new Date(request.createdAt).toLocaleDateString("fr-FR") : ""}
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
            {t("acceptRequest")}
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("items")}</p>
              <p className="text-sm font-medium">{request.itemCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("location")}</p>
              <p className="text-sm font-medium truncate">{request.meetingLocation || t("notSpecified")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("estimatedValue")}</p>
              <p className="text-sm font-medium">{request.estimatedValue ? `${request.estimatedValue} EUR` : t("notSpecified")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(request.preferredDateStart || request.preferredDateEnd) && (
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("sellerAvailability")}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                {request.preferredDateStart && (
                  <span><span className="text-muted-foreground text-xs">{t("availableFrom")}: </span><span className="font-medium">{new Date(request.preferredDateStart).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span></span>
                )}
                {request.preferredDateEnd && (
                  <span><span className="text-muted-foreground text-xs">{t("availableTo")}: </span><span className="font-medium">{new Date(request.preferredDateEnd).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span></span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {request.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("notes")}</p>
            <p className="text-sm">{request.notes}</p>
          </CardContent>
        </Card>
      )}

      {contactInfo && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-start gap-3">
            <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground mb-1">
                {isReusse ? t("sellerContact") : t("reusseContact")}
              </p>
              <p className="text-sm font-medium">{contactInfo.firstName} {contactInfo.lastName}</p>
              {contactInfo.phone ? (
                <p className="text-sm text-blue-600 dark:text-blue-400">{contactInfo.phone}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("notSpecified")}</p>
              )}
              {contactInfo.address && (
                <p className="text-xs text-muted-foreground">{contactInfo.address}{contactInfo.city ? `, ${contactInfo.city}` : ""}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">{t("items")} ({requestItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="meetings">{t("meetingsSection")} ({requestMeetings?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-3">
          {(isReusse && isAssigned) && (
            <Dialog open={showAddItem} onOpenChange={(open) => { setShowAddItem(open); if (!open) { setItemForm(emptyItemForm); setItemPhotos([]); setCertPhotos([]); } }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-add-item">
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("addItem")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t("addItem")}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addItem.mutate({
                    ...itemForm,
                    photos: itemPhotos.length > 0 ? itemPhotos : undefined,
                    certificatePhotos: certPhotos.length > 0 ? certPhotos : undefined,
                  });
                }} className="space-y-3">
                  <div className="space-y-2">
                    <Label>{t("title")} *</Label>
                    <Input value={itemForm.title} onChange={(e) => setItemForm({...itemForm, title: e.target.value})} required data-testid="input-item-title" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("category")}</Label>
                    <Select value={itemForm.category} onValueChange={(v) => handleCategoryChange(v as ItemCategory)}>
                      <SelectTrigger data-testid="select-item-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ITEM_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {categoryFields.includes("brand") && (
                    <div className="space-y-2">
                      <Label>{t("brand")}</Label>
                      <Input value={itemForm.brand} onChange={(e) => setItemForm({...itemForm, brand: e.target.value})} data-testid="input-item-brand" />
                    </div>
                  )}
                  {categoryFields.includes("size") && (
                    <div className="space-y-2">
                      <Label>{t("size")}</Label>
                      <Input value={itemForm.size} onChange={(e) => setItemForm({...itemForm, size: e.target.value})} data-testid="input-item-size" />
                    </div>
                  )}
                  {categoryFields.includes("material") && (
                    <div className="space-y-2">
                      <Label>{t("material")}</Label>
                      <Input value={itemForm.material} onChange={(e) => setItemForm({...itemForm, material: e.target.value})} data-testid="input-item-material" />
                    </div>
                  )}
                  {categoryFields.includes("dimensions") && (
                    <div className="space-y-2">
                      <Label>{t("dimensions")}</Label>
                      <Input value={itemForm.dimensions} onChange={(e) => setItemForm({...itemForm, dimensions: e.target.value})} data-testid="input-item-dimensions" />
                    </div>
                  )}
                  {categoryFields.includes("subcategory") && (
                    <div className="space-y-2">
                      <Label>{t("subcategory")}</Label>
                      <Input value={itemForm.subcategory} onChange={(e) => setItemForm({...itemForm, subcategory: e.target.value})} data-testid="input-item-subcategory" />
                    </div>
                  )}
                  {categoryFields.includes("applianceType") && (
                    <div className="space-y-2">
                      <Label>{t("applianceType")}</Label>
                      <Input value={itemForm.applianceType} onChange={(e) => setItemForm({...itemForm, applianceType: e.target.value})} data-testid="input-item-appliance-type" />
                    </div>
                  )}
                  {categoryFields.includes("decorStyle") && (
                    <div className="space-y-2">
                      <Label>{t("decorStyle")}</Label>
                      <Input value={itemForm.decorStyle} onChange={(e) => setItemForm({...itemForm, decorStyle: e.target.value})} data-testid="input-item-decor-style" />
                    </div>
                  )}
                  {categoryFields.includes("author") && (
                    <div className="space-y-2">
                      <Label>{t("author")}</Label>
                      <Input value={itemForm.author} onChange={(e) => setItemForm({...itemForm, author: e.target.value})} data-testid="input-item-author" />
                    </div>
                  )}
                  {categoryFields.includes("genre") && (
                    <div className="space-y-2">
                      <Label>{t("genre")}</Label>
                      <Input value={itemForm.genre} onChange={(e) => setItemForm({...itemForm, genre: e.target.value})} data-testid="input-item-genre" />
                    </div>
                  )}
                  {categoryFields.includes("language") && (
                    <div className="space-y-2">
                      <Label>{t("language")}</Label>
                      <Input value={itemForm.language} onChange={(e) => setItemForm({...itemForm, language: e.target.value})} data-testid="input-item-language" />
                    </div>
                  )}
                  {categoryFields.includes("vintage") && (
                    <div className="space-y-2">
                      <Label>{t("vintage")}</Label>
                      <Input value={itemForm.vintage} onChange={(e) => setItemForm({...itemForm, vintage: e.target.value})} data-testid="input-item-vintage" />
                    </div>
                  )}
                  {categoryFields.includes("volume") && (
                    <div className="space-y-2">
                      <Label>{t("volume")}</Label>
                      <Input value={itemForm.volume} onChange={(e) => setItemForm({...itemForm, volume: e.target.value})} data-testid="input-item-volume" />
                    </div>
                  )}
                  {categoryFields.includes("ageRange") && (
                    <div className="space-y-2">
                      <Label>{t("ageRange")}</Label>
                      <Input value={itemForm.ageRange} onChange={(e) => setItemForm({...itemForm, ageRange: e.target.value})} data-testid="input-item-age-range" />
                    </div>
                  )}
                  {categoryFields.includes("model") && (
                    <div className="space-y-2">
                      <Label>{t("model")}</Label>
                      <Input value={itemForm.model} onChange={(e) => setItemForm({...itemForm, model: e.target.value})} data-testid="input-item-model" />
                    </div>
                  )}
                  {categoryFields.includes("deviceStorage") && (
                    <div className="space-y-2">
                      <Label>{t("deviceStorage")}</Label>
                      <Input value={itemForm.deviceStorage} onChange={(e) => setItemForm({...itemForm, deviceStorage: e.target.value})} data-testid="input-item-device-storage" />
                    </div>
                  )}
                  {categoryFields.includes("ram") && (
                    <div className="space-y-2">
                      <Label>{t("ram")}</Label>
                      <Input value={itemForm.ram} onChange={(e) => setItemForm({...itemForm, ram: e.target.value})} data-testid="input-item-ram" />
                    </div>
                  )}
                  {categoryFields.includes("frameSize") && (
                    <div className="space-y-2">
                      <Label>{t("frameSize")}</Label>
                      <Input value={itemForm.frameSize} onChange={(e) => setItemForm({...itemForm, frameSize: e.target.value})} data-testid="input-item-frame-size" />
                    </div>
                  )}
                  {categoryFields.includes("instrumentType") && (
                    <div className="space-y-2">
                      <Label>{t("instrumentType")}</Label>
                      <Input value={itemForm.instrumentType} onChange={(e) => setItemForm({...itemForm, instrumentType: e.target.value})} data-testid="input-item-instrument-type" />
                    </div>
                  )}
                  {categoryFields.includes("condition") && (
                    <div className="space-y-2">
                      <Label>{t("condition")}</Label>
                      <Select value={itemForm.condition} onValueChange={(v) => setItemForm({...itemForm, condition: v})}>
                        <SelectTrigger data-testid="select-item-condition"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_with_tags">{t("condNew")}</SelectItem>
                          <SelectItem value="like_new">{t("condLikeNew")}</SelectItem>
                          <SelectItem value="good">{t("condGood")}</SelectItem>
                          <SelectItem value="fair">{t("condFair")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("minPrice")} (EUR)</Label>
                      <Input type="number" value={itemForm.minPrice} onChange={(e) => setItemForm({...itemForm, minPrice: e.target.value})} data-testid="input-item-min-price" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("maxPrice")} (EUR)</Label>
                      <Input type="number" value={itemForm.maxPrice} onChange={(e) => setItemForm({...itemForm, maxPrice: e.target.value})} data-testid="input-item-max-price" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("description")}</Label>
                    <Textarea value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="resize-none" rows={2} data-testid="input-item-description" />
                  </div>
                  <ItemPhotoUploadArea />
                  {showCertPhotos && <CertPhotoUploadArea />}
                  <Button type="submit" className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={addItem.isPending || isUploadingPhoto || isUploadingCert} data-testid="button-submit-item">
                    {addItem.isPending ? "..." : t("addItem")}
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
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {item.photos && item.photos.length > 0 ? (
                        <div className="h-14 w-14 rounded-md overflow-hidden shrink-0 border">
                          <img src={item.photos[0]} alt={item.title} className="h-full w-full object-cover" data-testid={`img-item-${item.id}`} />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Shirt className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium" data-testid={`text-item-title-${item.id}`}>{item.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                          {item.size && <span className="text-xs text-muted-foreground">{t("size")} {item.size}</span>}
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-auto" data-testid={`badge-category-${item.id}`}>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                          {item.condition && <span className="text-xs text-muted-foreground">{conditionLabel(item.condition)}</span>}
                        </div>
                        {item.minPrice && item.maxPrice && (
                          <p className="text-xs text-muted-foreground mt-1">{item.minPrice} - {item.maxPrice} EUR</p>
                        )}
                        {item.salePrice && (
                          <p className="text-xs font-medium text-emerald-600 mt-1">{t("salePrice")}: {item.salePrice} EUR</p>
                        )}
                        {item.photos && item.photos.length > 1 && (
                          <div className="flex gap-1 mt-1.5">
                            {item.photos.slice(1, 4).map((photo: string, idx: number) => (
                              <div key={idx} className="h-8 w-8 rounded overflow-hidden border">
                                <img src={photo} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                            {item.photos.length > 4 && (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{item.photos.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={itemStatusColors[item.status] || ""}>
                      {translateStatus(item.status)}
                    </Badge>
                  </div>

                  {item.sellerCounterOffer && item.status === "pending_approval" && isReusse && (
                    <div className="ml-[4.25rem] flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-1.5 text-xs font-medium">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {t("sellerCounterOfferBadge")}
                    </div>
                  )}

                  {item.status === "returned" && item.declineReason && (
                    <div className="ml-[4.25rem] text-xs text-muted-foreground bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-1.5">
                      <span className="font-medium text-red-600 dark:text-red-400">{t("itemDeclinedReason")}</span> {item.declineReason}
                    </div>
                  )}

                  {isSeller && item.status === "pending_approval" && (
                    <div className="flex flex-wrap gap-2 ml-[4.25rem]">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approveItem.mutate(item.id)} disabled={approveItem.isPending} data-testid={`button-approve-${item.id}`}>
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {t("approvePrice")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCounterOffer(item.id)} data-testid={`button-counter-${item.id}`}>
                        <DollarSign className="h-3.5 w-3.5 mr-1" /> {t("counterOffer")}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setShowDeclineReason(item.id); setDeclineReason(""); }} data-testid={`button-decline-${item.id}`}>
                        <ThumbsDown className="h-3.5 w-3.5 mr-1" /> {t("declineItem")}
                      </Button>
                    </div>
                  )}

                  {showCounterOffer === item.id && (
                    <div className="ml-[4.25rem] p-3 bg-muted rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("minPrice")} (EUR)</Label>
                          <Input type="number" value={counterMin} onChange={(e) => setCounterMin(e.target.value)} data-testid="input-counter-min" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("maxPrice")} (EUR)</Label>
                          <Input type="number" value={counterMax} onChange={(e) => setCounterMax(e.target.value)} data-testid="input-counter-max" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => counterOfferItem.mutate({ itemId: item.id, minPrice: counterMin, maxPrice: counterMax })} disabled={counterOfferItem.isPending} data-testid="button-submit-counter">
                          {t("counterOffer")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCounterOffer(null)}>{t("back")}</Button>
                      </div>
                    </div>
                  )}

                  {showDeclineReason === item.id && (
                    <div className="ml-[4.25rem] p-3 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-2 border border-red-200 dark:border-red-800">
                      <div className="space-y-1">
                        <Label className="text-xs text-red-700 dark:text-red-400">{t("declineReason")}</Label>
                        <Textarea
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder={t("declineReasonPlaceholder")}
                          className="resize-none text-sm"
                          rows={2}
                          data-testid="input-decline-reason"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => declineItem.mutate({ itemId: item.id, reason: declineReason })} disabled={declineItem.isPending || !declineReason.trim()} data-testid="button-confirm-decline">
                          {t("declineItem")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowDeclineReason(null)}>{t("back")}</Button>
                      </div>
                    </div>
                  )}

                  {isReusse && isAssigned && item.status === "approved" && (
                    <div className="flex flex-wrap gap-2 ml-[4.25rem]">
                      <Button size="sm" variant="outline" onClick={() => setShowListItem(item.id)} data-testid={`button-list-${item.id}`}>
                        <Tag className="h-3.5 w-3.5 mr-1" /> {t("markAsListed")}
                      </Button>
                    </div>
                  )}

                  {showListItem === item.id && (
                    <div className="ml-[4.25rem] p-3 bg-muted rounded-lg space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("platformListed")}</Label>
                        <Input value={listPlatform} onChange={(e) => setListPlatform(e.target.value)} placeholder="Vinted, Vestiaire Collective..." data-testid="input-platform" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => listItem.mutate({ itemId: item.id, platformListedOn: listPlatform })} disabled={listItem.isPending} data-testid="button-submit-list">
                          {t("markAsListed")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowListItem(null)}>{t("back")}</Button>
                      </div>
                    </div>
                  )}

                  {isReusse && isAssigned && item.status === "listed" && (
                    <div className="flex flex-wrap gap-2 ml-[4.25rem]">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowMarkSold(item.id)} data-testid={`button-sell-${item.id}`}>
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" /> {t("markAsSold")}
                      </Button>
                    </div>
                  )}

                  {showMarkSold === item.id && (
                    <div className="ml-[4.25rem] p-3 bg-muted rounded-lg space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("salePrice")} (EUR)</Label>
                        <Input type="number" step="0.01" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} placeholder={t("enterSalePrice")} data-testid="input-sale-price" />
                      </div>
                      {soldPrice && parseFloat(soldPrice) > 0 && (
                        <div className="text-xs space-y-1">
                          <p>{t("sellerEarning")}: <span className="font-medium text-emerald-600">{(parseFloat(soldPrice) * 0.8).toFixed(2)} EUR</span></p>
                          <p>{t("reusseEarning")}: <span className="font-medium text-blue-600">{(parseFloat(soldPrice) * 0.2).toFixed(2)} EUR</span></p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markSold.mutate({ itemId: item.id, salePrice: soldPrice })} disabled={markSold.isPending || !soldPrice} data-testid="button-confirm-sold">
                          {t("confirmSold")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowMarkSold(null); setSoldPrice(""); }}>{t("back")}</Button>
                      </div>
                    </div>
                  )}

                  {isReusse && isAssigned && (item.status === "returned" || item.status === "sold" || item.status === "listed" || item.status === "approved" || item.status === "pending_approval") && (
                    <div className="ml-[4.25rem]">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => duplicateItem.mutate(item.id)}
                        disabled={duplicateItem.isPending}
                        data-testid={`button-duplicate-${item.id}`}
                      >
                        <Copy className="h-3 w-3 mr-1" /> {t("duplicateItem")}
                      </Button>
                      {item.status === "returned" && (
                        <p className="text-xs text-muted-foreground mt-1">{t("declinedItemHint")}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shirt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noItemsAdded")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-3">
          {(isReusse && isAssigned) && (
            <Dialog open={showScheduleMeeting} onOpenChange={setShowScheduleMeeting}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid="button-schedule-meeting">
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("scheduleMeeting")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("scheduleMeeting")}</DialogTitle></DialogHeader>
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
                      <Label>{t("date")} *</Label>
                      <Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({...meetingForm, date: e.target.value})} required data-testid="input-meeting-date" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("time")} *</Label>
                      <Input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm({...meetingForm, time: e.target.value})} required data-testid="input-meeting-time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("location")} *</Label>
                    <Input value={meetingForm.location} onChange={(e) => setMeetingForm({...meetingForm, location: e.target.value})} required data-testid="input-meeting-location" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("notes")}</Label>
                    <Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({...meetingForm, notes: e.target.value})} className="resize-none" rows={2} data-testid="input-meeting-notes" />
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white" disabled={scheduleMeeting.isPending} data-testid="button-submit-meeting">
                    {scheduleMeeting.isPending ? "..." : t("scheduleMeeting")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {requestMeetings && requestMeetings.length > 0 ? (
            requestMeetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
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
                      {translateStatus(meeting.status)}
                    </Badge>
                  </div>
                  {meeting.status === "scheduled" && (
                    <div className="flex flex-wrap gap-2 ml-[4.25rem]">
                      <Button size="sm" variant="outline" onClick={() => { setShowReschedule(meeting.id); setRescheduleForm({ date: "", time: "", location: meeting.location }); }} data-testid={`button-reschedule-${meeting.id}`}>
                        <Clock className="h-3.5 w-3.5 mr-1" /> {t("rescheduleMeeting")}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => cancelMeeting.mutate(meeting.id)} disabled={cancelMeeting.isPending} data-testid={`button-cancel-meeting-${meeting.id}`}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> {t("cancelMeeting")}
                      </Button>
                    </div>
                  )}
                  {showReschedule === meeting.id && (
                    <div className="ml-[4.25rem] p-3 bg-muted rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("newDate")}</Label>
                          <Input type="date" value={rescheduleForm.date} onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value})} data-testid="input-reschedule-date" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("newTime")}</Label>
                          <Input type="time" value={rescheduleForm.time} onChange={(e) => setRescheduleForm({...rescheduleForm, time: e.target.value})} data-testid="input-reschedule-time" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("location")}</Label>
                        <Input value={rescheduleForm.location} onChange={(e) => setRescheduleForm({...rescheduleForm, location: e.target.value})} data-testid="input-reschedule-location" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => rescheduleMeeting.mutate({ meetingId: meeting.id, scheduledDate: new Date(`${rescheduleForm.date}T${rescheduleForm.time}`).toISOString(), location: rescheduleForm.location })} disabled={rescheduleMeeting.isPending || !rescheduleForm.date || !rescheduleForm.time} data-testid="button-confirm-reschedule">
                          {t("rescheduleMeeting")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowReschedule(null)} data-testid="button-cancel-reschedule">{t("back")}</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noUpcomingMeetings")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {request.status !== "completed" && request.status !== "cancelled" && (
        <div className="flex flex-wrap gap-3 pt-2">
          {isSeller && (
            <Button variant="destructive" size="sm" onClick={() => cancelRequest.mutate()} disabled={cancelRequest.isPending} data-testid="button-cancel-request">
              <XCircle className="h-4 w-4 mr-1" /> {t("cancelRequest")}
            </Button>
          )}
          {(isSeller || (isReusse && isAssigned)) && request.status === "in_progress" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => completeRequest.mutate()} disabled={completeRequest.isPending} data-testid="button-complete-request">
              <CheckCircle className="h-4 w-4 mr-1" /> {t("completeRequest")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
