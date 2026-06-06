const fs = require('fs');
const files = [
  'apps/web/app/page.tsx',
  'apps/web/app/tag/[tag]/page.tsx',
  'apps/web/app/sitemap.ts',
  'apps/web/app/read/[slug]/page.tsx',
  'apps/web/app/author/[id]/page.tsx',
  'apps/web/app/post/[id]/page.tsx',
  'apps/web/app/feed.xml/route.ts',
  'apps/web/lib/kernel-api.ts',
  'apps/web/src/renderer/ArtifactLoader.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace ${process.env.NEXT_PUBLIC_KERNEL_API_URL || 'http://127.0.0.1:4000'}
    // with ${process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000')}
    content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_KERNEL_API_URL \|\| 'http:\/\/127\.0\.0\.1:4000'\}/g, "${process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000')}");
    
    // Replace process.env.NEXT_PUBLIC_KERNEL_API_URL || "http://localhost:4000"
    content = content.replace(/process\.env\.NEXT_PUBLIC_KERNEL_API_URL \|\| \"http:\/\/localhost:4000\"/g, "process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:4000')");

    // Replace process.env.NEXT_PUBLIC_KERNEL_API_URL || 'http://localhost:4000'
    content = content.replace(/process\.env\.NEXT_PUBLIC_KERNEL_API_URL \|\| 'http:\/\/localhost:4000'/g, "process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:4000')");

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}
