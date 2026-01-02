import { useReadContract } from 'wagmi';
import { CONTRACTS, ABIS } from '@/lib/contracts';

/**
 * Hook for StablecoinRouter view operations
 * - Get asset tier (Standard/Premium)
 * - Get balance breakdown
 * - Get contract addresses
 */
export function useRouter() {
  return {
    // Check which tier an asset belongs to
    useAssetTier: (assetId: `0x${string}`) => {
      return useReadContract({
        address: CONTRACTS.router,
        abi: ABIS.router,
        functionName: 'getAssetTier',
        args: [assetId],
      });
    },

    // Get total balance across both tiers
    useTotalBalance: (userAddress: `0x${string}`) => {
      return useReadContract({
        address: CONTRACTS.router,
        abi: ABIS.router,
        functionName: 'totalBalance',
        args: [userAddress],
        query: {
          enabled: !!userAddress,
        },
      });
    },

    // Get tier breakdown for Quality Badge display
    useTierBreakdown: (userAddress: `0x${string}`) => {
      return useReadContract({
        address: CONTRACTS.router,
        abi: ABIS.router,
        functionName: 'getTierBreakdown',
        args: [userAddress],
        query: {
          enabled: !!userAddress,
        },
      });
    },
  };
}