import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

function Navbar() {
  return (
    <div className='w-full h-16 bg-white/5 backdrop-blur-3xl border-b border-white/20 shadow-sm  flex items-center justify-between px-16'>
        <h1 className='text-3xl font-semibold font-serif'>Solana Counter</h1>
        <div className='flex items-center gap-16'>
            <p>balance: 2 SOL</p>
            <WalletMultiButton/>
        </div>
    </div>
  )
}

export default Navbar