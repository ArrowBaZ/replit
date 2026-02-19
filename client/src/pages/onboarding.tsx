import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Star, ArrowRight, ArrowLeft } from "lucide-react";
import sellzyLogo from "@assets/sellzy_logo_bold_green_1771510604189.png";

type Role = "seller" | "reusse";

const departments = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
  "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Etienne",
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    department: "",
    bio: "",
    experience: "",
    siretNumber: "",
    preferredContactMethod: "email",
  });

  const createProfile = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile created!", description: role === "reusse" ? "Your application is being reviewed." : "Welcome to Sellzy!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create profile. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    createProfile.mutate({
      role,
      ...formData,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={sellzyLogo} alt="Sellzy" className="h-10" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-2" data-testid="text-onboarding-title">
            Welcome to Sellzy
          </h1>
          <p className="text-muted-foreground text-sm">
            {user?.firstName ? `Hi ${user.firstName}! ` : ""}Let's set up your profile.
          </p>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-all hover-elevate ${role === "seller" ? "ring-2 ring-[hsl(var(--success))]" : ""}`}
              onClick={() => setRole("seller")}
              data-testid="card-role-seller"
            >
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-md bg-[hsl(var(--success)/0.1)] flex items-center justify-center mx-auto mb-4">
                  <Shirt className="h-6 w-6 text-[hsl(var(--success))]" />
                </div>
                <h3 className="font-semibold mb-1">I'm a Seller</h3>
                <p className="text-xs text-muted-foreground">I have clothes to sell and want expert help.</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover-elevate ${role === "reusse" ? "ring-2 ring-[hsl(var(--success))]" : ""}`}
              onClick={() => setRole("reusse")}
              data-testid="card-role-reusse"
            >
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">I'm a Reusse</h3>
                <p className="text-xs text-muted-foreground">I'm a resale expert looking for items to sell.</p>
              </CardContent>
            </Card>

            <div className="col-span-2 mt-2">
              <Button
                className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                disabled={!role}
                onClick={() => setStep(2)}
                data-testid="button-continue-role"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Button size="icon" variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="font-semibold">Contact Information</h3>
                <p className="text-xs text-muted-foreground">Step 2 of {role === "reusse" ? "3" : "2"}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Rue Example"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  data-testid="input-address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    data-testid="input-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="75001"
                    value={formData.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    data-testid="input-postal-code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department / Region</Label>
                <Select value={formData.department} onValueChange={(v) => updateField("department", v)}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                onClick={() => role === "reusse" ? setStep(3) : handleSubmit()}
                disabled={createProfile.isPending}
                data-testid="button-continue-contact"
              >
                {role === "reusse" ? "Continue" : createProfile.isPending ? "Creating..." : "Complete Setup"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && role === "reusse" && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Button size="icon" variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="font-semibold">Professional Details</h3>
                <p className="text-xs text-muted-foreground">Step 3 of 3</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell sellers about yourself and your experience..."
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-bio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Resale Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Describe your experience in fashion resale..."
                  value={formData.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET Number (optional)</Label>
                <Input
                  id="siret"
                  placeholder="123 456 789 00001"
                  value={formData.siretNumber}
                  onChange={(e) => updateField("siretNumber", e.target.value)}
                  data-testid="input-siret"
                />
                <p className="text-xs text-muted-foreground">You can add this later if you don't have one yet.</p>
              </div>
              <Button
                className="w-full bg-[hsl(var(--success))] border-[hsl(var(--success))] text-white"
                onClick={handleSubmit}
                disabled={createProfile.isPending}
                data-testid="button-complete-setup"
              >
                {createProfile.isPending ? "Submitting..." : "Submit Application"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your application will be reviewed by our team. You'll be notified once approved.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
