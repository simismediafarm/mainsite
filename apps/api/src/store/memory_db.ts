import { Post, Profile, CreatePostDTO, SSEEvent, PostStatus } from '@simis/shared';
import { randomUUID } from 'crypto';

export class MemoryDB {
  private profiles: Map<string, Profile> = new Map();
  private posts: Map<string, Post> = new Map();
  private subscribers: Set<(event: SSEEvent) => void> = new Set();

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed Profiles
    const author1: Profile = {
      id: 'system-admin',
      name: 'Simis Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'Lead Platform Architect at SIMIS MediaFarm. Exploring the intersection of design and data engines.',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    const author2: Profile = {
      id: 'sarah-drasner',
      name: 'Sarah Drasner',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'VP of Developer Experience, web creator, and open-source advocate. Focused on frontend performance.',
      role: 'editor',
      createdAt: new Date().toISOString()
    };
    const author3: Profile = {
      id: 'alex-chen',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'Systems engineer specializing in high-performance backends and real-time streaming architectures.',
      role: 'author',
      createdAt: new Date().toISOString()
    };
    const author4: Profile = {
      id: 'emma-watson',
      name: 'Emma Watson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: 'UX researcher and typography writer. Believes in clean spaces and distraction-free reading.',
      role: 'author',
      createdAt: new Date().toISOString()
    };

    this.profiles.set(author1.id, author1);
    this.profiles.set(author2.id, author2);
    this.profiles.set(author3.id, author3);
    this.profiles.set(author4.id, author4);

    // Seed Posts with rich Markdown content
    const post1: Post = {
      id: 'art-of-simplicity',
      title: 'The Art of Simplicity in Software Engineering',
      excerpt: 'Why keeping systems simple is the hardest but most rewarding architectural discipline.',
      content: `# The Art of Simplicity in Software Engineering

Complexity is the enemy of reliability. In modern software engineering, we often find ourselves adding layers of abstraction, multi-agent frameworks, and distributed graph systems before we even understand our core business model.

This is a mistake. 

## The Cost of Over-Engineering

Every line of code you write is a liability. It requires maintenance, onboarding, testing, and debugging. When you add unnecessary abstractions:
1. **Cognitive Load Increases:** Devs spend more time understanding the framework than writing business logic.
2. **Surface Area for Bugs Widens:** More components mean more points of failure.
3. **Slower Onboarding:** New engineers take weeks instead of days to ship their first feature.

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

### A Practical Rule of Thumb

Before you introduce a new dependency, a message queue, or a microservice architecture, ask yourself:
*Can we build this as a simple, single-threaded function?*
*Can we store this in-memory or in a basic database table first?*

Often, the answer is yes. Simplicity is a discipline. Keep your architecture simple, focus on your content, and only scale when the metrics demand it.`,
      authorId: author3.id,
      author: author3,
      tags: ['Engineering', 'Architecture', 'Simplicity'],
      createdAt: Date.now() - 3 * 3600000, // 3 hours ago
      readingTime: 3,
      likes: 42,
      views: 1250,
      sourceType: 'manual',
      status: 'monetized',
      trustScore: 0.95,
      impressions: 12000,
      clicks: 145,
      ctr: 0.012,
      rpmReal: 4.5,
      cpmReal: 3.2,
      revenueTotal: 54.0,
    };

    const post2: Post = {
      id: 'readability-ux',
      title: 'Design Principles for Ultra-Readable Experiences',
      excerpt: 'How we leverage typography, vertical rhythm, and focus modes to make reading digital content a pleasure.',
      content: `# Design Principles for Ultra-Readable Experiences

When we read on screens, our eyes are constantly fighting distractions: notification badges, sidebars, blinking advertisements, and crowded layouts. 

To create a premium reading platform, we must treat the screen like a printed page.

## 1. The Power of Single Column Width

A reader should never have to turn their head or scan wide lines of text. Studies show the optimal line length for readability is **50–75 characters per line** (including spaces). 
In web design, this translates to a content column max-width of around **680px**. Anything wider causes eye fatigue as the reader struggles to find the beginning of the next line.

## 2. Typography and Scale

Use system fonts or carefully curated humanist typefaces. 
* **UI/Controls:** Clean, geometric sans-serif fonts.
* **Body Text:** A highly readable sans-serif or serif font with a generous size (**16px to 20px**) and line height (**1.7**).

\`\`\`css
article {
  max-width: 680px;
  margin: 0 auto;
  font-size: 18px;
  line-height: 1.7;
}
\`\`\`

## 3. Vertical Rhythm and White Space

Let your content breathe. Generous vertical spacing between paragraphs, headings, and quotes guides the eye naturally through the narrative. Remove all sidebar clutter. When a user reads an article, the only thing on screen should be the words they are reading.`,
      authorId: author4.id,
      author: author4,
      tags: ['Design', 'UX', 'Typography'],
      createdAt: Date.now() - 24 * 3600000, // 1 day ago
      readingTime: 4,
      likes: 128,
      views: 5430,
      sourceType: 'manual',
      status: 'monetized',
      trustScore: 0.9,
      impressions: 48000,
      clicks: 890,
      ctr: 0.018,
      rpmReal: 6.2,
      cpmReal: 4.8,
      revenueTotal: 154.0,
    };

