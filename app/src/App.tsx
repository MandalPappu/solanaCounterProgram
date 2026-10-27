import { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import { useConnection, useWallet, type AnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import idl from './utils/solana_counter.json';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import Navbar from './components/Navbar';
const programId = new web3.PublicKey("8gaSkiNCJaQmEFywNDjBKQZYEmsoQyKNryWw5Bga3Qpz");

export default function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [count, setCount] = useState<number | null>(null);
  const [balance, setBalance] = useState<Number | null>(null)
  const [counterPda, setCounterPda] = useState<web3.PublicKey | null>(null);


  const requestSOL = async () => {
    if (!wallet.publicKey) return;

    try {
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        2 * 1000000000
      );
      await connection.confirmTransaction(signature, "confirmed");
      console.log("airdrop successfull! signature: ", signature)
    } catch (error) {
      console.log("airdrop err: ", error);
    }
  }

  const fetchBalance = async () => {
    if (!wallet.publicKey) return;
    try {
      const balanceInLamports = await connection.getBalance(wallet.publicKey);
      const balInSol = balanceInLamports / LAMPORTS_PER_SOL
      setBalance(balInSol);
    } catch (error) {
      console.log("error to fetch balance", error)
    }
  }

  useEffect(() => {
    fetchBalance();
  }, [wallet.publicKey]);

  // 1. Establish the Anchor Program Client instance
  const getProgram = () => {
    if (!wallet.publicKey) return null;
    const provider = new AnchorProvider(connection, wallet as unknown as AnchorWallet, {
      preflightCommitment: "processed",
    });
    return new Program(idl as any, provider);
  };

  // 2. Derive the Counter PDA for the connected user wallet
  useEffect(() => {
    if (wallet.publicKey) {
      const [pda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("counter"), wallet.publicKey.toBuffer()],
        programId
      );
      setCounterPda(pda);
    } else {
      setCount(null);
      setCounterPda(null);
    }
  }, [wallet.publicKey]);

  // 3. Fetch current account value from localnet ledger
  const fetchCounterValue = async () => {
    const program = getProgram();
    if (!program || !counterPda) return;

    try {
      const accountState: any = await program.account.counter.fetch(counterPda);
      setCount(accountState.count.toNumber());
    } catch (err) {
      console.log("Account likely does not exist yet. Needs initialization.");
      setCount(null);
    }
  };

  useEffect(() => {
    if (counterPda) fetchCounterValue();
  }, [counterPda]);

  // 4. Initialize Counter Account (Anchor 0.30+ Auto-Resolves PDA Seeds)
  const initializeCounter = async () => {
    const program = getProgram();
    if (!program || !wallet.publicKey) return;
    console.log("clicked")
    const [exactCounterPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), wallet.publicKey.toBuffer()],
      programId
    );
    try {
      const tx = await program.methods
        .initialize()// PDA and System Program are implicitly resolved
        .accounts({            //  Changed from .accounts
          user: wallet.publicKey,
          counter: exactCounterPda,        //  Pass manually to resolve the error
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialization Tx Signature:", tx);
      await fetchCounterValue();
      await fetchBalance();
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  };

  // 5. Increment Counter Account
  const incrementCounter = async () => {
    const program = getProgram();
    if (!program || !wallet.publicKey) return;
    const [exactCounterPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), wallet.publicKey.toBuffer()],
      programId
    );
    try {
      const tx = await program.methods
        .increament() // PDA implicitly resolved by Anchor
        .accounts({            //  Changed from .accounts
          user: wallet.publicKey,
          counter: exactCounterPda,        //  Pass manually to resolve the error
        })
        .rpc();

      console.log("Increment Tx Signature:", tx);
      await fetchCounterValue();
      await fetchBalance();
    } catch (err) {
      console.error("Increment transaction failed:", err);
    }
  };

  return (
    <div className='w-screen h-screen bg-gray-900 text-white pt-6 relative'>
      <Navbar/>
      <div className='w-full h-[70%] absolute '>
        <h1 className='text-[15rem] ml-70 pt-20 blur-xl bg-linear-to-r from-blue-600 via-green-500 to-indigo-400 bg-clip-text text-transparent font-bold'>SOLANA</h1>
      </div>
      {wallet.publicKey && (
        <div style={{ marginTop: "20px" }}>
          <p>Connected Wallet: {wallet.publicKey.toBase58().slice(0, 6)}...{wallet.publicKey.toBase58().slice(-4)}</p>
          <div>
            {wallet.publicKey && (
              <h3>
                Wallet Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
              </h3>
            )}
            <button onClick={requestSOL}>requestAirdrop</button>
          </div>
          {count !== null ? (
            <div>
              <h2 style={{ fontSize: "48px", margin: "10px 0" }}>Count: {count}</h2>
              <button onClick={incrementCounter} style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}>
                Increment Counter
              </button>
            </div>
          ) : (
            <div>
              <p>No counter account found for this wallet on localnet.</p>
              <button onClick={initializeCounter} style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer", background: "#4CAF50", color: "white", border: "none" }}>
                Initialize Counter Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
