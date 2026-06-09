'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Post, SSEEvent } from '@simis/shared';
import MarkdownRenderer from './MarkdownRenderer';
import { useEventSourceFeed } from '../lib/sse';
import { ThumbsUp, Eye, Share2, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

interface PostReaderClientProps {
  initialPost: Post;
  initialMonetization?: {
    allowedSlots: string[];
    reasoning: string[];
  };
}

export default function PostReaderClient({ initialPost, initialMonetization }: PostReaderClientProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [auctionResults, setAuctionResults] = useState<Array<{ slot: string; winningBidder: string; winningBidValue: number }>>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Scroll Progress logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const percentage = (window.scrollY / totalScroll) * 100;
        setScrollProgress(percentage);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Record view on mount
  useEffect(() => {
    let viewed = false;
    if (!viewed) {
      viewed = true;
      apiClient.viewPost(post.id);
    }

    // Run Ad Auction
    if (initialMonetization?.allowedSlots?.length) {
      apiClient.runAuction(post.id, initialMonetization.allowedSlots)
        .then((data) => {
          if (data.results) setAuctionResults(data.results);
        })
        .catch((err: unknown) => {
          console.error('Ad auction failed:', err);
        });
    }
  }, [post.id, initialMonetization]);

  const handleAdClick = async (slot: string) => {
    try {
      await apiClient.recordAdClick(post.id);
      console.log(`[Simulation] Ad click recorded for slot: ${slot}`);
    } catch (err) {
      console.error('Ad click failed:', err);
    }
  };

  const getAdForSlot = (slotType: string) => {
    const res = auctionResults.find(r => r.slot === slotType);
    if (!res) return null;
    return (
      <div 
        onClick={() => handleAdClick(slotType)}
        className="my-8 border border-[#222222] bg-[#0e0e0e] hover:border-[#00E5FF]/40 transition-colors p-6 text-center cursor-pointer rounded-sm"
        title="Click to simulate CTR boost"
      >
        <span className="text-[#FF2D55] font-mono text-[10px] tracking-wider block mb-1">SPONSORED BY {res.winningBidder.toUpperCase()}</span>
        <div className="font-bold text-[#e5e2e1] text-xs uppercase my-2 tracking-widest">[ {slotType.replace('_', ' ')} ]</div>
        <span className="text-[#32D74B] font-mono text-[10px]">Bid Value: {(res.winningBidValue / 100).toFixed(4)} USD</span>
      </div>
    );
  };

  // Subscribe to real-time updates for likes or post deletes
  useEventSourceFeed((event: SSEEvent) => {
    try {
      if (event.type === 'like_updated') {
        const { id, likes } = event.payload as { id: string; likes: number };
        if (id === post.id) {
          setPost((prev) => ({ ...prev, likes }));
        }
      } else if (event.type === 'post_updated') {
        const updated = event.payload as Post;
        if (updated.id === post.id) {
          setPost((prev) => ({ ...prev, ...updated }));
        }
      } else if (event.type === 'post_viewed') {
        const { id, views } = event.payload as { id: string; views: number };
        if (id === post.id) {
          setPost((prev) => ({ ...prev, views }));
        }
      }
    } catch (err) {
      console.error('SSE event handling failed:', err);
    }
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const data = await apiClient.likePost(post.id);
      setPost((prev) => ({ ...prev, likes: Number(data.post.likes) }));
    } catch (err) {
      console.error('Failed to like post:', err);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = newsletterEmail.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setNewsletterLoading(true);
    try {
      await apiClient.subscribeNewsletter(emailTrimmed);
      toast.success('Subscribed!');
      setNewsletterEmail('');
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
    <div className="max-w-[1440px] mx-auto px-6 py-8 flex gap-10 bg-[#131313] text-[#e5e2e1] font-sans relative">
      {/* Progress Scroll Indicator */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-transparent z-50">
        <div className="h-full bg-[#00E5FF] transition-all duration-100" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      {/* Left Sidebar: Outline */}
      <aside className="hidden xl:block w-[200px] shrink-0 sticky top-20 self-start">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] tracking-wider text-[#849396] uppercase">Outline</span>
            <nav className="flex flex-col gap-3 text-xs text-[#bac9cc]">
              <a className="text-[#00E5FF] hover:text-[#00daf3]" href="#intro">01 Introduction</a>
              <a className="hover:text-[#e5e2e1] transition-colors" href="#core-metrics">02 Core Metrics</a>
              <a className="hover:text-[#e5e2e1] transition-colors" href="#tooling">03 Hardware Protocol</a>
              <a className="hover:text-[#e5e2e1] transition-colors" href="#faq">04 System FAQ</a>
            </nav>
          </div>
          <div className="h-[1px] bg-[#222222]"></div>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[9px] tracking-wider text-[#849396] uppercase">Controls</span>
            <div className="flex gap-4 text-[#bac9cc]">
              <span className="material-symbols-outlined text-[16px] hover:text-[#00E5FF] cursor-pointer" onClick={handleShare}>share</span>
              <span className="material-symbols-outlined text-[16px] hover:text-[#00E5FF] cursor-pointer">bookmark</span>
              <span className="material-symbols-outlined text-[16px] hover:text-[#00E5FF] cursor-pointer">print</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 max-w-[680px] mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-[#00E5FF] text-[#050505] font-mono text-[9px] font-bold rounded-sm">GUIDE</span>
            <span className="text-[#bac9cc] font-mono text-[9px] uppercase">/ {post.tags?.[0] || 'AI'}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-[#e5e2e1] mb-6 leading-tight font-serif">{post.title}</h1>
          
          <div className="flex items-center justify-between py-4 border-y border-[#222222] mb-6">
            <div className="flex items-center gap-3">
              {post.author?.avatar && (
                <img src={post.author.avatar} alt={post.author.name} className="w-9 h-9 rounded-full border border-[#222222] object-cover" />
              )}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#e5e2e1]">
                  <span>{post.author?.name}</span>
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#32D74B] uppercase bg-[#32D74B]/10 px-1.5 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[11px] font-bold">verified</span> Expert Verified
                  </span>
                </div>
                <div className="text-[10px] text-[#bac9cc] mt-0.5">{formattedDate}</div>
              </div>
            </div>
            
            <div className="text-right font-mono text-[10px] text-[#bac9cc] flex items-center gap-1.5">
              <Clock size={12} />
              <span>{post.readingTime || 12} MIN READ</span>
            </div>
          </div>

          {/* Fact check alert */}
          <div className="p-3 bg-[#1c1b1b] border border-[#222222] rounded flex items-center gap-3 text-xs text-[#bac9cc]">
            <Award className="text-[#32D74B]" size={16} />
            <span>Fact-checked by <span className="text-[#e5e2e1] font-semibold">Elena Rossi</span> • Oversight Committee</span>
            <span className="material-symbols-outlined text-[#32D74B] ml-auto text-sm">check_circle</span>
          </div>
        </header>

        {/* Hero image preview */}
        <div className="w-full mb-8 rounded-sm overflow-hidden border border-[#222222] bg-[#121212]">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" alt="Hero illustration" className="w-full h-auto opacity-75 grayscale hover:grayscale-0 transition-all duration-700" />
          <div className="p-3 bg-[#0e0e0e] text-center text-[10px] text-[#bac9cc] italic border-t border-[#222222]">
            Figure 1.0: Modular and precision-aligned structures maximize sovereign operator throughput.
          </div>
        </div>

        {/* Monetization top ad */}
        {initialMonetization?.allowedSlots.includes('top_banner') && (
          getAdForSlot('top_banner')
        )}

        {/* Article content with Source Serif 4 style body */}
        <article className="prose prose-invert max-w-none text-base leading-relaxed text-[#e5e2e1] font-serif space-y-6" id="intro">
          {initialMonetization?.allowedSlots.includes('inline_native') && (
            getAdForSlot('inline_native')
          )}

          <MarkdownRenderer content={post.content} />

          {/* Affiliate block: rendered only when data is available from monetization API */}

          {initialMonetization?.allowedSlots.includes('mid_article') && (
            getAdForSlot('mid_article')
          )}
        </article>

        {/* FAQ Accordion */}
        <section className="mt-12 pt-8 border-t border-[#222222]" id="faq">
          <h3 className="text-base font-bold text-[#e5e2e1] mb-4 uppercase tracking-wider font-mono">System FAQ</h3>
          <div className="space-y-3">
            <details className="group bg-[#121212] border border-[#222222] rounded-sm">
              <summary className="list-none p-4 flex justify-between items-center cursor-pointer text-xs text-[#e5e2e1] font-bold select-none">
                What constitutes a &quot;Sovereign Operator&quot; workflow?
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-xs">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-xs text-[#bac9cc] leading-relaxed font-sans">
                A sovereign workflow is characterized by independent asset ownership, high-integrity data sourcing, and an automated deployment pipeline that requires minimal manual intervention once configured.
              </div>
            </details>
            <details className="group bg-[#121212] border border-[#222222] rounded-sm">
              <summary className="list-none p-4 flex justify-between items-center cursor-pointer text-xs text-[#e5e2e1] font-bold select-none">
                Is hardware virtualization necessary for media production?
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-xs">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-xs text-[#bac9cc] leading-relaxed font-sans">
                For high-volume output, virtualization allows for sandboxed research environments and distributed rendering, which significantly reduces local resource contention.
              </div>
            </details>
          </div>
        </section>

        {/* Interaction Bar */}
        <div className="border-t border-[#222222] py-5 mt-10 flex items-center justify-between text-xs">
          <button onClick={handleLike} disabled={isLiking}
            className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#222222] hover:border-[#00E5FF]/40 rounded-full transition-colors text-[#bac9cc] hover:text-[#e5e2e1]">
            <ThumbsUp size={14} />
            <span className="font-mono">{post.likes}</span>
          </button>
          <div className="flex items-center gap-2 text-[#bac9cc]">
            <Eye size={12} /><span className="font-mono">{post.views?.toLocaleString() ?? 0}</span>
          </div>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#222222] hover:border-[#00E5FF]/40 rounded-full transition-colors text-[#bac9cc] hover:text-[#e5e2e1]">
            <Share2 size={14} />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Author Bio Card */}
        {post.author && (
          <section className="mt-10 p-6 bg-[#121212] border border-[#222222] rounded-sm flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              {post.author.avatar
                ? <img src={post.author.avatar} alt={post.author.name} className="w-24 h-24 rounded border border-[#222222] object-cover" />
                : <div className="w-24 h-24 rounded border border-[#222222] bg-[#1c1b1b] flex items-center justify-center text-2xl text-[#849396]">{post.author.name?.[0]}</div>
              }
              <div className="flex gap-3 text-[#849396]">
                <span className="material-symbols-outlined text-base hover:text-[#00E5FF] cursor-pointer">alternate_email</span>
                <span className="material-symbols-outlined text-base hover:text-[#00E5FF] cursor-pointer">hub</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#e5e2e1] text-base mb-1">{post.author.name}</h4>
              <p className="text-[10px] text-[#00E5FF] uppercase tracking-widest mb-3 font-mono">{post.author.role || 'Editorial Contributor'}</p>
              <p className="text-xs text-[#bac9cc] leading-relaxed mb-4">{post.author.bio || 'Contributing author to the SIMIS MediaFarm editorial network.'}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 4).map((tag: string | { name: string }) => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    return (
                      <span key={tagName} className="px-2.5 py-1 bg-[#1c1b1b] text-[#e5e2e1] text-[9px] font-mono border border-[#222222] rounded uppercase tracking-wider">
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Right Sidebar: Sticky Actions */}
      <aside className="hidden lg:block w-[200px] shrink-0 sticky top-20 self-start">
        <div className="flex flex-col gap-6">
          <div className="p-4 border border-[#00E5FF]/20 bg-[#00E5FF]/5 rounded-sm">
            <span className="material-symbols-outlined text-[#00E5FF] mb-2 text-xl">mail</span>
            <h4 className="text-xs font-bold text-[#e5e2e1] mb-1.5">Dispatch</h4>
            <p className="text-[10px] text-[#bac9cc] leading-normal mb-3">Weekly protocol updates for Sovereign Operators.</p>
            <form onSubmit={handleNewsletterSubmit} noValidate>
              <input
                className="w-full bg-[#050505] border border-[#222222] rounded px-2.5 py-1.5 text-[10px] text-[#e5e2e1] mb-2 focus:border-[#00E5FF] outline-none text-center placeholder-[#bac9cc]/30"
                placeholder="operator@simis.net"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                aria-label="Email address for newsletter"
                disabled={newsletterLoading}
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-[#00E5FF] text-[#050505] font-bold text-[9px] rounded-sm uppercase tracking-wider disabled:opacity-50"
                disabled={newsletterLoading}
                aria-busy={newsletterLoading}
              >
                {newsletterLoading ? '...' : 'Execute Sync'}
              </button>
            </form>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[9px] tracking-wider text-[#849396] uppercase">Next Entry</span>
            <div className="group cursor-pointer">
              <p className="text-xs text-[#e5e2e1] group-hover:text-[#00E5FF] transition-colors mb-1 leading-snug">Synthesizing Signal from Global Market Noise</p>
              <span className="text-[10px] text-[#849396] font-mono flex items-center gap-1">
                PROCEED <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    {/* Related Intelligence — full width below the 3-col layout */}
    <section className="mt-16 border-t border-[#222222] pt-12 max-w-[1440px] mx-auto px-6 pb-20">
      <h3 className="font-bold text-[#e5e2e1] text-base mb-8 uppercase tracking-wider font-mono">Related Intelligence</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { tag: 'Security', title: 'Hardening the Editorial Edge: Cold Storage for Media Nodes', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop' },
          { tag: 'Performance', title: 'Benchmark Analysis: LLM Tokens per Editorial Second', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop' },
          { tag: 'Governance', title: 'Decentralized Distribution: Bypassing Algorithm Gatekeepers', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' },
        ].map((item, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="aspect-video bg-[#121212] overflow-hidden rounded border border-[#222222] mb-3">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
            </div>
            <span className="font-mono text-[9px] text-[#00E5FF] uppercase tracking-widest mb-1.5 block">{item.tag}</span>
            <h4 className="text-sm text-[#e5e2e1] group-hover:text-[#00E5FF] transition-colors leading-snug font-semibold">{item.title}</h4>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}
