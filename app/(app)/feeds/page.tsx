import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomFeedsAction } from "@/lib/actions/customFeeds";
import { getFollowedTopicsAction } from "@/lib/actions/topics";
import { CustomFeedManager } from "@/components/CustomFeedManager";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [feeds, followedTopics] = await Promise.all([getCustomFeedsAction(), getFollowedTopicsAction()]);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">My Feeds</h1>
      <CustomFeedManager initialFeeds={feeds} followedTopics={followedTopics} />
    </div>
  );
}
