'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId, // 👈 Get current Chain ID
} from 'wagmi';
import { injected } from 'wagmi/connectors';

import { SIMPLE_STORAGE_ADDRESS } from '@/src/contracts/address';
import { SIMPLE_STORAGE_ABI } from '@/src/contracts/abi/simpleStorage';

export default function Page() {
  // WALLET & NETWORK STATE
  const { address, isConnected, chain } = useAccount(); // 👈 'chain' contains network info
  const chainId = useChainId();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' | null }>({
    message: '',
    type: null,
  });

  // Helper: Shorten Address
  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // READ/WRITE HOOKS
  const { data: value, isLoading: isReading, refetch } = useReadContract({
    address: SIMPLE_STORAGE_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Notifications logic
  useEffect(() => {
    if (isWriting) setToast({ message: 'Confirm in wallet...', type: 'loading' });
    if (isConfirming) setToast({ message: 'Transaction processing...', type: 'loading' });
    if (isConfirmed) {
      setToast({ message: 'Success! Value updated.', type: 'success' });
      refetch();
      setInputValue('');
      setTimeout(() => setToast({ message: '', type: null }), 5000);
    }
    if (writeError) {
      setToast({ message: 'Transaction failed', type: 'error' });
      setTimeout(() => setToast({ message: '', type: null }), 5000);
    }
  }, [isWriting, isConfirming, isConfirmed, writeError, refetch]);

  const handleSetValue = () => {
    if (!inputValue) return;
    writeContract({
      address: SIMPLE_STORAGE_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [BigInt(inputValue)],
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      
      {/* TOAST COMPONENT */}
      {toast.type && (
        <div className={`fixed top-5 right-5 p-4 rounded-md border shadow-lg z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-900 border-green-500' : 
          toast.type === 'error' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="w-full max-w-md border border-gray-700 rounded-lg p-6 space-y-6 bg-zinc-950">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold">Day 3 – dApp</h1>
          
          {/* 🔹 NETWORK BADGE */}
          {isConnected && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Network</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                chain?.name?.toLowerCase().includes('fuji') 
                  ? 'border-red-500 text-red-400 bg-red-950/30' 
                  : 'border-blue-500 text-blue-400 bg-blue-950/30'
              }`}>
                {chain?.name || `Chain ID: ${chainId}`}
              </span>
            </div>
          )}
        </div>

        {/* WALLET CONNECT */}
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={isConnecting}
            className="w-full bg-white text-black py-2 rounded font-semibold"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-800">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Account</p>
              <p className="font-mono text-sm">{shortenAddress(address!)}</p>
            </div>
            <button onClick={() => disconnect()} className="text-red-400 text-xs hover:underline">
              Disconnect
            </button>
          </div>
        )}

        {/* READ SECTION */}
        <div className="pt-2">
          <p className="text-sm text-gray-400 mb-1">Stored Value</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-blue-500">
              {isReading ? '...' : value?.toString() || '0'}
            </span>
            <button onClick={() => refetch()} className="text-gray-500 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <span className="text-xs text-gray-400">Refresh</span>
          </div>
        </div>

        {/* WRITE SECTION */}
        <div className="border-t border-gray-700 pt-6 space-y-3">
          <input
            type="number"
            placeholder="Enter new value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-3 rounded bg-zinc-900 border border-gray-700 focus:border-blue-500 outline-none"
          />

          <button
            onClick={handleSetValue}
            disabled={isWriting || isConfirming || !isConnected}
            className="w-full bg-blue-600 disabled:bg-gray-800 py-3 rounded font-bold hover:bg-blue-500 transition-colors"
          >
            {isWriting ? 'Check Wallet...' : isConfirming ? 'Confirming...' : 'Set Value'}
          </button>
        </div>
      </div>
    </main>
  );
}