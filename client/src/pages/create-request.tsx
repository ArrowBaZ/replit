import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { ArrowLeft, ArrowRight, Package, Zap, Sparkles, Check } from "lucide-react";

const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"] as const;
const CONDITIONS = ["new_with_tags", "like_new", "good", "fair"] as const;

export default function CreateRequestPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [formData, setFormData] = useState({
    itemCount: "",
    estimatedValue: "",
    brands: "",
    meetingLocation: "",
    preferredDateStart: "",
    preferredDateEnd: "",
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

  const categoryLabels: Record<string, string> = {
    tops: t("catTops"),
    bottoms: t("catBottoms"),
    dresses: t("catDresses"),
    outerwear: t("catOuterwear"),
    shoes: t("catShoes"),
    accessories: t("catAccessories"),
  };

  const conditionLabels: Record<string, string> = {
    new_with_tags: t("condNew"),
    like_new: t("condLikeNew"),
    good: t("condGood"),
    fair: t("condFair"),
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

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

  const handleSubmit = () => {
    if (!selectedType || !formData.itemCount) return;
    createRequest.mutate({
      serviceType: selectedType,
      itemCount: parseInt(formData.itemCount),
      estimatedValue: formData.estimatedValue || null,
      categories: selectedCategories.length > 0 ? selectedCategories : null,
      condition: selectedCondition || null,
      brands: formData.brands || null,
      meetingLocation: formData.meetingLocation || null,
      preferredDateStart: formData.preferredDateStart || null,
      preferredDateEnd: formData.preferredDateEnd || null,
      notes: formData.notes || null,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedType;
    if (step === 2) return !!formData.itemCount;
    return true;
  };

  const totalSteps = 4;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setLocation("/dashboard")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" data-testid="text-create-request-title">{t("newRequestTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("step")} {step} / {totalSteps}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-[hsl(var(--success))]" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  {selectedType === type.value && (
                    <Check className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">{t("itemCategories")}</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategories.includes(cat) ? "default" : "outline"}
                  className={`cursor-pointer text-sm py-1.5 px-3 ${selectedCategories.includes(cat) ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]" : ""}`}
                  onClick={() => toggleCategory(cat)}
                  data-testid={`badge-category-${cat}`}
                >
                  {categoryLabels[cat]}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">{t("overallCondition")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((cond) => (
                <Card
                  key={cond}
                  className={`cursor-pointer transition-all ${selectedCondition === cond ? "ring-2 ring-[hsl(var(--success))]" : ""}`}
                  onClick={() => setSelectedCondition(cond)}
                  data-testid={`card-condition-${cond}`}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-sm font-medium">{conditionLabels[cond]}</p>
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
            <Label htmlFor="brands">{t("brandsOwned")}</Label>
            <Input
              id="brands"
              placeholder={t("brandsPlaceholder")}
              value={formData.brands}
              onChange={(e) => updateField("brands", e.target.value)}
              data-testid="input-brands"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDateStart">{t("preferredDateFrom")}</Label>
              <Input
                id="preferredDateStart"
                type="date"
                value={formData.preferredDateStart}
                onChange={(e) => updateField("preferredDateStart", e.target.value)}
                data-testid="input-date-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredDateEnd">{t("preferredDateTo")}</Label>
              <Input
                id="preferredDateEnd"
                type="date"
                value={formData.preferredDateEnd}
                onChange={(e) => updateField("preferredDateEnd", e.target.value)}
                data-testid="input-date-end"
              />
            </div>
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
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">{t("reviewRequest")}</Label>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("serviceType")}</span>
                <span className="text-sm font-medium">{serviceTypes.find((s) => s.value === selectedType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("numberOfItems")}</span>
                <span className="text-sm font-medium">{formData.itemCount}</span>
              </div>
              {selectedCategories.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">{t("itemCategories")}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedCategories.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{categoryLabels[c]}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedCondition && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("condition")}</span>
                  <span className="text-sm font-medium">{conditionLabels[selectedCondition]}</span>
                </div>
              )}
              {formData.brands && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("brand")}</span>
                  <span className="text-sm font-medium">{formData.brands}</span>
                </div>
              )}
              {formData.estimatedValue && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("estimatedValue")}</span>
                  <span className="text-sm font-medium">{formData.estimatedValue} EUR</span>
                </div>
              )}
              {formData.meetingLocation && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("meetingLocation")}</span>
                  <span className="text-sm font-medium">{formData.meetingLocation}</span>
                </div>
              )}
              {(formData.preferredDateStart || formData.preferredDateEnd) && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("preferredDates")}</span>
                  <span className="text-sm font-medium">
                    {formData.preferredDateStart && new Date(formData.preferredDateStart).toLocaleDateString("fr-FR")}
                    {formData.preferredDateStart && formData.preferredDateEnd && " - "}
                    {formData.preferredDateEnd && new Date(formData.preferredDateEnd).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {formData.notes && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">{t("notes")}</span>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)} data-testid="button-prev-step">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("back")}
          </Button>
        )}
        {step < totalSteps ? (
          <Button
            className="flex-1 bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
            disabled={!canGoNext()}
            onClick={() => setStep(step + 1)}
            data-testid="button-next-step"
          >
            {t("continue")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="flex-1 bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
            disabled={createRequest.isPending}
            onClick={handleSubmit}
            data-testid="button-submit-request"
          >
            {createRequest.isPending ? t("submitting") : t("submitRequest")}
          </Button>
        )}
      </div>
    </div>
  );
}
