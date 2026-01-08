'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import WithdrawalModal from '@/components/WithdrawalModal';

export default function PositionsPage() {
  const { address, isConnected } = useAccount();
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'Standard' | 'Premium'>('Standard');

  const handleCashOut = (tier: 'Standard' | 'Premium') => {
    setSelectedTier(tier);
    setWithdrawalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Fixed */}
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Positions</h1>
          <ConnectButton />
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="container mx-auto px-4 py-8 pb-20">
        {!isConnected ? (
          <div className="max-w-md mx-auto text-center mt-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800 dark:text-yellow-200">
                Please connect your wallet to view your positions
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-gray-600 dark:text-gray-400">
              Manage your stablecoin positions and cash out to ZMW Mobile Money
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button
           onClick={() => {
             console.log("Button clicked!");
              handleCashOut('Standard');}}
                className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all"
              >
                <div className="text-3xl mb-3">💸</div>
                <div className="text-xl font-semibold mb-1">Cash Out dcUSD</div>
                <div className="text-sm opacity-90">Withdraw to ZMW Mobile Money</div>
                <div className="mt-3 text-xs bg-white/20 rounded px-3 py-1 inline-block">
                  1% Fee | $1,000 Daily Limit
                </div>
              </button>
              
              <button
                onClick={() => handleCashOut('Premium')}
                className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <div className="text-3xl mb-3">💸</div>
                <div className="text-xl font-semibold mb-1">Cash Out vaUSD</div>
                <div className="text-sm opacity-90">Withdraw to ZMW Mobile Money</div>
                <div className="mt-3 text-xs bg-white/20 rounded px-3 py-1 inline-block">
                  1% Fee | $1,000 Daily Limit
                </div>
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3">How It Works</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li> Click "Cash Out" button above</li>
                <li> Enter your mobile money number (Airtel or MTN)</li>
                <li> Enter the amount to withdraw (max $1,000/day)</li>
                <li> Confirm transaction - 1% fee will be deducted</li>
                <li> Receive ZMW directly to your mobile money account</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        tier={selectedTier}
      />
    </div>
  );
}
