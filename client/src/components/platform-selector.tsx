import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PLATFORMS = ["Leboncoin", "Vinted", "Ricardo", "Wallapop"] as const;

export interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
  disabled?: boolean;
  testId?: string;
}

export function PlatformSelector({
  selectedPlatforms,
  onChange,
  disabled = false,
  testId = "platform-selector",
}: PlatformSelectorProps) {
  const togglePlatform = (platform: string) => {
    const newSelection = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    onChange(newSelection);
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      {PLATFORMS.map((platform) => (
        <div key={platform} className="flex items-center space-x-2">
          <Checkbox
            id={`platform-${platform.toLowerCase()}`}
            checked={selectedPlatforms.includes(platform)}
            onCheckedChange={() => togglePlatform(platform)}
            disabled={disabled}
            data-testid={`checkbox-platform-${platform}`}
          />
          <Label
            htmlFor={`platform-${platform.toLowerCase()}`}
            className="text-sm font-normal cursor-pointer"
          >
            {platform}
          </Label>
        </div>
      ))}
    </div>
  );
}
