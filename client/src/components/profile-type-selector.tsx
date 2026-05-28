import { Store, Handshake, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ProfileType = "seller" | "marchand";

interface ProfileTypeSelectorProps {
  onSelect: (type: ProfileType) => void;
  selected?: ProfileType;
}

const options = [
  {
    type: "seller" as ProfileType,
    icon: Store,
    labelKey: "sellerOption",
    descKey: "sellerOptionDesc",
    badge: "🛍️",
  },
  {
    type: "marchand" as ProfileType,
    icon: Handshake,
    labelKey: "marchandOption",
    descKey: "marchandOptionDesc",
    badge: "🤝",
  },
];

export function ProfileTypeSelector({ onSelect, selected }: ProfileTypeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(({ type, icon: Icon, labelKey, descKey }) => {
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              data-testid={`profile-type-${type}`}
              className={`relative text-left rounded-xl border-2 p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(145,63%,42%)] ${
                isSelected
                  ? "border-[hsl(145,63%,42%)] bg-[hsl(145,63%,42%)]/[0.06]"
                  : "border-border bg-card hover:border-[hsl(145,63%,42%)]/50 hover:bg-muted/40"
              }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[hsl(145,63%,42%)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  isSelected
                    ? "bg-[hsl(145,63%,42%)]/15 text-[hsl(145,63%,32%)]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <p className={`text-sm font-semibold mb-0.5 ${isSelected ? "text-foreground" : "text-foreground"}`}>
                {t(labelKey)}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">{t(descKey)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
