import { FilterBar } from "@/components/filter-bar";
import { ItemList } from "@/components/item-list";
import { getSavedItems } from "@/lib/queries";
import type { ItemListFilters } from "@/lib/types";
import { isValidSource } from "@/lib/types";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: ItemListFilters = {
    q: params.q,
    status: "read_next",
    source: isValidSource(params.source ?? "") ? params.source as ItemListFilters["source"] : undefined,
    tag: params.tag,
  };

  const items = await getSavedItems(filters);

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Read Next</p>
        <h2>A short queue beats an endless backlog.</h2>
        <p className="muted">
          {items.length} item{items.length !== 1 ? "s" : ""} queued
        </p>
      </section>

      <section className="panel stack">
        <h2>Filter</h2>
        <FilterBar defaults={params} showStatus={false} />
      </section>

      <ItemList
        items={items}
        emptyMessage="Nothing queued. Promote items from the inbox."
      />
    </div>
  );
}