    const post3: Post = {
      id: 'why-simis-mediafarm',
      title: 'Why We Transitioned to a Content-First Media Platform',
      excerpt: 'A retrospective on moving SIMIS from complex agent orchestration to simple web delivery.',
      content: `# Why We Transitioned to a Content-First Media Platform

For months, the SIMIS ecosystem was designed around GNNs, Reinforcement Learning loops, and real-time multi-agent decision kernels. It looked impressive on architectural diagrams, but it lacked one critical ingredient: **a usable interface for real people**.

Today, we are launching the new SIMIS MediaFarm MVP.

## Returning to First Principles

We realized that our primary value isn't the complexity of the intelligence layers; it is the **speed and clarity** with which we can deliver and consume content. 

Here's what changed:
* **In-Memory Simplicity:** High performance, zero local setup friction.
* **Instant Feed Synchronization:** Powered by standard Server-Sent Events (SSE).
* **Medium-Like UX:** A premium editorial style prioritizing readable typography and absolute responsiveness.

We are excited to build on this foundation. Simple, fast, content-first.`,
      authorId: author1.id,
      author: author1,
      tags: ['Meta', 'Startups', 'Tech'],
      createdAt: Date.now() - 48 * 3600000, // 2 days ago
      readingTime: 2,
      likes: 19,
      views: 890,
      sourceType: 'manual',
      status: 'published',
      trustScore: 0.85,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      rpmReal: 0,
      cpmReal: 0,
      adSlotsFilled: 0,
    };

    this.posts.set(post1.id, post1);
    this.posts.set(post2.id, post2);
    this.posts.set(post3.id, post3);
  }

  // Profiles
  getProfile(id: string): Profile | undefined {
    return this.profiles.get(id);
  }

  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  // Posts
  getPost(id: string): Post | undefined {
    return this.posts.get(id);
  }

  getAllPosts(tag?: string, authorId?: string, query?: string): Post[] {
    let list = Array.from(this.posts.values());

    if (tag) {
      const lowerTag = tag.toLowerCase();
      list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === lowerTag));
    }

    if (authorId) {
      list = list.filter((p) => p.authorId === authorId);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.content.toLowerCase().includes(lowerQuery) ||
          p.excerpt.toLowerCase().includes(lowerQuery) ||
          p.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    }

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  createPost(dto: CreatePostDTO): Post {
    let author = this.getProfile(dto.authorId);
    if (!author) {
      // Auto-create an author for convenience
      author = {
        id: dto.authorId,
        name: dto.authorId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        avatar: `https://i.pravatar.cc/150?u=${dto.authorId}`,
        bio: `Contributor on SIMIS MediaFarm.`,
        role: 'contributor',
        createdAt: new Date().toISOString()
      };
      this.profiles.set(author.id, author);
    }

    const excerpt = dto.excerpt || (dto.content.length > 160 ? dto.content.slice(0, 160) + '...' : dto.content);
    
    // Word count based reading time calculation (words / 200)
    const words = dto.content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    const post: Post = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      excerpt,
      authorId: author.id,
      author,
      tags: dto.tags.map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      readingTime,
      likes: 0,
      views: 0,
      sourceType: dto.sourceType || 'manual',
      status: dto.status || 'draft',
      trustScore: dto.trustScore ?? 0.8, // default manual trust score
      impressions: 0,
      clicks: 0,
      ctr: 0,
      rpmReal: 0,
      cpmReal: 0,
      adSlotsFilled: 0,
    };

    this.posts.set(post.id, post);
    this.broadcast({ type: 'post_created', payload: post });
    return post;
  }

  likePost(id: string): Post | undefined {
    const post = this.posts.get(id);
    if (post) {
      post.likes += 1;
      this.posts.set(id, post);
      this.broadcast({ type: 'like_updated', payload: { id, likes: post.likes } });
      this.logMetric('post_liked', { id, likes: post.likes });
      return post;
    }
    return undefined;
  }

  viewPost(id: string): Post | undefined {
    const post = this.posts.get(id);
    if (post) {
      post.views += 1;
      this.posts.set(id, post);
      this.broadcast({ type: 'post_viewed', payload: { id, views: post.views } });
      this.logMetric('post_viewed', { id, views: post.views });
      return post;
    }
    return undefined;
  }

  transitionPostState(id: string, newState: PostStatus): Post | undefined {
    const post = this.posts.get(id);
    if (!post) return undefined;

    // Basic state machine rules V1.1
    const rules = {
      'ingested': ['draft', 'pending_review'],
      'draft': ['pending_review', 'published'], // published bypass for admin/editor
      'pending_review': ['approved', 'draft'], // rejected goes back to draft or we could have rejected
      'approved': ['published'],
      'published': ['featured', 'archived', 'ranked', 'monetized'], // kept ranked/monetized for legacy support if needed
      'featured': ['archived'],
      'ranked': ['monetized', 'archived'],
      'monetized': ['archived'],
      'archived': []
    } as Record<PostStatus, PostStatus[]>;

    // We allow bypassing rules for admin/system overrides in MVP, but log it
    if (!rules[post.status].includes(newState)) {
      this.logMetric('invalid_state_transition_attempt', { id, from: post.status, to: newState });
    }

    post.status = newState;
    this.posts.set(id, post);
    this.broadcast({ type: 'state_transition', payload: { id, status: newState } });
    this.logMetric('post_state_transition', { id, status: newState });
    return post;
  }

  deletePost(id: string): boolean {
    if (this.posts.has(id)) {
      this.posts.delete(id);
      this.broadcast({ type: 'post_deleted', payload: { id } });
      return true;
    }
    return false;
  }

  // SSE Subscriptions
  subscribe(callback: (event: SSEEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public emitEvent(event: SSEEvent) {
    this.broadcast(event);
  }

  private broadcast(event: SSEEvent) {
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (e) {
        console.error('Error broadcasting to subscriber:', e);
      }
    }
  }

  private logMetric(metric: string, data: any) {
    console.log(`[Metric: ${metric}]`, JSON.stringify(data));
  }
}

export const db = new MemoryDB();
