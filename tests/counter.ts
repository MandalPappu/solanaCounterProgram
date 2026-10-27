import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { assert } from "chai";

describe("counter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.counter as Program<Counter>;
  const user = provider.wallet;
  const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), user.publicKey.toBuffer()],
    program.programId
  )

  it("Is initialized!👍", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      user:user.publicKey,
    }).rpc();
    console.log("Initializing Your transaction signature", tx);
    const account = await program.account.counter.fetch(counterPDA);
    assert.equal(account.count.toNumber(), 0);
  });
  it("counter increamented!🎉🎉🎉", async ()=> {
    const tx = await program.methods.increament().accounts({
      user:user.publicKey,
    }).rpc();
    console.log("Increment Tx Signature:", tx);
    const account = await program.account.counter.fetch(counterPDA);

  })
});
