import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ABIS } from '@/lib/contracts';
import { parseEther } from 'viem';

/**
 * Hook for stablecoin mint/burn operations
 * Calls DeadCapitalStablecoin and VerifiedAssetStablecoin directly
 */
export function useStablecoin() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    // Mint from Standard tier (dcUSD)
    depositAndMintStandard: async (assetId: `0x${string}`, amount: string) => {
      return writeContract({
        address: CONTRACTS.dcUSD.address,
        abi: ABIS.dcUSD,
        functionName: 'depositAndMint',
        args: [assetId, parseEther(amount)],
      });
    },

    // Mint from Premium tier (vaUSD)
    depositAndMintPremium: async (assetId: `0x${string}`, amount: string) => {
      return writeContract({
        address: CONTRACTS.vaUSD.address,
        abi: ABIS.vaUSD,
        functionName: 'depositAndMint',
        args: [assetId, parseEther(amount)],
      });
    },

    // Burn debt from position
    burnDebt: async (
      positionId: bigint,
      amount: string,
      tier: 'Standard' | 'Premium'
    ) => {
      const contractAddress = tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address;
      const abi = tier === 'Standard' ? ABIS.dcUSD : ABIS.vaUSD;

      return writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'burnDebt',
        args: [positionId, parseEther(amount)],
      });
    },

    // Close position completely
    closePosition: async (positionId: bigint, tier: 'Standard' | 'Premium') => {
      const contractAddress = tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address;
      const abi = tier === 'Standard' ? ABIS.dcUSD : ABIS.vaUSD;

      return writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'closePosition',
        args: [positionId],
      });
    },

      // Request ZMW mobile money withdrawal
    requestZMWWithdrawal: async (
      amount: string,
      mobileNumber: string,
      tier: 'Standard' | 'Premium'
    ) => {
      const contractAddress = tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address;
      const abi = tier === 'Standard' ? ABIS.dcUSD : ABIS.vaUSD;

      return writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'requestZMWWithdrawal',
        args: [parseEther(amount), mobileNumber],
      });
    },

    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
