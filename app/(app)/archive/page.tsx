import { FilterBar } from "@/components/filter-bar";
import { ItemList } from "@/components/item-list";
import { getSavedItems } from "@/lib/queries";
import type { ItemListFilters } from "@/lib/types";
import { isValidSource } from "@/lib/types";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: ItemListFilters = {
    q: params.q,
    status: "archived",
    source: isValidSource(params.source ?? "") ? params.source as ItemListFilters["source"] : undefined,
    tag: params.tag,
  };

  const items = await getSavedItems(filters);

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Archive</p>
        <h2>Done, not deleted.</h2>
        <p className="muted">
          {items.length} item{items.length !== 1 ? "s" : ""} archived
        </p>
      </section>

      <section className="panel stack">
        <h2>Filter</h2>
        <FilterBar defaults={params} showStatus={false} />
      </section>

      <ItemList
        items={items}
        emptyMessage="Your archive is empty."
      />
    </div>
  );
}
