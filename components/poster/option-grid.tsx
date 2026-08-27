"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Option<T extends string> = { id: T; label: string };

type OptionGridProps<T extends string> = {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
};

/** Single-select option set laid out as a grid of toggles. */
export function OptionGrid<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
}: OptionGridProps<T>) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      value={[value]}
      onValueChange={(next) => {
        // Base UI clears the array when the active item is pressed again;
        // a layout always has to be chosen, so keep the current one.
        const [picked] = next;
        if (picked) onChange(picked as T);
      }}
      className={cn(
        "grid w-full gap-1.5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
      )}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.id}
          value={option.id}
          className="justify-start truncate px-2.5 font-normal aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
