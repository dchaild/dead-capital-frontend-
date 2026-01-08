'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useStablecoin } from '@/hooks/useStablecoin';
import { usePosition } from '@/hooks/usePosition';
import { CONTRACTS, ABIS } from '@/lib/contracts';

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionId: bigint;
  tier: 'Standard' | 'Premium';
}

/**
 * RepayModal - Repay debt on existing positions
 * 
 * Features:
 * - Partial or full repayment
 * - Shows accrued stability fees (3% dcUSD, 2% vaUSD)
 * - Position health improvement preview
 * - One-click "Close Position" for full repayment
 */
export default function RepayModal({ isOpen, onClose, positionId, tier }: RepayModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isFullRepay, setIsFullRepay] = useState(false);

  const {
    burnDebt,
    closePosition,
    isPending,
    isConfirming,
    isSuccess,
  } = useStablecoin();

  const { usePositionData, useCollateralRatio } = usePosition(tier);

  // Get position data
  const { data: position, isLoading: positionLoading } = usePositionData(positionId);
  const { data: currentRatio } = useCollateralRatio(positionId);

  // Get user's stablecoin balance
  const contractAddress = tier === 'Standard' ? CONTRACTS.dcUSD.address : CONTRACTS.vaUSD.address;
  const { data: userBalance } = useReadContract({
    address: contractAddress,
    abi: tier === 'Standard' ? ABIS.dcUSD : ABIS.vaUSD,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Extract position details
  const debt = position ? formatEther(position[1]) : '0'; // debtAmount
  const assetValue = position ? formatEther(position[2]) : '0'; // collateralValue
  const lastUpdate = position ? Number(position[3]) : 0; // lastUpdateTime

  // Calculate accrued stability fee
  const accruedFee = useMemo(() => {
    if (!position) return '0';
    const feeRate = tier === 'Standard' ? 0.03 : 0.02; // 3% or 2% APR
    const timeElapsed = Date.now() / 1000 - lastUpdate;
    const yearsElapsed = timeElapsed / (365 * 24 * 60 * 60);
    const fee = parseFloat(debt) * feeRate * yearsElapsed;
    return fee.toFixed(4);
  }, [debt, lastUpdate, tier, position]);

  // Total amount owed (debt + fees)
  const totalOwed = useMemo(() => {
    return (parseFloat(debt) + parseFloat(accruedFee)).toFixed(4);
  }, [debt, accruedFee]);

  // User's available balance
  const availableBalance = userBalance ? formatEther(userBalance) : '0';

  // Calculate new position health after repayment
  const newPositionHealth = useMemo(() => {
    if (!amount || !position) return null;
    const repayAmount = parseFloat(amount);
    const newDebt = parseFloat(totalOwed) - repayAmount;
    
    if (newDebt <= 0) return 'Closed';
    
    const ratio = (parseFloat(assetValue) / newDebt) * 100;
    const minRatio = tier === 'Standard' ? 150 : 110;
    
    if (ratio >= minRatio * 2) return 'Healthy';
    if (ratio >= minRatio * 1.5) return 'Good';
    if (ratio >= minRatio * 1.2) return 'Moderate';
    return 'At Risk';
  }, [amount, assetValue, totalOwed, tier, position]);

  // Validation
  const validateAmount = (value: string) => {
    setError('');
    
    if (!value || value === '0') {
      setError('Enter an amount');
      return false;
    }

    const numValue = parseFloat(value);
    const balance = parseFloat(availableBalance);
    const owed = parseFloat(totalOwed);

    if (numValue > balance) {
      setError(`Insufficient balance. You have ${parseFloat(availableBalance).toFixed(2)} ${tier === 'Standard' ? 'dcUSD' : 'vaUSD'}`);
      return false;
    }

    if (numValue > owed) {
      setError(`Cannot repay more than owed (${parseFloat(totalOwed).toFixed(2)})`);
      return false;
    }

    return true;
  };

  // Handle repayment
  const handleRepay = async () => {
    if (isFullRepay) {
      // Close position (full repayment + unlock asset)
      try {
        await closePosition(positionId, tier);
      } catch (err: any) {
        setError(err.message || 'Transaction failed');
      }
    } else {
      // Partial repayment
      if (!validateAmount(amount)) return;

      try {
        await burnDebt(positionId, amount, tier);
      } catch (err: any) {
        setError(err.message || 'Transaction failed');
      }
    }
  };

  // Handle full repay toggle
  const handleFullRepayToggle = () => {
    setIsFullRepay(!isFullRepay);
    if (!isFullRepay) {
      setAmount(totalOwed);
    } else {
      setAmount('');
    }
  };

  // Reset on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setAmount('');
        setIsFullRepay(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Repay Loan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {positionLoading ? (
          <div className="text-center py-8">Loading position details...</div>
        ) : !position ? (
          <div className="text-center py-8 text-red-600">Position not found</div>
        ) : (
          <>
            {/* Position Summary */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Original Debt</span>
                <span className="font-semibold">{parseFloat(debt).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Accrued Fees ({tier === 'Standard' ? '3%' : '2%'} APR)</span>
                <span className="font-semibold text-yellow-600">+{accruedFee} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Total Owed</span>
                <span className="font-bold text-lg">{parseFloat(totalOwed).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your Balance</span>
                <span className={`font-semibold ${parseFloat(availableBalance) >= parseFloat(totalOwed) ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(availableBalance).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </span>
              </div>
            </div>

            {/* Full Repay Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFullRepay}
                  onChange={handleFullRepayToggle}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isPending || isConfirming}
                />
                <span className="text-sm font-medium">
                  Close Position (Full Repayment + Unlock Asset)
                </span>
              </label>
            </div>

            {/* Amount Input */}
            {!isFullRepay && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Repayment Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to repay"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                    disabled={isPending || isConfirming}
                  />
                  <button
                    onClick={() => setAmount(totalOwed)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    MAX
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                )}
              </div>
            )}

            {/* New Position Health Preview */}
            {!isFullRepay && amount && !error && newPositionHealth && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Position Health</span>
                  <span className={`font-semibold ${
                    newPositionHealth === 'Healthy' ? 'text-green-600' :
                    newPositionHealth === 'Good' ? 'text-blue-600' :
                    newPositionHealth === 'Moderate' ? 'text-yellow-600' :
                    newPositionHealth === 'Closed' ? 'text-gray-600' :
                    'text-red-600'
                  }`}>
                    {newPositionHealth}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Remaining debt: {(parseFloat(totalOwed) - parseFloat(amount)).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </div>
              </div>
            )}

            {/* Full Repay Info */}
            {isFullRepay && (
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  ✓ This will repay the full debt and unlock your asset
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Required: {parseFloat(totalOwed).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {isSuccess && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p className="text-green-800 dark:text-green-200 font-semibold">
                  ✓ {isFullRepay ? 'Position closed successfully!' : `Successfully repaid ${amount} ${tier === 'Standard' ? 'dcUSD' : 'vaUSD'}`}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isPending || isConfirming}
              >
                Cancel
              </button>
              <button
                onClick={handleRepay}
                disabled={
                  (!isFullRepay && (!amount || !!error)) || 
                  (isFullRepay && parseFloat(availableBalance) < parseFloat(totalOwed)) ||
                  isPending || 
                  isConfirming
                }
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm in Wallet...' :
                 isConfirming ? 'Processing...' :
                 isFullRepay ? 'Close Position' : 'Repay Loan'}
              </button>
            </div>

            {/* Warning */}
            {isFullRepay && parseFloat(availableBalance) < parseFloat(totalOwed) && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-800 dark:text-red-200">
                  ⚠️ Insufficient balance to close position. You need {parseFloat(totalOwed).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
