'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

interface Site {
  id: string;
  name: string;
}

export default function SiteFilter({ sites, selectedSiteId }: { sites: Site[]; selectedSiteId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (siteId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (siteId === 'ALL') {
      params.delete('siteId');
    } else {
      params.set('siteId', siteId);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={`flex items-center gap-3 transition-opacity ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2 bg-app-card border border-app rounded-2xl px-4 py-2.5 shadow-sm">
        <span className="text-lg">🏥</span>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">สถานที่</span>
          <select
            value={selectedSiteId || 'ALL'}
            onChange={(e) => handleChange(e.target.value)}
            className="site-filter-select bg-app-card text-app-heading border-none focus:ring-0 text-sm font-bold p-0 cursor-pointer min-w-[140px] outline-none"
          >
            <option value="ALL">ทุกสถานที่</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
      </div>
      {selectedSiteId && (
        <button
          onClick={() => handleChange('ALL')}
          className="text-xs text-app-muted hover:text-app-body px-2 py-1 rounded-lg hover:bg-app-section transition-colors"
        >
          ✕ ล้าง
        </button>
      )}
      {isPending && (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}
