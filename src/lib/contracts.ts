// lib/contracts.ts
export const CONTRACTS = {
  router: { 
    address: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
  dcUSD: { 
    address: process.env.NEXT_PUBLIC_DCUSD_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
  vaUSD: { 
    address: process.env.NEXT_PUBLIC_VAUSD_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
  dcRegistry: { 
    address: process.env.NEXT_PUBLIC_DC_REGISTRY_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
  vaRegistry: { 
    address: process.env.NEXT_PUBLIC_VA_REGISTRY_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
  dcOracle: { 
    address: process.env.NEXT_PUBLIC_DC_ORACLE_ADDRESS as `0x${string}`,
    chainId: 421614 
  },
};

// Import ABIs
import StablecoinRouterABI from '@/abi/StablecoinRouter.json';
import DeadCapitalStablecoinABI from '@/abi/DeadCapitalStablecoin.json';
import VerifiedAssetStablecoinABI from '@/abi/VerifiedAssetStablecoin.json';
import DeadCapitalAssetRegistryABI from '@/abi/DeadCapitalAssetRegistry.json';
import VerifiedAssetRegistryABI from '@/abi/VerifiedAssetRegistry.json';

export const ABIS = {
  router: StablecoinRouterABI as any,
  dcUSD: DeadCapitalStablecoinABI as any,
  vaUSD: VerifiedAssetStablecoinABI as any,
  dcRegistry: DeadCapitalAssetRegistryABI as any,
  vaRegistry: VerifiedAssetRegistryABI as any,
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';