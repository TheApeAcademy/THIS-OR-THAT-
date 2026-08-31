const MENTION_SPLIT = /(@[a-z0-9_]{3,20})/gi;
const MENTION_TEST = /^@[a-z0-9_]{3,20}$/i;

export function MentionText({ text }: { text: string }) {
  const parts = text.split(MENTION_SPLIT);
  return (
    <>
      {parts.map((part, i) =>
        MENTION_TEST.test(part) ? (
          <span key={i} className="font-semibold text-accent">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
