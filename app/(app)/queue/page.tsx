import { ItemList } from "@/components/item-list";
import { getSavedItems } from "@/lib/queries";

export default async function QueuePage() {
  const items = await getSavedItems({ status: "read_next" });

  return (
    <div className="stack">
      <section className="hero">
        <p className="muted">Read Next</p>
        <h2>A short queue beats an endless backlog.</h2>
        <p>Use this list as the deliberate subset you actually plan to read soon.</p>
      </section>

      <ItemList items={items} emptyMessage="Nothing is queued yet. Promote a few inbox items to read_next." />
    </div>
  );
}
