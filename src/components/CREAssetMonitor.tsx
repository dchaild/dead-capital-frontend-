// components/CREAssetMonitor.tsx
'use client';

import { useAccount } from 'wagmi';
import { useAssetRegistry } from '@/hooks/useAssetRegistry';
import AssetCard from './AssetCard';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CREAssetMonitor() {
  const { address, isConnected } = useAccount();
  
  // Fetch from BOTH registries
  const { totalAssets: dcTotal, userAssetIds: dcAssets, refetch: refetchDc } = useAssetRegistry('dc');
  const { totalAssets: vaTotal, userAssetIds: vaAssets, refetch: refetchVa } = useAssetRegistry('va');

  // Merge total assets count
  const totalAssets = (dcTotal || BigInt(0)) + (vaTotal || BigInt(0));
  
  // Count user's total assets
  const userTotalAssets = (dcAssets?.length || 0) + (vaAssets?.length || 0);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view your registered assets
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">My Asset Portfolio</h2>
        <div className="grid grid-cols-3 gap-6">
          <StatCard
            label="My Assets"
            value={userTotalAssets}
            icon="🏠"
          />
          <StatCard
            label="Total Network Assets"
            value={totalAssets?.toString() || '0'}
            icon="🌍"
          />
          <StatCard
            label="CRE Workflow"
            value="Active"
            icon="✅"
            valueColor="text-green-600"
          />
        </div>
      </div>

      {/* Standard Tier Assets */}
      {dcAssets && dcAssets.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">Standard Tier</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {dcAssets.length} Assets
              </span>
            </div>
            <button
              onClick={() => refetchDc()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dcAssets.map((assetId) => (
              <AssetCard 
                key={assetId} 
                assetId={assetId} 
                type="dc"
                tier="Standard"
              />
            ))}
          </div>
        </div>
      )}

      {/* Premium Tier Assets */}
      {vaAssets && vaAssets.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">Premium Tier</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {vaAssets.length} Assets
              </span>
            </div>
            <button
              onClick={() => refetchVa()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaAssets.map((assetId) => (
              <AssetCard 
                key={assetId} 
                assetId={assetId} 
                type="va"
                tier="Premium"
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!dcAssets || dcAssets.length === 0) && (!vaAssets || vaAssets.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2">No Assets Registered</h3>
          <p className="text-gray-600">
            You haven't registered any assets yet. Register your real estate or verified assets to start minting stablecoins.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueColor = 'text-gray-900',
}: {
  label: string;
  value: string | number;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
