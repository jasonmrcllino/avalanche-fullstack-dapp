'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt, // 👈 Hook to track tx status
} from 'wagmi';
import { injected } from 'wagmi/connectors';

import { SIMPLE_STORAGE_ADDRESS } from '@/src/contracts/address';
import { SIMPLE_STORAGE_ABI } from '@/src/contracts/abi/simpleStorage';

export default function Page() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' | null }>({
    message: '',
    type: null,
  });

  // Helper: Shorten Address (e.g., 0x123...abcd)
  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // READ
  const { data: value, isLoading: isReading, refetch } = useReadContract({
    address: SIMPLE_STORAGE_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  // WRITE
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();

  // 🔹 TRACK TRANSACTION STATUS
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle Notifications
  useEffect(() => {
    if (isWriting) setToast({ message: 'Waiting for wallet approval...', type: 'loading' });
    if (isConfirming) setToast({ message: 'Transaction confirming on Avalanche...', type: 'loading' });
    if (isConfirmed) {
      setToast({ message: 'Value updated successfully!', type: 'success' });
      refetch(); // Auto-refresh the read value
      setInputValue('');
      setTimeout(() => setToast({ message: '', type: null }), 5000); // Hide after 5s
    }
    if (writeError) {
      setToast({ message: 'Transaction failed or rejected', type: 'error' });
      setTimeout(() => setToast({ message: '', type: null }), 5000);
    }
  }, [isWriting, isConfirming, isConfirmed, writeError, refetch]);

  const handleSetValue = async () => {
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
      {/* 🔹 TOAST NOTIFICATION */}
      {toast.type && (
        <div className={`fixed top-5 right-5 p-4 rounded-md border shadow-lg z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-900 border-green-500' : 
          toast.type === 'error' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
          {hash && (
             <a 
              href={`https://testnet.snowtrace.io/tx/${hash}`} 
              target="_blank" 
              className="text-[10px] underline block mt-1 opacity-70"
            >
              View on Explorer
            </a>
          )}
        </div>
      )}

      <div className="w-full max-w-md border border-gray-700 rounded-lg p-6 space-y-6 bg-zinc-950">
        <h1 className="text-xl font-bold">Day 3 – Avalanche dApp</h1>

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
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Wallet</p>
              <p className="font-mono text-sm">{shortenAddress(address!)}</p>
            </div>
            <button onClick={() => disconnect()} className="text-red-400 text-xs hover:underline">
              Disconnect
            </button>
          </div>
        )}

        {/* READ SECTION */}
        <div className="pt-2">
          <p className="text-sm text-gray-400 mb-1">Current Stored Value</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-blue-500">
              {isReading ? '...' : value?.toString() || '0'}
            </span>
            <button onClick={() => refetch()} className="text-xs text-gray-500 mb-2 hover:text-white">
              ↻ Refresh
            </button>
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
            className="w-full bg-blue-600 disabled:bg-gray-700 py-3 rounded font-bold transition-all"
          >
            {isWriting ? 'Check Wallet...' : isConfirming ? 'Confirming...' : 'Update Value'}
          </button>
        </div>
      </div>
    </main>
  );
}