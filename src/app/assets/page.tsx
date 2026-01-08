'use client';

import CREAssetMonitor from '@/components/CREAssetMonitor';

export default function AssetsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Asset Portfolio</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and manage your registered assets across Standard and Premium tiers
          </p>
        </div>
        
        <CREAssetMonitor />
      </div>
    </main>
  );
}
