import type { SavedItemRow } from "@/lib/types";
import { ItemCard } from "@/components/item-card";

export function ItemList({ items, emptyMessage }: { items: SavedItemRow[]; emptyMessage: string }) {
  if (!items.length) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
