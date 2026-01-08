// components/AssetCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAsset } from '@/hooks/useAssetRegistry';
import { formatEther } from 'viem';

interface AssetCardProps {
  assetId: `0x${string}`;
  type?: 'dc' | 'va';
  tier?: 'Standard' | 'Premium';
}

export default function AssetCard({ assetId, type = 'dc', tier = 'Standard' }: AssetCardProps) {
  const router = useRouter();
  const { asset, isLoading } = useAsset(assetId, type);

  if (isLoading || !asset) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Asset is returned as an object with named properties
  const assetData = asset as any;
  
  // Different asset type mappings for Dead Capital vs Verified Assets
  const dcAssetTypeMap = ['Residential', 'Commercial', 'Agricultural'];
  const dcAssetEmoji = ['🏠', '🏢', '🌾'];
  
  const vaAssetTypeMap = ['Real Estate', 'Agricultural Land', 'Gold', 'Copper Cathode', 'Treasury Bond', 'Corporate Equity'];
  const vaAssetEmoji = ['🏢', '🌾', '🪙', '🔶', '📜', '📊'];
  
  const assetTypeMap = type === 'dc' ? dcAssetTypeMap : vaAssetTypeMap;
  const assetEmoji = type === 'dc' ? dcAssetEmoji : vaAssetEmoji;

  const handleMintClick = () => {
    router.push(`/mint?assetId=${assetId}&tier=${tier}`);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">{assetEmoji[Number(assetData.assetType)] || '📦'}</div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {assetTypeMap[Number(assetData.assetType)] || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-500 font-mono">
              {assetId.slice(0, 10)}...{assetId.slice(-8)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Value</p>
          <p className="text-2xl font-bold text-green-600">
            ${Number(formatEther(assetData.estimatedValueUSD || BigInt(0))).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">Score</p>
          <p className="font-semibold">{assetData.verificationScore?.toString() || '0'}/100</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className={`font-semibold ${assetData.isActive ? 'text-green-600' : 'text-yellow-600'}`}>
            {assetData.isActive ? 'Active' : 'Pending'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Region</p>
          <p className="text-xs">
            {assetData.region === 0 ? 'Lusaka' : assetData.region === 1 ? 'Copperbelt' : 'Northern'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleMintClick}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          💰 Mint {type === 'dc' ? 'dcUSD' : 'vaUSD'}
        </button>
      </div>
    </div>
  );
}
