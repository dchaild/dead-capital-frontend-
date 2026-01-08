'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Contract addresses from Arbitrum Sepolia deployment
const CONTRACTS = {
  stablecoinRouter: '0xC21e33DA9B3ff86d1A16c933459dAaF23FF72423',
  dcUSD: '0x5fa6b2b382bbC8673d82AD614964069c31b6b680',
  vaUSD: '0x28266347e4780D278afec2784d4C241B7801D9b7',
  deadCapitalRegistry: '0x2bBEEbe6137F5b10B0DefDFA42e8f975f17F8f86',
};

// Minimal ABI for the functions we need
const ROUTER_ABI = [
  {
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    name: 'upgradeStandardToPremium',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const STABLECOIN_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserPositions',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'positionId', type: 'bytes32' }],
    name: 'getPosition',
    outputs: [
      { name: 'assetId', type: 'bytes32' },
      { name: 'debt', type: 'uint256' },
      { name: 'collateralRatio', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REGISTRY_ABI = [
  {
    inputs: [{ name: 'assetId', type: 'bytes32' }],
    name: 'getAssetConfidenceScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { address } = useAccount();
  const [selectedAssetId, setSelectedAssetId] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user's Standard (dcUSD) positions
  const { data: userPositions } = useReadContract({
    address: CONTRACTS.dcUSD as `0x${string}`,
    abi: STABLECOIN_ABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get selected position details
  const { data: positionData } = useReadContract({
    address: CONTRACTS.dcUSD as `0x${string}`,
    abi: STABLECOIN_ABI,
    functionName: 'getPosition',
    args: selectedAssetId ? [selectedAssetId] : undefined,
    query: { enabled: !!selectedAssetId },
  });

  // Get asset confidence score
  const { data: confidenceScore } = useReadContract({
    address: CONTRACTS.deadCapitalRegistry as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: 'getAssetConfidenceScore',
    args: selectedAssetId ? [selectedAssetId] : undefined,
    query: { enabled: !!selectedAssetId },
  });

  // Upgrade transaction
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isEligible = useMemo(() => {
    if (!confidenceScore) return false;
    return Number(confidenceScore) >= 90;
  }, [confidenceScore]);

  const handleUpgrade = async () => {
    setError('');
    setSuccess('');

    if (!selectedAssetId) {
      setError('Please select a position to upgrade');
      return;
    }

    if (!isEligible) {
      setError('Asset confidence score must be ≥ 90% to upgrade');
      return;
    }

    try {
      writeContract({
        address: CONTRACTS.stablecoinRouter as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'upgradeStandardToPremium',
        args: [selectedAssetId],
      });
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err?.message || 'Upgrade failed. Please try again.');
    }
  };

  // Reset on success
  if (isSuccess && !success) {
    setSuccess('Upgrade successful! Your position is now Premium tier ⭐');
    setTimeout(() => {
      setSelectedAssetId(null);
      onClose();
      setSuccess('');
    }, 3000);
  }

  if (!isOpen) return null;

  const currentDebt = positionData ? formatEther(positionData[1]) : '0';
  const currentRatio = positionData ? Number(positionData[2]) / 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 mb-8">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">⭐ Upgrade to Premium</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Standard → Premium Tier
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-3xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-4 mb-6 border-2 border-amber-200 dark:border-amber-700">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
            ✨ Benefits of Premium Tier
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-700 dark:text-gray-300">Collateral Ratio:</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                200% → 120-150%
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">Annual Fee:</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                3% → 2%
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">Liquidation Penalty:</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                13% → 10%
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">Status:</p>
              <p className="font-bold text-purple-600 dark:text-purple-400">
                Verified ✓
              </p>
            </div>
          </div>
        </div>

        {/* Position Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Select Position to Upgrade
          </label>
          {!userPositions || userPositions.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
              No Standard tier positions found. Mint dcUSD first to create a position.
            </div>
          ) : (
            <div className="space-y-2">
              {userPositions.map((positionId) => (
                <button
                  key={positionId}
                  onClick={() => setSelectedAssetId(positionId)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAssetId === positionId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400'
                  }`}
                  disabled={isPending || isConfirming}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {positionId.slice(0, 10)}...{positionId.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Standard Tier
                      </p>
                    </div>
                    {selectedAssetId === positionId && (
                      <span className="text-blue-600 dark:text-blue-400 text-xl">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Eligibility Check */}
        {selectedAssetId && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            isEligible 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Asset Confidence Score</p>
                <p className={`text-2xl font-bold ${
                  isEligible 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {confidenceScore ? Number(confidenceScore) : 0}%
                </p>
              </div>
              <div className="text-right">
                {isEligible ? (
                  <span className="text-green-600 dark:text-green-400 text-3xl">✓</span>
                ) : (
                  <div>
                    <span className="text-red-600 dark:text-red-400 text-3xl">✗</span>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Need ≥90%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Before/After Comparison */}
        {selectedAssetId && positionData && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Position After Upgrade
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Current Debt:</p>
                <p className="font-bold text-lg">${parseFloat(currentDebt).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">New Collateral Ratio:</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                  ~{Math.floor(currentRatio * 0.6)}%
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Your debt stays the same, but collateral requirements decrease and fees reduce.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm font-semibold">✓ {success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all"
            disabled={isPending || isConfirming}
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={!selectedAssetId || !isEligible || isPending || isConfirming}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all"
          >
            {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Upgrading...' : '⭐ Upgrade to Premium'}
          </button>
        </div>

        {/* Requirements Notice */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>Requirements:</strong> Asset must have confidence score ≥90% (verified documentation). 
            Upload title deeds or official documents to your asset to increase confidence score.
          </p>
        </div>
      </div>
    </div>
  );
}
