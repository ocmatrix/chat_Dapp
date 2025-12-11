import React, { useState } from 'react';
import { WindowEthereum } from '../types';
import { Wallet } from 'ethers';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedInfo, setGeneratedInfo] = useState<{address: string, pk: string} | null>(null);

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    const ethereum = (window as any).ethereum as WindowEthereum;

    if (!ethereum) {
      setError("No Web3 wallet found. Please use the generator below for testing.");
      setLoading(false);
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
      } else {
        setError("No accounts found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect.");
    } finally {
      setLoading(false);
    }
  };

  const createBSCWallet = () => {
    setLoading(true);
    try {
      // Create a random BSC/ETH compatible wallet locally
      const wallet = Wallet.createRandom();
      
      // We show this to the user briefly so they feel the "Realness" of the node generation
      setGeneratedInfo({
        address: wallet.address,
        pk: wallet.privateKey
      });

      // Simulate connection delay for realism
      setTimeout(() => {
        onConnect(wallet.address);
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate BSC wallet keypair.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-crypto-dark p-6 text-center">
      <div className="mb-8 p-4 rounded-full bg-crypto-surface shadow-lg shadow-crypto-primary/20 relative group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-crypto-primary group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div className="absolute -bottom-1 -right-1 bg-crypto-success rounded-full p-2 border-4 border-crypto-dark animate-pulse-slow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-crypto-primary via-blue-400 to-crypto-accent bg-clip-text text-transparent">
        DeChat P2P
      </h1>
      <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">
        Decentralized. No Servers.<br/>
        <span className="text-gray-500 text-sm">Testing Environment Ready.</span>
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm animate-pulse">
          {error}
        </div>
      )}

      {/* Loading / Generating State */}
      {loading && generatedInfo && (
        <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm text-left animate-fade-in">
            <p className="text-xs text-green-400 font-mono mb-1">> Generating Keypair...</p>
            <p className="text-xs text-gray-300 font-mono break-all">Addr: {generatedInfo.address}</p>
            <p className="text-xs text-gray-500 font-mono break-all mt-1">PK: ************************</p>
            <div className="mt-3 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-crypto-primary animate-pulse w-2/3"></div>
            </div>
            <p className="text-center text-xs text-white mt-2">Entering encrypted channel...</p>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
            {/* Main Connect Button */}
            <button
                onClick={connectWallet}
                className="w-full py-4 px-6 bg-crypto-surface border border-gray-700 hover:border-crypto-primary hover:bg-gray-800 active:scale-95 transition-all rounded-2xl font-bold text-white shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm">Connect TokenPocket</span>
            </button>

            <div className="flex items-center gap-2 my-1 opacity-50">
                <div className="h-px flex-1 bg-gray-600"></div>
                <span className="text-xs">NO WALLET?</span>
                <div className="h-px flex-1 bg-gray-600"></div>
            </div>

            {/* Test Wallet Generator Button */}
            <button
                onClick={createBSCWallet}
                className="w-full py-4 px-6 bg-gradient-to-r from-crypto-primary to-blue-600 hover:to-blue-500 active:scale-95 transition-all rounded-2xl font-bold text-white shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">Generate BSC Wallet</span>
                    <span className="text-[10px] font-normal opacity-80">Local Browser Node</span>
                </div>
            </button>
        </div>
      )}
      
      <div className="mt-8 text-[10px] text-gray-500 max-w-xs">
        The generator creates a valid BIP-39 compatible BSC address locally. Private keys never leave your browser.
      </div>
    </div>
  );
};

export default WalletConnect;