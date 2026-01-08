// hooks/useAssetRegistry.ts
'use client';

import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import DeadCapitalRegistryABI from '@/abi/DeadCapitalAssetRegistry.json';
import VerifiedAssetRegistryABI from '@/abi/VerifiedAssetRegistry.json';

export interface Asset {
  assetId: `0x${string}`;
  value: bigint;
  confidence: bigint;
  assetType: number;
  owner: `0x${string}`;
  evidenceHash: string;
  registeredAt: bigint;
  lastUpdated: bigint;
  isActive: boolean;
}

/**
 * Hook to get registry stats and user's assets
 * @param type - 'dc' for Dead Capital or 'va' for Verified Assets
 */
export function useAssetRegistry(type: 'dc' | 'va' = 'dc') {
  const { address } = useAccount();
  const contract = type === 'dc' ? CONTRACTS.dcRegistry : CONTRACTS.vaRegistry;
  const abi = type === 'dc' ? DeadCapitalRegistryABI : VerifiedAssetRegistryABI;

  // Get user's asset IDs
  const { data: userAssetIds, refetch: refetchUser, isLoading, error } = useReadContract({
    address: contract.address,
    abi: abi,
    functionName: 'getOwnerAssets',
    args: address ? [address] : undefined,
    chainId: 421614,
    query: {
      enabled: !!address,
    },
  });

  return {
    totalAssets: userAssetIds ? BigInt(userAssetIds.length) : BigInt(0),
    userAssetIds: userAssetIds as `0x${string}`[] | undefined,
    isLoading,
    error,
    refetch: () => {
      refetchUser();
    },
  };
}

/**
 * Hook to get single asset details
 * @param assetId - The asset ID (bytes32)
 * @param type - 'dc' for Dead Capital or 'va' for Verified Assets
 */
export function useAsset(
  assetId: `0x${string}`, 
  type: 'dc' | 'va' = 'dc'
) {
  const contract = type === 'dc' ? CONTRACTS.dcRegistry : CONTRACTS.vaRegistry;
  const abi = type === 'dc' ? DeadCapitalRegistryABI : VerifiedAssetRegistryABI;

  const { data: asset, refetch, isLoading, error } = useReadContract({
    address: contract.address,
    abi: abi,
    functionName: 'getAsset',
    args: [assetId],
    chainId: 421614,
    query: {
      enabled: !!assetId && assetId !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
  });

  return {
    asset: asset as Asset | undefined,
    isLoading,
    error,
    refetch,
  };
}
