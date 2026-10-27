use anchor_lang::prelude::*;

declare_id!("8gaSkiNCJaQmEFywNDjBKQZYEmsoQyKNryWw5Bga3Qpz");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.bump = ctx.bumps.counter;
        msg!("counter Initialize! current count is {}", counter.count);
        Ok(())
    }
    pub fn increament(ctx: Context<Increament>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        msg!("counter increamented current count is {}", counter.count);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", user.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increament<'info> {
    #[account(
        mut,
        seeds = [b"counter", user.key().as_ref()],
        bump = counter.bump
    )]
    pub counter:Account<'info, Counter>,
    pub user:Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    count:u64,
    bump:u8
}
