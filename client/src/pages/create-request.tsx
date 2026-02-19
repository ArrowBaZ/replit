import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { ArrowLeft, Package, Zap, Sparkles } from "lucide-react";

export default function CreateRequestPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    itemCount: "",
    estimatedValue: "",
    meetingLocation: "",
    notes: "",
  });

  const serviceTypes = [
    {
      value: "classic",
      label: t("classic"),
      description: t("classicDesc"),
      icon: Package,
      color: "bg-primary/10 text-primary",
    },
    {
      value: "express",
      label: t("express"),
      description: t("expressDesc"),
      icon: Zap,
      color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    {
      value: "sos_dressing",
      label: t("sosDressing"),
      description: t("sosDressingDesc"),
      icon: Sparkles,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("requestCreated"), description: t("resellerMatchedSoon") });
      setLocation(`/requests/${data.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: t("error"), description: t("failedCreateRequest"), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.itemCount) return;
    createRequest.mutate({
      serviceType: selectedType,
      itemCount: parseInt(formData.itemCount),
      estimatedValue: formData.estimatedValue || null,
      meetingLocation: formData.meetingLocation || null,
      notes: formData.notes || null,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => setLocation("/dashboard")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-create-request-title">{t("newRequestTitle")}</h1>
          <p className="text-sm text-muted-foreground">Tell us about your items and preferred service.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("serviceType")}</Label>
          <div className="grid gap-3">
            {serviceTypes.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover-elevate ${selectedType === type.value ? "ring-2 ring-[hsl(var(--success))]" : ""}`}
                onClick={() => setSelectedType(type.value)}
                data-testid={`card-service-${type.value}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${type.color}`}>
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemCount">{t("numberOfItems")} *</Label>
            <Input
              id="itemCount"
              type="number"
              min="1"
              placeholder="10"
              value={formData.itemCount}
              onChange={(e) => updateField("itemCount", e.target.value)}
              required
              data-testid="input-item-count"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">{t("estimatedValue")} (EUR)</Label>
            <Input
              id="estimatedValue"
              type="number"
              min="0"
              placeholder="500"
              value={formData.estimatedValue}
              onChange={(e) => updateField("estimatedValue", e.target.value)}
              data-testid="input-estimated-value"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingLocation">{t("meetingLocation")}</Label>
          <Input
            id="meetingLocation"
            placeholder={t("locationPlaceholder")}
            value={formData.meetingLocation}
            onChange={(e) => updateField("meetingLocation", e.target.value)}
            data-testid="input-meeting-location"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">{t("additionalNotes")}</Label>
          <Textarea
            id="notes"
            placeholder={t("notesPlaceholder")}
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="resize-none"
            rows={3}
            data-testid="input-notes"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
          disabled={!selectedType || !formData.itemCount || createRequest.isPending}
          data-testid="button-submit-request"
        >
          {createRequest.isPending ? t("submitting") : t("submitRequest")}
        </Button>
      </form>
    </div>
  );
}
