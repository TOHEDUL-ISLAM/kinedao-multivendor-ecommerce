import { useState, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BD_DISTRICTS, type BDDistrict } from "@kineDao.com/api-types/vendor";
import { useTranslation } from "@/hooks/use-translation";

interface DistrictSelectProps {
  value?: string;
  onChange: (value: BDDistrict) => void;
  error?: string;
  disabled?: boolean;
}

export function DistrictSelect({ value, onChange, error, disabled }: DistrictSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDistricts = useMemo((): readonly BDDistrict[] => {
    if (!search) return BD_DISTRICTS;
    const lower = search.toLowerCase();
    return BD_DISTRICTS.filter((d: BDDistrict) => d.toLowerCase().includes(lower));
  }, [search]);

  const handleSelect = (district: BDDistrict) => {
    onChange(district);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm ring-offset-background form-transition",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:ring-destructive"
        )}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || t("vendor.form.address.selectDistrict")}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
          />

          {/* Dropdown */}
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            {/* Search input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("vendor.form.address.searchDistrict")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>

            {/* District list */}
            <div
              className="max-h-60 overflow-y-auto overscroll-contain p-1"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }}
            >
              {filteredDistricts.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t("vendor.form.address.noDistrictFound")}
                </div>
              ) : (
                filteredDistricts.map((district: BDDistrict) => (
                  <button
                    key={district}
                    type="button"
                    onClick={() => handleSelect(district)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      value === district && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span>{district}</span>
                    {value === district && <Check className="h-4 w-4" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
