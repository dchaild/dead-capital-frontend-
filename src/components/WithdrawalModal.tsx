'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'Standard' | 'Premium';
}

const MOBILE_PROVIDERS = [
  { id: 'mtn', name: 'MTN', prefix: '+26096', icon: '📱' },
  { id: 'airtel', name: 'Airtel', prefix: '+26097', icon: '📱' },
  { id: 'zamtel', name: 'Zamtel', prefix: '+26009', icon: '📱' },
];

// Contract addresses - adjust these to match your deployment
const CONTRACTS = {
  dcUSD: '0x5fa6b2b382bbC8673d82AD614964069c31b6b680',
  vaUSD: '0x28266347e4780D278afec2784d4C241B7801D9b7',
};

const STABLECOIN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'mobileNumber', type: 'string' },
    ],
    name: 'requestZMWWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getRemainingDailyZMWLimit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function WithdrawalModal({ isOpen, onClose, tier }: WithdrawalModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(MOBILE_PROVIDERS[0]);
  const [error, setError] = useState('');

  const contractAddress = (tier === 'Standard' ? CONTRACTS.dcUSD : CONTRACTS.vaUSD) as `0x${string}`;

  // Read user balance
  const { data: userBalance } = useReadContract({
    address: contractAddress,
    abi: STABLECOIN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read remaining daily limit
  const { data: remainingLimit } = useReadContract({
    address: contractAddress,
    abi: STABLECOIN_ABI,
    functionName: 'getRemainingDailyZMWLimit',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Write contract - withdrawal
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const availableBalance = userBalance ? formatEther(userBalance) : '0';
  const dailyLimitRemaining = remainingLimit ? formatEther(remainingLimit) : '1000';

  const ZMW_RATE = 0.037; // ~27 ZMW = $1

  // Calculate fee (1%)
  const calculations = useMemo(() => {
    if (!amount || amount === '0') {
      return { fee: '0', netAmount: '0', zmwAmount: '0' };
    }
    const amt = parseFloat(amount);
    const fee = amt * 0.01; // 1% fee
    const net = amt - fee;
    const zmw = net / ZMW_RATE;
    return {
      fee: fee.toFixed(2),
      netAmount: net.toFixed(2),
      zmwAmount: zmw.toFixed(2),
    };
  }, [amount]);

  const fullMobileNumber = useMemo(() => {
    if (!mobileNumber) return '';
    const digits = mobileNumber.replace(/\D/g, '');
    return `${selectedProvider.prefix}${digits}`;
  }, [mobileNumber, selectedProvider]);

  const validateWithdrawal = () => {
    setError('');
    if (!amount || amount === '0') {
      setError('Enter an amount');
      return false;
    }
    const amt = parseFloat(amount);
    const net = parseFloat(calculations.netAmount);
    const balance = parseFloat(availableBalance);

    if (net < 10) {
      setError('Minimum withdrawal is $10 (after 1% fee)');
      return false;
    }
    if (net > 1000) {
      setError('Maximum withdrawal is $1000 per transaction');
      return false;
    }
    if (amt > balance) {
      setError(`Insufficient balance. You have ${balance.toFixed(2)} ${tier === 'Standard' ? 'dcUSD' : 'vaUSD'}`);
      return false;
    }
    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 10) {
      setError('Invalid mobile number');
      return false;
    }
    return true;
  };

  const handleWithdraw = async () => {
    if (!validateWithdrawal()) return;

    try {
      writeContract({
        address: contractAddress,
        abi: STABLECOIN_ABI,
        functionName: 'requestZMWWithdrawal',
        args: [parseEther(amount), fullMobileNumber],
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    }
  };

  // Reset on success
  if (isSuccess) {
    setTimeout(() => {
      setAmount('');
      setMobileNumber('');
      onClose();
    }, 3000);
  }

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-8 mb-8">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">💸 Cash Out to Mobile Money</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tier === 'Standard' ? 'dcUSD' : 'vaUSD'} → ZMW
              </p>
            </div>
            <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-700">×</button>
          </div>

          {/* Balance Info */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg p-4 mb-4 border-2 border-blue-200">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Your Balance</span>
              <span className="font-bold text-lg">{parseFloat(availableBalance).toFixed(2)} {tier === 'Standard' ? 'dcUSD' : 'vaUSD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Daily Limit Remaining</span>
              <span className="font-bold text-lg text-green-600">${parseFloat(dailyLimitRemaining).toFixed(2)}</span>
            </div>
          </div>

          {/* Provider */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Mobile Money Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p)}
                  className={`p-3 border-2 rounded-lg ${
                    selectedProvider.id === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                  disabled={isPending || isConfirming}
                >
                  <div className="text-2xl">{p.icon}</div>
                  <div className="text-xs font-medium">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Number */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Mobile Number</label>
            <div className="flex gap-2">
              <div className="px-3 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-mono text-sm">
                {selectedProvider.prefix}
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="123456"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isPending || isConfirming}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Amount (USD)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min: $10"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isPending || isConfirming}
              />
              <button
                onClick={() => {
                  const max = Math.min(parseFloat(availableBalance), parseFloat(dailyLimitRemaining), 1000);
                  setAmount(max.toFixed(2));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
              >
                MAX
              </button>
            </div>
            {error && <p className="text-red-600 text-sm font-medium mt-2">⚠️ {error}</p>}
          </div>

          {/* FEE BREAKDOWN - HIGHLIGHTED */}
          {amount && !error && parseFloat(amount) > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl p-5 mb-4 border-2 border-green-400 shadow-lg">
              <div className="flex justify-between mb-2 text-sm">
                <span>Withdrawal Amount</span>
                <span className="font-semibold">${amount}</span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span className="font-bold text-orange-600">Fee</span>
                <span className="font-semibold text-red-600">-${calculations.fee}</span>
              </div>
              <div className="border-t-2 border-green-300 my-3"></div>
              <div className="flex justify-between mb-2">
                <span className="font-bold">You Receive (USD)</span>
                <span className="font-bold text-xl text-green-600">${calculations.netAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">You Receive (ZMW)</span>
                <span className="font-bold text-3xl text-green-600">{calculations.zmwAmount}</span>
              </div>
              <p className="text-xs text-center text-gray-600 mt-3 bg-white/70 rounded px-2 py-1">
                ~27 ZMW = $1 USD
              </p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold">✓ Withdrawal Submitted!</p>
              <p className="text-sm text-green-700 mt-1">
                {calculations.zmwAmount} ZMW will arrive at {fullMobileNumber} in 5-10 minutes
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              disabled={isPending || isConfirming}
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={!amount || !mobileNumber || !!error || isPending || isConfirming}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Processing...' : '💸 Cash Out'}
            </button>
          </div>

          {/* Info 
          
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">✨ Fee Reduced to 1%</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Was 2%, now only 1%</li>
              <li>✓ Daily limit: $1,000</li>
              <li>✓ Funds arrive in 5-10 minutes</li>
              <li>✓ Supported: MTN, Airtel, Zamtel</li>
            </ul>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}