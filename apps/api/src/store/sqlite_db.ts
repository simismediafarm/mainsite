import { PrismaClient } from '@prisma/client';
import { Post, Profile, CreatePostDTO, SSEEvent, PostStatus } from '@simis/shared';

const prisma = new PrismaClient();

export class SQLiteDB {
  private subscribers: Set<(event: SSEEvent) => void> = new Set();

  constructor() {
    this.seed();
  }

  private async seed() {
    const adminCount = await prisma.profile.count();
    if (adminCount > 0) return; // already seeded

    // Seed Authors (Profiles)
    const admin = await prisma.profile.create({
      data: {
        id: 'system-admin',
        name: 'Simis Admin',
        role: 'admin',
        bio: 'Lead Platform Architect at SIMIS MediaFarm.'
      }
    });

    const sarah = await prisma.profile.create({
      data: {
        id: 'sarah-drasner',
        name: 'Sarah Drasner',
        role: 'editor',
        bio: 'VP of Developer Experience, web creator, and open-source advocate.'
      }
    });

    const alex = await prisma.profile.create({
      data: {
        id: 'alex-chen',
        name: 'Alex Chen',
        role: 'author',
        bio: 'Systems engineer specializing in high-performance backends.'
      }
    });

    const emma = await prisma.profile.create({
      data: {
        id: 'emma-watson',
        name: 'Emma Watson',
        role: 'author',
        bio: 'UX researcher and typography writer.'
      }
    });

    // Seed Posts
    await prisma.post.create({
      data: {
        id: 'art-of-simplicity',
        slug: 'the-art-of-simplicity-in-software-engineering',
        title: 'The Art of Simplicity in Software Engineering',
        excerpt: 'Why keeping systems simple is the hardest but most rewarding architectural discipline.',
        content: `# The Art of Simplicity in Software Engineering\n\nComplexity is the enemy of reliability...`,
        authorId: alex.id,
        status: 'published',
        trustScore: 95,
        views: 1250,
        likes: 42,
        clicks: 145,
        ctr: 0.012,
        rpmReal: 4.5,
        cpmReal: 3.2,
        revenueTotal: 54.0,
      }
    });

    await prisma.post.create({
      data: {
        id: 'readability-ux',
        slug: 'design-principles-for-ultra-readable-experiences',
        title: 'Design Principles for Ultra-Readable Experiences',
        excerpt: 'How we leverage typography, vertical rhythm, and focus modes...',
        content: `# Design Principles for Ultra-Readable Experiences\n\nWhen we read on screens...`,
        authorId: emma.id,
        status: 'featured',
        trustScore: 90,
        editorialBoost: 50,
        views: 5430,
        likes: 128,
        clicks: 890,
        ctr: 0.018,
        rpmReal: 6.2,
        cpmReal: 4.8,
        revenueTotal: 154.0,
      }
    });
  }

  // Profiles
  async getProfile(id: string) {
    return prisma.profile.findUnique({ where: { id } });
  }

  async getAllProfiles() {
    return prisma.profile.findMany();
  }

  // Posts
  async getPost(identifier: string) {
    let post = await prisma.post.findUnique({ where: { id: identifier }, include: { author: true, tags: true } });
    if (!post) {
      post = await prisma.post.findUnique({ where: { slug: identifier }, include: { author: true, tags: true } });
    }
    return post;
  }

  async getAllPosts(tag?: string, authorId?: string, query?: string) {
    const where: any = {};
    if (authorId) where.authorId = authorId;
    if (tag) where.tags = { some: { name: tag } };
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { content: { contains: query } },
        { excerpt: { contains: query } }
      ];
    }
    return prisma.post.findMany({
      where,
      include: { author: true, tags: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPost(dto: CreatePostDTO) {
    let profile = await prisma.profile.findUnique({ where: { id: dto.authorId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: dto.authorId,
          name: dto.authorId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          role: 'contributor'
        }
      });
    }

    const excerpt = dto.excerpt || (dto.content.length > 160 ? dto.content.slice(0, 160) + '...' : dto.content);

    const post = await prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        excerpt,
        authorId: profile.id,
        status: dto.status || 'draft',
        trustScore: dto.trustScore ?? 80,
        tags: {
          connectOrCreate: dto.tags.map(t => ({
            where: { name: t.trim() },
            create: { name: t.trim() }
          }))
        }
      },
      include: { author: true, tags: true }
    });

    this.broadcast({ type: 'post_created', payload: post as any });
    return post;
  }

  async likePost(id: string) {
    const post = await prisma.post.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });
    this.broadcast({ type: 'like_updated', payload: { id, likes: post.likes } });
    return post;
  }

  async viewPost(id: string) {
    const post = await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
    this.broadcast({ type: 'post_viewed', payload: { id, views: post.views } });
    return post;
  }

  async transitionPostState(id: string, newState: PostStatus) {
    const post = await prisma.post.update({
      where: { id },
      data: { status: newState }
    });
    this.broadcast({ type: 'state_transition', payload: { id, status: newState } });
    return post;
  }

  async deletePost(id: string) {
    try {
      await prisma.post.delete({ where: { id } });
      this.broadcast({ type: 'post_deleted', payload: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Content Candidates (Phase 2)
  async createContentCandidate(data: {
    sourceType: string;
    sourceUrl?: string;
    title: string;
    rawContent: string;
    extractedTags?: string;
    normalizedData?: string;
  }) {
    return prisma.contentCandidate.create({
      data: {
        ...data,
        status: 'queued'
      }
    });
  }

  async getContentCandidates(status?: string) {
    const where = status ? { status } : {};
    return prisma.contentCandidate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateContentCandidateStatus(id: string, status: string) {
    return prisma.contentCandidate.update({
      where: { id },
      data: { status }
    });
  }

  // AdEvents
  async recordAdEvent(postId: string, provider: string, type: 'impression' | 'click' | 'conversion', revenueValue: number = 0) {
    await prisma.adEvent.create({
      data: {
        postId,
        provider,
        type,
        impression: type === 'impression',
        click: type === 'click',
        conversion: type === 'conversion',
        revenueValue
      }
    });

    if (type === 'click') {
      await prisma.post.update({
        where: { id: postId },
        data: { clicks: { increment: 1 }, revenueTotal: { increment: revenueValue } }
      });
    }
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
}

export const db = new SQLiteDB();
