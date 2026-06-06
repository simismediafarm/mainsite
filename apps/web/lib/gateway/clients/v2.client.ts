export const v2Client = {
  feed: () => fetch("/api/v2/feed").then((r) => r.json()),
  content: (slug: string) => fetch(`/api/v2/content/${slug}`).then((r) => r.json()),
};
