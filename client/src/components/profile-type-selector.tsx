import { Card } from "@/components/ui/card";
import { Store, Handshake } from "lucide-react";

export type ProfileType = "seller" | "marchand";

interface ProfileTypeSelectorProps {
  onSelect: (type: ProfileType) => void;
  selected?: ProfileType;
}

export function ProfileTypeSelector({ onSelect, selected }: ProfileTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">What best describes you?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your profile type to get started
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Seller Option */}
        <Card
          onClick={() => onSelect("seller")}
          className={`p-6 cursor-pointer transition-all border-2 ${
            selected === "seller"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <Store className="w-10 h-10 text-primary" />
            <div>
              <h3 className="font-semibold">I want to Sell</h3>
              <p className="text-sm text-muted-foreground mt-1">
                I have items to sell
              </p>
            </div>
          </div>
        </Card>

        {/* Marchand Option */}
        <Card
          onClick={() => onSelect("marchand")}
          className={`p-6 cursor-pointer transition-all border-2 ${
            selected === "marchand"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <Handshake className="w-10 h-10 text-primary" />
            <div>
              <h3 className="font-semibold">I want to Help Sell</h3>
              <p className="text-sm text-muted-foreground mt-1">
                I want to fulfill requests from sellers
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
