export interface CommentAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface CommentNode {
  id: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentNode[];
}

export interface FlatComment {
  id: string;
  body: string;
  option_id: string;
  parent_comment_id: string | null;
  like_count: number;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export function buildCommentTree(
  flat: FlatComment[],
  likedIds: Set<string>
): Record<string, CommentNode[]> {
  const nodes = new Map<string, CommentNode>();

  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      body: c.body,
      likeCount: c.like_count,
      likedByMe: likedIds.has(c.id),
      createdAt: c.created_at,
      author: {
        id: c.user_id,
        username: c.profiles?.username ?? "unknown",
        avatarUrl: c.profiles?.avatar_url ?? null,
      },
      replies: [],
    });
  }

  const topLevelByOption: Record<string, CommentNode[]> = {};

  for (const c of flat) {
    const node = nodes.get(c.id)!;
    if (c.parent_comment_id) {
      nodes.get(c.parent_comment_id)?.replies.push(node);
    } else {
      (topLevelByOption[c.option_id] ??= []).push(node);
    }
  }

  return topLevelByOption;
}
