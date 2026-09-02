import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { CreateGroupForm } from "@/components/CreateGroupForm";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("id, slug, name, avatar_url, member_count, debate_wins, debate_losses")
    .order("member_count", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Groups</h1>
      <p className="text-sm text-text-secondary">
        Join a fan club, banter on its wall, and back it in group-vs-group debates.
      </p>

      <CreateGroupForm />

      <div className="space-y-2">
        {(groups ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">No groups yet - start the first one.</p>
        ) : (
          (groups ?? []).map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.slug}`}
              className="tap-scale flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3"
            >
              <Avatar name={g.name} src={g.avatar_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{g.name}</p>
                <p className="text-xs text-text-secondary">
                  {g.member_count} member{g.member_count === 1 ? "" : "s"}
                  {g.debate_wins + g.debate_losses > 0 ? ` · ${g.debate_wins}-${g.debate_losses} in debates` : ""}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
