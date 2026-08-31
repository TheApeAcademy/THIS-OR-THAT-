export interface CommentAuthor {
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

// Card comments have no option_id (no vote sides) or like_count (no
// per-comment likes), so they get their own small, independent tree shape
// rather than being forced into CommentNode/FlatComment above.
export interface CardCommentNode {
  id: string;
  body: string;
  createdAt: string;
  author: CommentAuthor;
  replies: CardCommentNode[];
}

export interface FlatCardComment {
  id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export function buildCardCommentTree(flat: FlatCardComment[]): CardCommentNode[] {
  const nodes = new Map<string, CardCommentNode>();

  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      body: c.body,
      createdAt: c.created_at,
      author: {
        username: c.profiles?.username ?? "unknown",
        avatarUrl: c.profiles?.avatar_url ?? null,
      },
      replies: [],
    });
  }

  const topLevel: CardCommentNode[] = [];
  for (const c of flat) {
    const node = nodes.get(c.id)!;
    if (c.parent_comment_id) {
      nodes.get(c.parent_comment_id)?.replies.push(node);
    } else {
      topLevel.push(node);
    }
  }
  return topLevel;
}
