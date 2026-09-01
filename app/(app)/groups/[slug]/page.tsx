import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { JoinGroupButton } from "@/components/JoinGroupButton";
import { CreateGroupDebateForm } from "@/components/CreateGroupDebateForm";
import { GroupWall, type GroupWallPost } from "@/components/GroupWall";

export const dynamic = "force-dynamic";

interface RawPost {
  id: string;
  body: string;
  created_at: string;
  like_count: number;
  author: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
}

interface RawComment {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  author: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
}

export default async function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, slug, name, description, avatar_url, member_count, debate_wins, debate_losses")
    .eq("slug", slug)
    .maybeSingle();
  if (!group) notFound();

  const [{ data: membership }, { data: postsRaw }, { data: myLikes }, { data: categories }] = await Promise.all([
    user
      ? supabase.from("group_members").select("user_id").eq("group_id", group.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("group_posts")
      .select(
        "id, body, created_at, like_count, author:profiles!group_posts_user_id_fkey(username, avatar_url, profile_photo_url)"
      )
      .eq("group_id", group.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<RawPost[]>(),
    user
      ? supabase.from("group_post_likes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    supabase.from("categories").select("id, label, emoji").eq("is_active", true).order("sort_order"),
  ]);

  const postIds = (postsRaw ?? []).map((p) => p.id);
  const { data: commentsRaw } = postIds.length
    ? await supabase
        .from("group_post_comments")
        .select(
          "id, post_id, body, created_at, author:profiles!group_post_comments_user_id_fkey(username, avatar_url, profile_photo_url)"
        )
        .in("post_id", postIds)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .returns<RawComment[]>()
    : { data: [] as RawComment[] };

  const likedPostIds = new Set((myLikes ?? []).map((l) => l.post_id));
  const commentsByPost = new Map<string, RawComment[]>();
  for (const c of commentsRaw ?? []) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push(c);
    commentsByPost.set(c.post_id, list);
  }

  const posts: GroupWallPost[] = (postsRaw ?? []).map((p) => ({
    id: p.id,
    body: p.body,
    createdAt: p.created_at,
    likeCount: p.like_count,
    likedByMe: likedPostIds.has(p.id),
    author: {
      username: p.author?.username ?? "unknown",
      avatarUrl: p.author?.profile_photo_url ?? p.author?.avatar_url ?? null,
    },
    comments: (commentsByPost.get(p.id) ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      author: {
        username: c.author?.username ?? "unknown",
        avatarUrl: c.author?.profile_photo_url ?? c.author?.avatar_url ?? null,
      },
    })),
  }));

  const isMember = !!membership;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-4">
      <div className="flex items-center gap-3">
        <Avatar name={group.name} src={group.avatar_url} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text-primary">{group.name}</h1>
          <p className="text-xs text-text-secondary">
            {group.member_count} member{group.member_count === 1 ? "" : "s"}
            {group.debate_wins + group.debate_losses > 0 ? ` · ${group.debate_wins}-${group.debate_losses} in debates` : ""}
          </p>
        </div>
        <JoinGroupButton groupId={group.id} initialIsMember={isMember} viewerId={user?.id ?? null} />
      </div>

      {group.description && <p className="text-sm text-text-secondary">{group.description}</p>}

      <CreateGroupDebateForm groupId={group.id} categories={categories ?? []} />

      <div>
        <p className="mb-3 text-lg font-semibold text-text-primary">Wall</p>
        <GroupWall groupId={group.id} initialPosts={posts} canPost={isMember} />
      </div>
    </div>
  );
}
