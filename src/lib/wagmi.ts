import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, hardhat } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Dead Capital Protocol',
  projectId: '6069b354d743b4f8c94d698715898995', // Get from https://cloud.walletconnect.com
  chains: [sepolia, hardhat],
  ssr: true, // Enable server-side rendering
});
