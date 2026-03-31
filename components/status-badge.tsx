import { cn, formatStatusLabel } from "@/lib/utils";
import type { ItemStatus } from "@/lib/types";

const STATUS_CLASSES: Record<ItemStatus, string> = {
  inbox: "status-badge--inbox",
  read_next: "status-badge--read-next",
  reading: "status-badge--reading",
  completed: "status-badge--completed",
  reference: "status-badge--reference",
  archived: "status-badge--archived",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={cn("status-badge", STATUS_CLASSES[status])}>
      {formatStatusLabel(status)}
    </span>
  );
}
