'use client';
import { useState } from 'react';
import MintModal from '@/components/MintModal';
import RepayModal from '@/components/RepayModal';
import WithdrawalModal from '@/components/WithdrawalModal';
import UpgradeModal from '@/components/UpgradeModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  // State management for all 4 modals
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            SADC Asset Simple
          </h1>
          <ConnectButton />
        </div>
      </header>

      <div className="py-8">
        <Dashboard 
          onMintClick={() => setIsMintOpen(true)}
          onRepayClick={() => setIsRepayOpen(true)}
          onWithdrawalClick={() => setIsWithdrawalOpen(true)}
          onUpgradeClick={() => setIsUpgradeOpen(true)}
        />
      </div>

      {/* All 4 Modals */}
      <MintModal isOpen={isMintOpen} onClose={() => setIsMintOpen(false)} />
      <RepayModal isOpen={isRepayOpen} onClose={() => setIsRepayOpen(false)} />
      <WithdrawalModal isOpen={isWithdrawalOpen} onClose={() => setIsWithdrawalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </main>
  );
}
