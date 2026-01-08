'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useStablecoin } from '@/hooks/useStablecoin';
import { useAsset } from '@/hooks/useAssetRegistry';
import { CONTRACTS } from '@/lib/contracts';

export default function MintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected, chain } = useAccount();
  
  const assetId = searchParams.get('assetId') as `0x${string}`;
  const tier = searchParams.get('tier') as 'Standard' | 'Premium';
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const {
    depositAndMintStandard,
    depositAndMintPremium,
    isPending,
    isConfirming,
    isSuccess,
  } = useStablecoin();

  const { asset, isLoading: assetLoading } = useAsset(
    assetId,
    tier === 'Standard' ? 'dc' : 'va'
  );

  // Redirect if no asset ID
  useEffect(() => {
    if (!assetId || !tier) {
      router.push('/assets');
    }
  }, [assetId, tier, router]);

  // Redirect back on success
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        router.push('/assets');
      }, 3000);
    }
  }, [isSuccess, router]);

  const collateralRatio = useMemo(() => {
    if (!asset) return 150;
    const assetData = asset as any;
    
    if (tier === 'Standard') {
      const confidence = assetData.verificationScore || 0;
      if (confidence >= 80) return 150;
      if (confidence >= 60) return 200;
      return 300;
    } else {
      const assetType = assetData.assetType || 0;
      if (assetType === 0) return 110;
      if (assetType === 2) return 120;
      if (assetType === 3) return 125;
      return 140;
    }
  }, [asset, tier]);

  const maxMintable = useMemo(() => {
    if (!asset) return '0';
    const assetData = asset as any;
    const assetValue = assetData.estimatedValueUSD || BigInt(0);
    const maxAmount = (BigInt(assetValue) * BigInt(100)) / BigInt(collateralRatio);
    return formatEther(maxAmount);
  }, [asset, collateralRatio]);

  const minAmount = tier === 'Standard' ? '100' : '1000';

  const validateAmount = (value: string) => {
    setError('');
    
    if (!value || value === '0') {
      setError('Enter an amount');
      return false;
    }

    const numValue = parseFloat(value);
    const minValue = parseFloat(minAmount);
    const maxValue = parseFloat(maxMintable);

    if (numValue < minValue) {
      setError(`Minimum: ${minAmount} ${tier === 'Standard' ? 'dcUSD' : 'vaUSD'}`);
      return false;
    }

    if (numValue > maxValue) {
      setError(`Maximum: ${parseFloat(maxMintable).toFixed(2)} (${collateralRatio}% ratio)`);
      return false;
    }

    return true;
  };

  const handleMint = async () => {
    console.log('Mint button clicked!', { assetId, amount, tier });
    
    // Check wallet connection
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }
    
    // Check network
    if (chain?.id !== 421614) {
      setError('Please switch to Arbitrum Sepolia network (Chain ID: 421614)');
      return;
    }
    
    if (!validateAmount(amount)) {
      console.log('Validation failed');
      return;
    }

    try {
      console.log('Calling mint function...');
      console.log('Contract address:', tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address);
      console.log('Amount in ether:', amount);
      console.log('Amount in wei:', parseEther(amount).toString());
      
      if (tier === 'Standard') {
        console.log('Calling depositAndMintStandard with:', { assetId, amount });
        depositAndMintStandard(assetId, amount);
        console.log('depositAndMintStandard called');
      } else {
        console.log('Calling depositAndMintPremium with:', { assetId, amount });
        depositAndMintPremium(assetId, amount);
        console.log('depositAndMintPremium called');
      }
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Transaction failed');
    }
  };

  const positionHealth = useMemo(() => {
    if (!amount || !asset) return 'Unknown';
    const assetData = asset as any;
    const assetValue = parseFloat(formatEther(assetData.estimatedValueUSD || BigInt(0)));
    const debt = parseFloat(amount);
    const ratio = (assetValue / debt) * 100;
    
    if (ratio >= collateralRatio * 1.5) return 'Healthy';
    if (ratio >= collateralRatio * 1.2) return 'Good';
    if (ratio >= collateralRatio) return 'Moderate';
    return 'At Risk';
  }, [amount, asset, collateralRatio]);

  if (!assetId || !tier) {
    return null;
  }

  const assetData = asset as any;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/assets')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2 font-semibold"
          >
            ← Back to Assets
          </button>
          <h1 className="text-4xl font-bold text-gray-900">
            Mint {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
          </h1>
          <p className="text-gray-600 mt-2">
            Borrow stablecoins against your registered asset
          </p>
        </div>

        {assetLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading asset details...</p>
          </div>
        ) : !asset ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600">Asset not found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Asset Info */}
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset ID</span>
                  <span className="font-mono text-sm text-gray-900">
                    {assetId.slice(0, 10)}...{assetId.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset Value</span>
                  <span className="font-semibold text-gray-900">
                    ${Number(formatEther(assetData.estimatedValueUSD || BigInt(0))).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collateral Ratio</span>
                  <span className="font-semibold text-gray-900">{collateralRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Mintable</span>
                  <span className="font-semibold text-green-600 text-lg">
                    {parseFloat(maxMintable).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-3 text-gray-900">
                Amount to Mint
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum: ${minAmount}`}
                  className="w-full pl-6 pr-28 py-4 text-2xl text-right border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isPending || isConfirming}
                />
                <button
                  onClick={() => setAmount(maxMintable)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  type="button"
                >
                  MAX
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2 font-semibold">{error}</p>
              )}
            </div>

            {/* Position Health */}
            {amount && !error && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Position Health</span>
                  <span className={`font-bold text-xl ${
                    positionHealth === 'Healthy' ? 'text-green-600' :
                    positionHealth === 'Good' ? 'text-blue-600' :
                    positionHealth === 'Moderate' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {positionHealth}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Stability Fee: {tier === 'Standard' ? '3%' : '2%'} APR
                </div>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 font-semibold text-lg">
                  ✓ Successfully minted {amount} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Redirecting back to assets...
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/assets')}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-lg"
                disabled={isPending || isConfirming}
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={isPending || isConfirming || !!error || !amount}
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : '💰 Mint Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
