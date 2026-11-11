import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const args = process.argv.slice(2);
function value(flag) { const i=args.indexOf(flag); return i < 0 ? undefined : args[i+1]; }
function integer(flag, fallback) {
  const raw=value(flag) ?? fallback;
  if (raw === undefined || !/^\d+$/.test(String(raw))) throw new Error(`${flag}: non-negative integer required`);
  const n=Number(raw); if (!Number.isSafeInteger(n)) throw new Error(`${flag}: invalid integer`); return n;
}
try {
  const [clock] = await db.$queryRaw`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM') AS month, to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') AS day`;
  if (args.includes('--status')) {
    const budget=await db.googleSearchBudget.findUnique({where:{month:clock.month}});
    console.log(JSON.stringify({month:clock.month,day:clock.day,budget:budget ?? 'NOT CONFIGURED — searches blocked'},null,2));
  } else {
    if (!args.includes('--confirm-account-usage')) throw new Error('Verify billing-account-wide Text Search Pro usage, reserve this allowance exclusively for this service, then pass --confirm-account-usage. No Google requests are made by this script.');
    if (value('--month') !== clock.month) throw new Error('Only the current Pacific billing month can be initialized.');
    const used=integer('--used'), dailyUsed=integer('--used-today');
    const limit=integer('--limit',4500), dailyLimit=integer('--daily-limit',100);
    if (limit>4500 || dailyLimit>100 || dailyUsed>used) throw new Error('Maximum limits: month 4500, day 100; daily usage cannot exceed monthly usage.');
    // CREATE only: repeated execution cannot reset counters. Missing rows always fail closed.
    await db.googleSearchBudget.create({data:{month:clock.month,day:clock.day,used,dailyUsed,limit,dailyLimit}});
    console.log('Budget initialized. Previous usage included; failures consume budget; next month requires a new verified budget.');
  }
} catch (error) {
  console.error(error?.code === 'P2002' ? 'Budget already exists; counters were not reset.' : error?.message?.includes('prisma') ? 'Database operation failed; verify connectivity and migrations.' : error.message);
  process.exitCode=1;
} finally { await db.$disconnect(); }
