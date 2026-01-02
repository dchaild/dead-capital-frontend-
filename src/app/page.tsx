import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            SADC Asset Wealth
          </h1>
          <ConnectButton />
        </div>
      </header>

      <div className="py-8">
        <Dashboard />
      </div>
    </main>
  );
}
