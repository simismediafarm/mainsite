'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Post, SSEEvent } from '@simis/shared';
import MarkdownRenderer from './MarkdownRenderer';
import { useEventSourceFeed } from '../lib/sse';
import { ThumbsUp, Eye, Share2, Award, Calendar, Clock } from 'lucide-react';

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
  const [auctionResults, setAuctionResults] = useState<any[]>([]);

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
      fetch(`/api/mvp/post/${post.id}/view`, { method: 'POST' }).catch(console.error);
    }

    // Run V1.1 Ad Auction Simulation
    if (initialMonetization?.allowedSlots?.length) {
      fetch('/api/mvp/ads/auction/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, slots: initialMonetization.allowedSlots })
      }).then(res => res.json())
        .then(data => {
          if (data.results) setAuctionResults(data.results);
        }).catch(console.error);
    }
  }, [post.id, initialMonetization]);

  const handleAdClick = async (slot: string) => {
    try {
      await fetch(`/api/mvp/ads/click/${post.id}`, { method: 'POST' });
      console.log(`[Simulation] Ad click recorded for slot: ${slot}`);
    } catch (err) {
      console.error(err);
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
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/mvp/post/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => ({ ...prev, likes: data.post.likes }));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
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

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
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

          {/* In-Article Affiliate block */}
          <div className="my-10 border border-[#222222] bg-[#0e0e0e] overflow-hidden rounded-sm group">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 bg-[#121212] p-4 flex items-center justify-center">
                <img alt="Product" className="max-h-40 group-hover:scale-103 transition-transform duration-500 rounded" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop" />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-[#e5e2e1]">Matrix Operator Audio v4</h3>
                    <div className="flex text-[#fec931] items-center">
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span className="material-symbols-outlined text-xs">star_half</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
                    <ul className="space-y-1 text-[#32D74B] font-mono">
                      <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check</span> Low Latency API</li>
                      <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check</span> Ergonomic Sound</li>
                    </ul>
                    <ul className="space-y-1 text-[#bac9cc] font-mono">
                      <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">close</span> Premium Cost</li>
                    </ul>
                  </div>
                </div>
                <button className="w-full py-2 bg-[#00E5FF] text-[#050505] font-bold text-xs rounded hover:bg-[#00daf3] transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  Check Price on Operator Protocol
                  <span className="material-symbols-outlined text-xs font-bold">open_in_new</span>
                </button>
              </div>
            </div>
          </div>

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
                What constitutes a "Sovereign Operator" workflow?
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-xs">expand_more</span>
              </summary>
              <div className="p-4 pt-0 text-xs text-[#bac9cc] leading-relaxed font-sans">
                A sovereign workflow is characterized by independent asset ownership, high-integrity data sourcing, and an automated deployment pipeline that requires minimal manual intervention once configured.
              </div>
            </details>
          </div>
        </section>

        {/* Bottom Interaction Area */}
        <footer className="border-t border-[#222222] py-6 mt-10 flex items-center justify-between text-xs">
          <button 
            onClick={handleLike} 
            disabled={isLiking} 
            className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#222222] hover:border-[#00E5FF]/40 rounded-full transition-colors text-[#bac9cc] hover:text-[#e5e2e1]"
          >
            <ThumbsUp size={14} />
            <span className="font-mono">{post.likes}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#222222] hover:border-[#00E5FF]/40 rounded-full transition-colors text-[#bac9cc] hover:text-[#e5e2e1]"
          >
            <Share2 size={14} />
            <span>{copied ? 'Copied Link!' : 'Share Story'}</span>
          </button>
        </footer>
      </div>

      {/* Right Sidebar: Sticky Actions */}
      <aside className="hidden lg:block w-[200px] shrink-0 sticky top-20 self-start">
        <div className="flex flex-col gap-6">
          <div className="p-4 border border-[#00E5FF]/20 bg-[#00E5FF]/5 rounded-sm">
            <span className="material-symbols-outlined text-[#00E5FF] mb-2 text-xl">mail</span>
            <h4 className="text-xs font-bold text-[#e5e2e1] mb-1.5">Dispatch</h4>
            <p className="text-[10px] text-[#bac9cc] leading-normal mb-3">Weekly protocol updates for Sovereign Operators.</p>
            <input className="w-full bg-[#050505] border border-[#222222] rounded px-2.5 py-1.5 text-[10px] text-[#e5e2e1] mb-2 focus:border-[#00E5FF] outline-none text-center placeholder-[#bac9cc]/30" placeholder="operator@simis.net" type="email"/>
            <button className="w-full py-1.5 bg-[#00E5FF] text-[#050505] font-bold text-[9px] rounded-sm uppercase tracking-wider">Execute Sync</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
