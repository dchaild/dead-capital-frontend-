// Contract addresses from environment
export const CONTRACTS = {
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`,
  dcUSD: process.env.NEXT_PUBLIC_DCUSD_ADDRESS as `0x${string}`,
  vaUSD: process.env.NEXT_PUBLIC_VAUSD_ADDRESS as `0x${string}`,
  dcRegistry: process.env.NEXT_PUBLIC_DC_REGISTRY_ADDRESS as `0x${string}`,
  vaRegistry: process.env.NEXT_PUBLIC_VA_REGISTRY_ADDRESS as `0x${string}`,
} as const;

// Import ABIs
import RouterABI from '@/abi/StablecoinRouter.json';
import dcUSDABI from '@/abi/DeadCapitalStablecoin.json';
import vaUSDABI from '@/abi/VerifiedAssetStablecoin.json';

export const ABIS = {
  router: RouterABI.abi,
  dcUSD: dcUSDABI.abi,
  vaUSD: vaUSDABI.abi,
} as const;
