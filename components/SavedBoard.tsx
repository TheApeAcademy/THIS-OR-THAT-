"use client";

import { useMemo, useState, useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { Tabs } from "@/components/ui/Tabs";
import { voteAction } from "@/lib/actions/vote";
import {
  createCollectionAction,
  deleteCollectionAction,
  moveBookmarkAction,
  toggleSaveComparisonAction,
} from "@/lib/actions/saves";

export interface SavedCollection {
  id: string;
  name: string;
}

export interface SavedItem {
  card: ComparisonCardData;
  collectionId: string | null;
}

const ALL_TAB = "all";

export function SavedBoard({
  initialCollections,
  initialItems,
}: {
  initialCollections: SavedCollection[];
  initialItems: SavedItem[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState(ALL_TAB);
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [, startTransition] = useTransition();

  const tabOptions = useMemo(
    () => [{ value: ALL_TAB, label: "All saved" }, ...collections.map((c) => ({ value: c.id, label: c.name }))],
    [collections]
  );

  const visibleItems = tab === ALL_TAB ? items : items.filter((i) => i.collectionId === tab);

  const handleVote = (comparisonId: string, optionId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.card.id === comparisonId ? { ...i, card: { ...i.card, votedOptionId: optionId } } : i))
    );
    startTransition(async () => {
      await voteAction(comparisonId, optionId).catch(() => {});
    });
  };

  const handleRemove = (comparisonId: string) => {
    setItems((prev) => prev.filter((i) => i.card.id !== comparisonId));
    startTransition(async () => {
      await toggleSaveComparisonAction(comparisonId, false).catch(() => {});
    });
  };

  const handleMove = (comparisonId: string, collectionId: string | null) => {
    setItems((prev) => prev.map((i) => (i.card.id === comparisonId ? { ...i, collectionId } : i)));
    startTransition(async () => {
      await moveBookmarkAction(comparisonId, collectionId).catch(() => {});
    });
  };

  const handleCreateCollection = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const created = await createCollectionAction(trimmed).catch(() => null);
      if (created) {
        setCollections((prev) => [...prev, { id: created.id, name: created.name }]);
        setTab(created.id);
      }
    });
    setNewName("");
    setShowNewForm(false);
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    setItems((prev) => prev.map((i) => (i.collectionId === collectionId ? { ...i, collectionId: null } : i)));
    if (tab === collectionId) setTab(ALL_TAB);
    startTransition(async () => {
      await deleteCollectionAction(collectionId).catch(() => {});
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Tabs options={tabOptions} value={tab} onChange={setTab} />
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="tap-scale shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-text-secondary"
        >
          + New
        </button>
      </div>

      {showNewForm && (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateCollection}
            className="tap-scale shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast"
          >
            Create
          </button>
        </div>
      )}

      {tab !== ALL_TAB && (
        <button
          type="button"
          onClick={() => handleDeleteCollection(tab)}
          className="text-xs font-medium text-danger underline"
        >
          Delete this collection
        </button>
      )}

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-lg font-semibold text-text-primary">Nothing saved here yet</p>
          <p className="text-sm text-text-secondary">Tap the save icon on any debate to bookmark it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <div key={item.card.id} className="space-y-2">
              <ComparisonCard comparison={item.card} onVote={(optionId) => handleVote(item.card.id, optionId)} />
              <div className="flex items-center justify-between gap-2 px-1">
                <select
                  value={item.collectionId ?? ""}
                  onChange={(e) => handleMove(item.card.id, e.target.value || null)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary outline-none focus:border-accent"
                >
                  <option value="">No collection</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(item.card.id)}
                  className="text-xs font-medium text-text-secondary underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
