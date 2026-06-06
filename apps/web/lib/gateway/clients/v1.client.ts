export const v1Client = {
  feed: () => fetch("/api/mvp/feed").then((r) => r.json()),
  content: (slug: string) => fetch(`/api/mvp/content/${slug}`).then((r) => r.json()),
};
