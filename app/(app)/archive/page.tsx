import { ItemList } from "@/components/item-list";
import { getSavedItems } from "@/lib/queries";

export default async function ArchivePage() {
  const items = await getSavedItems({ status: "archived" });

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Archive</p>
        <h2>Keep history without keeping clutter.</h2>
        <p>Completed or no-longer-relevant items can move here without losing notes, tags, or source context.</p>
      </section>

      <ItemList items={items} emptyMessage="Your archive is empty right now." />
    </div>
  );
}
