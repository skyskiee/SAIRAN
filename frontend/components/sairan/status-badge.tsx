import { statusBadgeClass, statusLabel } from "@/lib/sairan-api";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusBadgeClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
