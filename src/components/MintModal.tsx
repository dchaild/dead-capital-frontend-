'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useStablecoin } from '@/hooks/useStablecoin';
import { useAsset } from '@/hooks/useAssetRegistry';

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: `0x${string}`;
  tier: 'Standard' | 'Premium';
}

export default function MintModal({ isOpen, onClose, assetId, tier }: MintModalProps) {
  const { address } = useAccount();
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
    
    if (!validateAmount(amount)) {
      console.log('Validation failed');
      return;
    }

    try {
      console.log('Calling mint function...');
      if (tier === 'Standard') {
        await depositAndMintStandard(assetId, amount);
      } else {
        await depositAndMintPremium(assetId, amount);
      }
      console.log('Mint transaction sent');
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

  if (isSuccess) {
    setTimeout(() => {
      setAmount('');
      onClose();
    }, 2000);
  }

  if (!isOpen) return null;

  const assetData = asset as any;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Mint {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {assetLoading ? (
          <div className="text-center py-8">Loading asset details...</div>
        ) : !asset ? (
          <div className="text-center py-8 text-red-600">Asset not found</div>
        ) : (
          <>
            {/* Asset Info */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Asset Value</span>
                <span className="font-semibold text-gray-900">
                  ${Number(formatEther(assetData.estimatedValueUSD || BigInt(0))).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Collateral Ratio</span>
                <span className="font-semibold text-gray-900">{collateralRatio}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Mintable</span>
                <span className="font-semibold text-green-600">
                  {parseFloat(maxMintable).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </span>
              </div>
            </div>

            {/* Amount Input - MAIN INPUT FIELD */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-900">
                Amount to Mint
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum: ${minAmount}`}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isPending || isConfirming}
                />
                <button
                  onClick={() => setAmount(maxMintable)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 font-semibold"
                  type="button"
                >
                  MAX
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-1 font-semibold">{error}</p>
              )}
            </div>

            {/* Position Health */}
            {amount && !error && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Position Health</span>
                  <span className={`font-semibold ${
                    positionHealth === 'Healthy' ? 'text-green-600' :
                    positionHealth === 'Good' ? 'text-blue-600' :
                    positionHealth === 'Moderate' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {positionHealth}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Stability Fee: {tier === 'Standard' ? '3%' : '2%'} APR
                </div>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  ✓ Successfully minted {amount} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                disabled={isPending || isConfirming}
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending || isConfirming || !!error || !amount}
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Mint'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
