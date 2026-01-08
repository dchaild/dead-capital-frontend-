import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, arbitrumSepolia, hardhat } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SADC Assets & Wealth',
  projectId: '6069b354d743b4f8c94d698715898995', // Get from https://cloud.walletconnect.com
  chains: [arbitrumSepolia, sepolia, hardhat], // Arbitrum Sepolia primary
  ssr: true, // Enable server-side rendering
});
