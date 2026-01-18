'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { injected } from 'wagmi/connectors';

import { SIMPLE_STORAGE_ADDRESS } from '@/src/contracts/address';
import { SIMPLE_STORAGE_ABI } from '@/src/contracts/abi/simpleStorage';

export default function Page() {
  // --- WALLET & NETWORK STATE ---
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [backendValue, setBackendValue] = useState<string | null>(null); // State untuk Task 1
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' | null }>({
    message: '',
    type: null,
  });

  //\INTEGRASI BACKEND (FETCH API)
  const fetchFromBackend = async () => {
    try {
      // GANTI URL INI dengan domain Railway kamu
      const response = await fetch('https://simple-dapp-api-docs.up.railway.app/blockchain/value');
      const data = await response.json();
      // Set nilai dari response
      setBackendValue(data.value?.toString() || data.toString());
    } catch (error) {
      console.error("Gagal mengambil data dari Backend:", error);
    }
  };

  // Panggil fetch saat pertama kali load
  useEffect(() => {
    fetchFromBackend();
  }, []);

  //INTEGRASI TRANSACTION (WRITE CONTRACT) ---
  const { data: value, isLoading: isReading, refetch } = useReadContract({
    address: SIMPLE_STORAGE_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Notifications & Sync Logic
  useEffect(() => {
    if (isWriting) setToast({ message: 'Confirm in Core Wallet...', type: 'loading' });
    if (isConfirming) setToast({ message: 'Transaction processing...', type: 'loading' });
    if (isConfirmed) {
      setToast({ message: 'Success! Value updated.', type: 'success' });
      refetch();          // Refresh data langsung dari Blockchain
      fetchFromBackend(); // Refresh data dari Backend API (Task 1 & 2 Sync)
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

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      
      {/* TOAST NOTIFICATION */}
      {toast.type && (
        <div className={`fixed top-5 right-5 p-4 rounded-md border shadow-lg z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-900 border-green-500' : 
          toast.type === 'error' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'
        }`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="w-full max-w-md border border-gray-700 rounded-lg p-6 space-y-6 bg-zinc-950 shadow-2xl">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold italic tracking-tighter">AVALANCHE dApp</h1>
          
          {isConnected && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Network</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-red-500 text-red-400 bg-red-950/30">
                {chain?.name || 'Avalanche Fuji'}
              </span>
            </div>
          )}
        </div>

        {/* WALLET CONNECT */}
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={isConnecting}
            className="w-full bg-white text-black py-2 rounded font-bold hover:bg-gray-200 transition"
          >
            {isConnecting ? 'Connecting Core...' : 'Connect Core Wallet'}
          </button>
        ) : (
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded border border-gray-800">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">My Address</p>
              <p className="font-mono text-sm text-blue-400">{shortenAddress(address!)}</p>
            </div>
            <button onClick={() => disconnect()} className="text-red-500 text-xs hover:font-bold">
              Disconnect
            </button>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {/* Data dari Blockchain Langsung */}
          <div className="bg-zinc-900/50 p-3 rounded-lg border border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase mb-1">Blockchain State (Direct)</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-white">
                {isReading ? '...' : value?.toString() || '0'}
              </span>
              <button onClick={() => refetch()} className="p-2 hover:bg-zinc-800 rounded">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>
          </div>

          {/* Data dari Backend API (Railway) */}
          <div className="bg-blue-950/20 p-3 rounded-lg border border-blue-900/50">
            <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Backend API State (Railway)</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-400">
                {backendValue || '0'}
              </span>
              <button onClick={fetchFromBackend} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-500">
                Sync API
              </button>
            </div>
          </div>
        </div>

        {/* WRITE SECTION */}
        <div className="border-t border-gray-800 pt-6 space-y-3">
          <input
            type="number"
            placeholder="Input new value..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-3 rounded bg-zinc-900 border border-gray-700 focus:border-blue-500 outline-none transition"
          />

          <button
            onClick={handleSetValue}
            disabled={isWriting || isConfirming || !isConnected || !inputValue}
            className="w-full bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 py-3 rounded font-bold hover:bg-blue-500 transition-all shadow-lg"
          >
            {isWriting ? 'Check Wallet...' : isConfirming ? 'Processing Transaction...' : 'Set Value'}
          </button>
        </div>
      </div>
    </main>
  );
}