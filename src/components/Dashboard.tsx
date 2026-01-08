'use client';

import { useAccount } from 'wagmi';
import { useRouter as useNextRouter } from 'next/navigation';
import { useRouter } from '@/hooks/useRouter';
import { formatEther } from 'viem';

interface DashboardProps {
  onRepayClick: () => void;
  onWithdrawalClick: () => void;
  onUpgradeClick: () => void;
}

export function Dashboard({ onRepayClick, onWithdrawalClick, onUpgradeClick }: DashboardProps) {
  const { address, isConnected } = useAccount();
  const router = useNextRouter(); // Next.js navigation
  const { useTotalBalance, useTierBreakdown } = useRouter(); // Contract hooks

  const { data: balanceData } = useTotalBalance(address as `0x${string}`);
  const { data: tierData } = useTierBreakdown(address as `0x${string}`);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view dashboard</p>
      </div>
    );
  }

  const [total, standard, premium] = balanceData || [0n, 0n, 0n];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Your Balance</h1>
      <div className="text-5xl font-bold mb-8 text-emerald-600">
        {formatEther(total)} <span className="text-gray-500 text-3xl">AssetDollars</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Standard Tier Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Standard</div>
          <div className="text-2xl font-bold">{formatEther(standard)}</div>
          <div className="text-xs text-gray-500 mt-2">
            {tierData && tierData[2] ? `${tierData[2][0]}%` : '0%'}
          </div>
        </div>

        {/* Premium Tier Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg shadow-md border-2 border-yellow-300">
          <div className="text-sm text-yellow-800 mb-2 flex items-center gap-1">
            Premium ⭐
          </div>
          <div className="text-2xl font-bold">{formatEther(premium)}</div>
          <div className="text-xs text-yellow-700 mt-2">
            {tierData && tierData[2] ? `${tierData[2][1]}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <button 
          onClick={() => router.push('/assets')}
          className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg transition-all"
        >
          Mint
        </button>
        
        <button 
          onClick={onRepayClick}
          className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg transition-all"
        >
          Make Payment
        </button>
        
        <button 
          onClick={onWithdrawalClick}
          className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg transition-all"
        >
          Cash Out
        </button>
        
        <button 
          onClick={onUpgradeClick}
          className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 font-semibold shadow-lg transition-all"
        >
          ⭐ Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
