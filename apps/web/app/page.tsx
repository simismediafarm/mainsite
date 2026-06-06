import React from 'react';
import Link from 'next/link';
import { Post } from '@simis/shared';
import { registry } from '@/lib/registryClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialPosts: Post[] = [];
  let trendingTags: { name: string, count?: string }[] = [];
  let topEntities: { name: string, score: number, color?: string }[] = [];
  
  try {
    // Parallel fetch from kernel APIs and registries
    const [feedRes, taxonomyData, widgetData] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || 'http://127.0.0.1:4000'}/api/mvp/feed`, { cache: 'no-store' }),
      registry.getTaxonomy(),
      registry.getWidgetByKey('home_sidebar')
    ]);

    // 1. Resolve Feed
    if (feedRes.status === 'fulfilled' && feedRes.value.ok) {
      const data = await feedRes.value.json();
      initialPosts = data.posts || [];
    }

    // 2. Resolve Taxonomy (Trending Tags)
    if (taxonomyData.status === 'fulfilled' && taxonomyData.value) {
      const taxonomies = Array.isArray(taxonomyData.value) ? taxonomyData.value : [taxonomyData.value];
      const tagRegistry = taxonomies.find(t => t.key === 'trending_tags');
      if (tagRegistry?.schema) {
        try {
          const parsed = JSON.parse(tagRegistry.schema);
          trendingTags = parsed.tags || [];
        } catch (e) {
          console.error("Failed to parse taxonomy schema", e);
        }
      }
    }

    // 3. Resolve Widgets (Sidebar Entities)
    if (widgetData.status === 'fulfilled' && widgetData.value) {
      if (widgetData.value.schema) {
        try {
          const parsed = JSON.parse(widgetData.value.schema);
          topEntities = parsed.entities || [];
        } catch(e) {
           console.error("Failed to parse widget schema", e);
        }
      }
    }

  } catch (err: any) {
    console.error('Failed to resolve page dependencies', err);
  }

  // Purely dynamic UI - no mock fallbacks
  const displayPosts = initialPosts;
  const heroPost = displayPosts.length > 0 ? displayPosts[0] : null;
  const gridPosts = displayPosts.length > 1 ? displayPosts.slice(1, 4) : [];
  const remainingPosts = displayPosts.length > 4 ? displayPosts.slice(4) : [];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col gap-8 text-[#e5e2e1] bg-[#131313] font-sans min-h-screen">
      
      {/* 1. Hero Section */}
      {heroPost ? (
        <section className="relative w-full h-[500px] border border-[#222222] bg-[#121212] flex flex-col justify-end p-8 overflow-hidden group rounded-sm">
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-700" 
              src={heroPost.seoMetadata?.openGraph ? JSON.parse(heroPost.seoMetadata.openGraph).image : "https://lh3.googleusercontent.com/aida-public/AB6AXuAv1ieN_LcfPy3mYHpIA6wPJlZnUkaXt2HWLzyUskoVvavvtkunnX2a22FW8OAAZ-Mrq6vwz80o-g_P_I8IjcfBaJJxnkp9taBAhJjPHzITrVsWxzQgPvdyroXZVdRExnI1sk_JXvflT0kJM_xGXSTfN_cwVIofq6R3BDDTP4Im2V5UQFTa3ZjLPS3FDCIKrEJP-PSEbCyLh_4xsOFn2irlCixiwRafmcmkBMWml-5CjNegzBA0FBpLa3WP-vSNd1dXYMfehIrVygzx"}
              alt="Hero Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-3xl flex flex-col gap-4">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider">
              {heroPost.tags?.[0] && (
                <span className="bg-[#2a2a2a] px-2 py-1 text-[#00E5FF] border border-[#222222] font-semibold">
                  {typeof heroPost.tags[0] === 'string' ? heroPost.tags[0].toUpperCase() : (heroPost.tags[0] as any).name?.toUpperCase()}
                </span>
              )}
              {heroPost.trustScore && heroPost.trustScore > 80 && (
                 <span className="text-[#32D74B] flex items-center gap-1 font-bold">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse"></span> HIGH TRUST
                 </span>
              )}
              <span className="text-[#bac9cc]">{(heroPost as any).readingTime || 5} MIN READ</span>
            </div>
            <Link href={`/post/${heroPost.id}`}>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#e5e2e1] leading-tight hover:text-[#00E5FF] transition-colors">{heroPost.title}</h1>
            </Link>
            <p className="text-sm text-[#bac9cc] font-serif leading-relaxed">{heroPost.excerpt}</p>
            
            <div className="flex items-center gap-3 mt-4 border-t border-[#222222]/50 pt-4 w-fit">
              {heroPost.author?.avatar && (
                <div className="w-8 h-8 rounded-full border border-[#222222] overflow-hidden bg-[#2a2a2a]">
                  <img src={heroPost.author.avatar} alt={heroPost.author.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-[#e5e2e1]">{heroPost.author?.name || 'System Operator'}</div>
                <div className="text-[10px] text-[#bac9cc] font-mono">{heroPost.author?.role || 'Contributor'}</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative w-full h-[300px] border border-dashed border-[#222222] bg-[#121212]/50 flex items-center justify-center rounded-sm">
          <div className="text-center font-mono text-xs text-[#bac9cc] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#222222]">storage</span>
            <div>No Hero Asset Discovered in Registry</div>
          </div>
        </section>
      )}

      {/* 2. Trending Bar */}
      {trendingTags.length > 0 && (
        <section className="border-y border-[#222222] py-4 bg-[#121212]/30 px-2 rounded-sm overflow-x-auto no-scrollbar flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-widest text-[#bac9cc] font-bold shrink-0">TRENDING FILTERS:</span>
          <div className="flex gap-2">
            {trendingTags.map((tag) => (
              <button key={tag.name} className="px-3 py-1.5 bg-[#121212] border border-[#222222] rounded hover:border-[#00E5FF] transition-colors shrink-0 text-left">
                <div className="text-xs font-bold text-[#e5e2e1]">{tag.name}</div>
                {tag.count && <div className="text-[8px] text-[#bac9cc] font-mono">{tag.count}</div>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. Featured Row Grid */}
      {gridPosts.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gridPosts.map((post) => (
            <article key={post.id} className="bg-[#121212] border border-[#222222] flex flex-col group hover:bg-[#1a1a1a] transition-colors cursor-pointer rounded-sm overflow-hidden">
              <div className="h-44 border-b border-[#222222] overflow-hidden relative bg-[#2a2a2a]">
                <div className="absolute inset-0 bg-[#050505]/40 z-10"></div>
                <img 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300 group-hover:scale-102 transform" 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
                  alt={post.title}
                />
              </div>
              <div className="p-4 flex flex-col gap-2 flex-grow">
                <div className="flex justify-between items-center font-mono text-[9px]">
                  <span className="text-[#00E5FF] font-bold">
                     {post.tags?.[0] ? (typeof post.tags[0] === 'string' ? post.tags[0] : (post.tags[0] as any).name) : 'ARTICLE'}
                  </span>
                  <span className="text-[#bac9cc]">{(post as any).readingTime || 4} MIN READ</span>
                </div>
                <Link href={`/post/${post.id}`}>
                  <h3 className="text-sm font-bold text-[#e5e2e1] group-hover:text-[#00E5FF] transition-colors line-clamp-2 leading-snug">{post.title}</h3>
                </Link>
                <div className="mt-auto pt-4 flex items-center justify-between text-[10px] text-[#bac9cc] border-t border-[#222222]/50 font-mono">
                  <span>By {post.author?.name || 'System Operator'}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    {((post.views || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* 4. 70/30 Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Feed (70%) */}
        <div className="w-full lg:w-[70%] flex flex-col gap-4">
          <div className="border-b border-[#222222] pb-2 mb-2">
            <h2 className="font-mono text-[10px] tracking-widest text-[#bac9cc] font-bold">CHRONOLOGICAL FEED</h2>
          </div>

          {remainingPosts.length > 0 ? (
            remainingPosts.map((post) => (
              <article key={post.id} className="flex flex-col sm:flex-row gap-4 border-b border-[#222222]/40 pb-4 group cursor-pointer">
                <div className="w-full sm:w-40 h-28 flex-shrink-0 border border-[#222222] overflow-hidden bg-[#121212]">
                  <img className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" alt="Thumbnail" />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[9px] mb-1">
                      <span className="text-[#00E5FF] font-semibold">
                         {post.tags?.[0] ? (typeof post.tags[0] === 'string' ? post.tags[0] : (post.tags[0] as any).name) : 'INDEXED'}
                      </span>
                      <span className="text-[#222222]">|</span>
                      <span className="text-[#bac9cc]">RECENT</span>
                    </div>
                    <Link href={`/post/${post.id}`}>
                      <h3 className="text-base font-bold text-[#e5e2e1] group-hover:text-[#00E5FF] transition-colors">{post.title}</h3>
                    </Link>
                    <p className="text-xs text-[#bac9cc] mt-1.5 line-clamp-2 leading-relaxed font-serif">{post.excerpt}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-center border border-dashed border-[#222222] text-[#bac9cc] text-xs font-mono">
               AWAITING CONTENT INGESTION PIPELINE
            </div>
          )}
        </div>

        {/* Right Side: Sidebar Widgets (30%) */}
        <aside className="w-full lg:w-[30%] flex flex-col gap-6">
          {/* Top Entities (Dynamic from Registry) */}
          {topEntities.length > 0 && (
            <div className="bg-[#121212] border border-[#222222] p-4 rounded-sm">
              <h3 className="font-mono text-[10px] tracking-wider text-[#bac9cc] font-bold mb-4 flex items-center gap-1.5 border-b border-[#222222] pb-2 uppercase">
                <span className="material-symbols-outlined text-[14px]">hub</span> Top Entities
              </h3>
              <ul className="flex flex-col gap-3 text-xs">
                {topEntities.map((entity, idx) => (
                  <li key={idx} className="flex justify-between items-center group cursor-pointer">
                    <span className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors">{entity.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-[#222222] overflow-hidden">
                        <div className="h-full bg-[#00E5FF]" style={{ width: `${entity.score}%`, backgroundColor: entity.color || '#00E5FF' }}></div>
                      </div>
                      <span className="text-[#bac9cc] font-mono text-[10px]">{entity.score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback Empty Widget if no top entities */}
          {topEntities.length === 0 && (
            <div className="bg-[#121212] border border-dashed border-[#222222] p-4 rounded-sm text-center font-mono text-[10px] text-[#bac9cc]">
              WIDGET REGISTRY EMPTY
            </div>
          )}

          {/* High-Contrast Newsletter Signup */}
          <div className="bg-[#00E5FF]/5 border border-[#00E5FF]/20 p-5 flex flex-col gap-3 text-center rounded-sm">
            <span className="material-symbols-outlined text-[#00E5FF] text-2xl mx-auto">mail</span>
            <h3 className="text-sm font-bold text-[#e5e2e1]">The Daily Synthesis</h3>
            <p className="text-[11px] text-[#bac9cc] leading-normal">Executive summary of the day&apos;s critical data, delivered to your inbox.</p>
            <div className="flex flex-col gap-2 mt-1">
              <input className="bg-[#050505] border border-[#222222] px-3 py-1.5 text-xs text-[#e5e2e1] focus:border-[#00E5FF] outline-none text-center rounded-sm placeholder-[#bac9cc]/40" placeholder="operator@domain.com" type="email"/>
              <button className="bg-[#00E5FF] text-[#050505] text-xs font-bold py-2 rounded-sm hover:bg-[#00daf3] transition-colors uppercase tracking-wider">SUBSCRIBE</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
