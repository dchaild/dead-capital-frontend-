// hooks/usePosition.ts
import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS, ABIS } from '@/lib/contracts';

/**
 * Hook for reading position data from stablecoin contracts
 */
export function usePosition(tier: 'Standard' | 'Premium') {
  const { address } = useAccount();
  const contractAddress = tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address;
  const abi = tier === 'Standard' ? ABIS.dcUSD : ABIS.vaUSD;

  return {
    // Get user's position IDs
    useUserPositions: () => {
      return useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getUserPositions',
        args: [address!],
        query: {
          enabled: !!address,
        },
      });
    },

    // Get specific position details
    usePositionData: (positionId: bigint) => {
      return useReadContract({
        address: contractAddress,
        abi,
        functionName: 'positions',
        args: [positionId],
        query: {
          enabled: positionId !== undefined,
        },
      });
    },

    // Get collateral ratio for position
    useCollateralRatio: (positionId: bigint) => {
      return useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getCollateralRatio',
        args: [positionId],
        query: {
          enabled: positionId !== undefined,
        },
      });
    },

    // Get position health (liquidation risk)
    usePositionHealth: (positionId: bigint) => {
      return useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getPositionHealth',
        args: [positionId],
        query: {
          enabled: positionId !== undefined,
        },
      });
    },

    // Get remaining daily ZMW withdrawal limit
    useRemainingZMWLimit: () => {
      return useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getRemainingDailyZMWLimit',
        args: [address!],
        query: {
          enabled: !!address,
        },
      });
    },
  };
}