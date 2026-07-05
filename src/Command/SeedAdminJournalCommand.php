<?php

namespace App\Command;

use App\Entity\Trade;
use App\Entity\TradingAccount;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed-admin-journal', description: 'Siembra el journal del admin con trades ficticios de 2025-2026')]
class SeedAdminJournalCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepo,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $admin = $this->userRepo->findOneBy(['code' => 'ADMIN01']);
        if (!$admin) {
            $io->error('ADMIN01 not found');
            return Command::FAILURE;
        }

        $existing = $this->em->getRepository(Trade::class)->count(['user' => $admin]);
        if ($existing > 0) {
            $io->warning("Admin already has $existing trades. Skipping.");
            return Command::SUCCESS;
        }

        $account = new TradingAccount();
        $account->setUser($admin);
        $account->setName('Main Account');
        $account->setAccountSize(10000);
        $account->setColor('#d4af37');
        $account->setIcon('👑');
        $account->setIsActive(true);
        $this->em->persist($account);
        $this->em->flush();

        $trades = $this->generateTrades();
        $count = 0;

        foreach ($trades as $t) {
            $trade = new Trade();
            $trade->setUser($admin);
            $trade->setAccount($account);
            $trade->setDate(new \DateTimeImmutable($t['date']));
            $trade->setAsset($t['asset']);
            $trade->setDirection($t['dir']);
            $trade->setEntry($t['entry']);
            $trade->setSl($t['sl']);
            $trade->setTp($t['tp']);
            $trade->setResult($t['result']);
            $trade->setPnl($t['pnl']);
            $trade->setRatio($t['ratio']);
            $trade->setNotes($t['notes'] ?? null);
            $this->em->persist($trade);
            $count++;
        }

        $this->em->flush();

        $wins = count(array_filter($trades, fn($t) => $t['result'] === 'WIN'));
        $losses = count(array_filter($trades, fn($t) => $t['result'] === 'LOSS'));
        $totalPnl = array_sum(array_column($trades, 'pnl'));

        $io->success("Seeded $count trades for ADMIN01 — W:$wins L:$losses PnL: $" . number_format($totalPnl, 2));
        return Command::SUCCESS;
    }

    private function generateTrades(): array
    {
        return [
            // ── ENERO 2026 ──
            ['date'=>'2026-01-05 09:30','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'97250','sl'=>'95800','tp'=>'99500','result'=>'WIN','pnl'=>185.40,'ratio'=>'1:1.5','notes'=>'Breakout del rango 95k-97k. Volumen confirmó.'],
            ['date'=>'2026-01-07 14:15','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0942','sl'=>'1.0980','tp'=>'1.0880','result'=>'WIN','pnl'=>92.30,'ratio'=>'1:1.6','notes'=>'Rechazo en resistencia + divergencia RSI.'],
            ['date'=>'2026-01-08 08:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2648.50','sl'=>'2635.00','tp'=>'2672.00','result'=>'WIN','pnl'=>214.60,'ratio'=>'1:1.7','notes'=>'Safe haven bid antes del NFP.'],
            ['date'=>'2026-01-10 16:30','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2465','sl'=>'1.2420','tp'=>'1.2540','result'=>'LOSS','pnl'=>-78.50,'ratio'=>'1:1.5','notes'=>'Trade emocional después de losing streak.'],
            ['date'=>'2026-01-12 10:45','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'3520','sl'=>'3610','tp'=>'3380','result'=>'WIN','pnl'=>168.20,'ratio'=>'1:1.4','notes'=>'Distribución en time frame alto + reject de EMA200.'],
            ['date'=>'2026-01-15 07:30','asset'=>'USDJPY','dir'=>'LONG','entry'=>'157.820','sl'=>'157.400','tp'=>'158.500','result'=>'WIN','pnl'=>112.00,'ratio'=>'1:1.6','notes'=>'BoJ hold + carry trade favorito.'],
            ['date'=>'2026-01-17 13:00','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'99800','sl'=>'100800','tp'=>'98200','result'=>'LOSS','pnl'=>-152.30,'ratio'=>'1:1.6','notes'=>'FOMO top. No esperé confirmación. Lección: paciencia.'],
            ['date'=>'2026-01-20 09:15','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2695.00','sl'=>'2682.00','tp'=>'2718.00','result'=>'WIN','pnl'=>176.50,'ratio'=>'1:1.7','notes'=>'Rally post inauguración presidencial.'],
            ['date'=>'2026-01-22 11:30','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0895','sl'=>'1.0855','tp'=>'1.0960','result'=>'WIN','pnl'=>118.40,'ratio'=>'1:1.6','notes'=>'Draghi dovish reversal.'],
            ['date'=>'2026-01-24 15:45','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2380','sl'=>'1.2420','tp'=>'1.2310','result'=>'LOSS','pnl'=>-68.20,'ratio'=>'1:1.7','notes'=>'Stop hunt antes del real move.'],
            ['date'=>'2026-01-27 08:30','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'101500','sl'=>'100200','tp'=>'103800','result'=>'WIN','pnl'=>265.00,'ratio'=>'1:1.7','notes'=>'Consolidación rota al alza. Estructura perfecta.'],
            ['date'=>'2026-01-29 12:00','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'3380','sl'=>'3310','tp'=>'3510','result'=>'WIN','pnl'=>186.30,'ratio'=>'1:1.8','notes'=>'ETHBTC ratio bottom. Rotational play.'],
            ['date'=>'2026-01-31 10:00','asset'=>'XAUUSD','dir'=>'SHORT','entry'=>'2722.00','sl'=>'2735.00','tp'=>'2698.00','result'=>'LOSS','pnl'=>-115.00,'ratio'=>'1:1.8','notes'=>'Gold en overbought, pero macro still bullish. Error.'],

            // ── FEBRERO 2026 ──
            ['date'=>'2026-02-03 09:00','asset'=>'USDJPY','dir'=>'SHORT','entry'=>'155.650','sl'=>'156.100','tp'=>'154.900','result'=>'WIN','pnl'=>132.80,'ratio'=>'1:1.6','notes'=>'Risk off por tariff fears. Yen strengthening.'],
            ['date'=>'2026-02-05 14:30','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'96800','sl'=>'98000','tp'=>'94500','result'=>'WIN','pnl'=>198.50,'ratio'=>'1:1.9','notes'=>'Head & shoulders en 4H. Target proyectado.'],
            ['date'=>'2026-02-07 08:15','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0830','sl'=>'1.0870','tp'=>'1.0760','result'=>'WIN','pnl'=>104.20,'ratio'=>'1:1.7','notes'=>'EUR weakness post-ECB minutes dovish.'],
            ['date'=>'2026-02-10 11:00','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2410','sl'=>'1.2365','tp'=>'1.2490','result'=>'WIN','pnl'=>128.60,'ratio'=>'1:1.7','notes'=>'UK GDP beat + BoE hawkish whisper.'],
            ['date'=>'2026-02-12 16:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2755.00','sl'=>'2740.00','tp'=>'2785.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'CPI high = gold bid. Perfect setup.'],
            ['date'=>'2026-02-14 09:30','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'3250','sl'=>'3330','tp'=>'3120','result'=>'LOSS','pnl'=>-115.40,'ratio'=>'1:1.6','notes'=>'Fake dump before pump. Liquidation cascade.'],
            ['date'=>'2026-02-17 13:30','asset'=>'USDJPY','dir'=>'LONG','entry'=>'154.200','sl'=>'153.700','tp'=>'155.100','result'=>'WIN','pnl'=>118.00,'ratio'=>'1:1.8','notes'=>'US yield spike. 10Y broke 4.6%.'],
            ['date'=>'2026-02-19 07:45','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'93500','sl'=>'92200','tp'=>'95800','result'=>'WIN','pnl'=>285.60,'ratio'=>'1:1.7','notes'=>'Dip buy en soporte mayor. Convicción alta.'],
            ['date'=>'2026-02-21 10:15','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2520','sl'=>'1.2565','tp'=>'1.2440','result'=>'LOSS','pnl'=>-72.80,'ratio'=>'1:1.7','notes'=>'Sharp reversal en session londres.'],
            ['date'=>'2026-02-24 14:00','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0780','sl'=>'1.0740','tp'=>'1.0850','result'=>'WIN','pnl'=>122.50,'ratio'=>'1:1.7','notes'=>'Bounce en soporte semanal. Divergencia alcista.'],
            ['date'=>'2026-02-26 09:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2810.00','sl'=>'2795.00','tp'=>'2840.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'New ATH. Momentum intact.'],
            ['date'=>'2026-02-28 15:30','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'95200','sl'=>'96500','tp'=>'93000','result'=>'LOSS','pnl'=>-168.00,'ratio'=>'1:1.7','notes'=>'Shorted into strength. Big mistake.'],

            // ── MARZO 2026 ──
            ['date'=>'2026-03-02 08:30','asset'=>'USDJPY','dir'=>'LONG','entry'=>'153.900','sl'=>'153.400','tp'=>'154.800','result'=>'WIN','pnl'=>118.40,'ratio'=>'1:1.8','notes'=>'US jobs data strong. Yen weakness.'],
            ['date'=>'2026-03-04 11:15','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2850','sl'=>'2760','tp'=>'3020','result'=>'WIN','pnl'=>240.50,'ratio'=>'1:1.8','notes'=>'ETH accumulation phase over. Breakout confirmed.'],
            ['date'=>'2026-03-06 14:45','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0680','sl'=>'1.0720','tp'=>'1.0600','result'=>'WIN','pnl'=>115.30,'ratio'=>'1:2.0','notes'=>'EUR breakdown. Parity in sight.'],
            ['date'=>'2026-03-09 09:00','asset'=>'XAUUSD','dir'=>'SHORT','entry'=>'2845.00','sl'=>'2860.00','tp'=>'2815.00','result'=>'LOSS','pnl'=>-125.00,'ratio'=>'1:2.0','notes'=>'Don short gold. Market irrational longer than solvent.'],
            ['date'=>'2026-03-11 16:30','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2280','sl'=>'1.2235','tp'=>'1.2370','result'=>'WIN','pnl'=>148.60,'ratio'=>'1:2.0','notes'=>'Double bottom en H4. Clean entry.'],
            ['date'=>'2026-03-13 07:30','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'88500','sl'=>'87200','tp'=>'91000','result'=>'WIN','pnl'=>312.00,'ratio'=>'1:1.9','notes'=>'Capitulation buy. Fear index extreme.'],
            ['date'=>'2026-03-16 10:00','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'2680','sl'=>'2750','tp'=>'2550','result'=>'LOSS','pnl'=>-98.50,'ratio'=>'1:1.8','notes'=>'Thin liquidity Sunday. Avoid.'],
            ['date'=>'2026-03-18 13:30','asset'=>'USDJPY','dir'=>'SHORT','entry'=>'151.200','sl'=>'151.700','tp'=>'150.400','result'=>'WIN','pnl'=>132.00,'ratio'=>'1:1.6','notes'=>'BOJ surprise tightening hint.'],
            ['date'=>'2026-03-20 08:45','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2890.00','sl'=>'2875.00','tp'=>'2920.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'FOMC dovish pivot. Real yields falling.'],
            ['date'=>'2026-03-23 15:00','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0520','sl'=>'1.0480','tp'=>'1.0600','result'=>'WIN','pnl'=>135.40,'ratio'=>'1:2.0','notes'=>'Oversold bounce. RSI divergence on daily.'],
            ['date'=>'2026-03-25 09:30','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2400','sl'=>'1.2445','tp'=>'1.2310','result'=>'LOSS','pnl'=>-68.00,'ratio'=>'1:2.0','notes'=>'False breakout. Reclaim was bullish.'],
            ['date'=>'2026-03-27 11:15','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'92100','sl'=>'93500','tp'=>'89800','result'=>'WIN','pnl'=>248.60,'ratio'=>'1:1.6','notes'=>'Distribution top confirmed. Wyckoff phase D.'],
            ['date'=>'2026-03-30 14:00','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2450','sl'=>'2380','tp'=>'2600','result'=>'WIN','pnl'=>218.30,'ratio'=>'1:2.1','notes'=>'ETH/BTC ratio reversal. Seasonality positive.'],

            // ── ABRIL 2026 ──
            ['date'=>'2026-04-01 09:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'2960.00','sl'=>'2945.00','tp'=>'2990.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'Q2 positioning. Central banks buying.'],
            ['date'=>'2026-04-03 14:30','asset'=>'USDJPY','dir'=>'LONG','entry'=>'149.800','sl'=>'149.300','tp'=>'150.600','result'=>'WIN','pnl'=>105.60,'ratio'=>'1:1.6','notes'=>'US yields rebound.'],
            ['date'=>'2026-04-06 08:15','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'87200','sl'=>'85900','tp'=>'89800','result'=>'WIN','pnl'=>318.40,'ratio'=>'1:2.0','notes'=>'Accumulation completed. Spring pattern.'],
            ['date'=>'2026-04-08 11:30','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0440','sl'=>'1.0485','tp'=>'1.0360','result'=>'WIN','pnl'=>115.80,'ratio'=>'1:1.7','notes'=>'USD strength resumes. CPI hot.'],
            ['date'=>'2026-04-10 16:00','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2190','sl'=>'1.2145','tp'=>'1.2280','result'=>'LOSS','pnl'=>-72.50,'ratio'=>'1:2.0','notes'=>'UK recession fears. Short was the play.'],
            ['date'=>'2026-04-13 07:45','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'2720','sl'=>'2790','tp'=>'2590','result'=>'WIN','pnl'=>195.30,'ratio'=>'1:1.8','notes'=>'Reject de resistencia + bearish divergence.'],
            ['date'=>'2026-04-15 10:30','asset'=>'XAUUSD','dir'=>'SHORT','entry'=>'3010.00','sl'=>'3025.00','tp'=>'2980.00','result'=>'LOSS','pnl'=>-125.00,'ratio'=>'1:2.0','notes'=>'Gold does not short. Lesson reinforced.'],
            ['date'=>'2026-04-17 13:15','asset'=>'USDJPY','dir'=>'SHORT','entry'=>'151.500','sl'=>'152.000','tp'=>'150.600','result'=>'WIN','pnl'=>118.00,'ratio'=>'1:1.8','notes'=>'Risk off. VIX spike. Yen bid.'],
            ['date'=>'2026-04-20 09:00','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'91800','sl'=>'90500','tp'=>'94200','result'=>'WIN','pnl'=>278.60,'ratio'=>'1:1.8','notes'=>'Halving narrative building. On-chain bullish.'],
            ['date'=>'2026-04-22 15:30','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0380','sl'=>'1.0340','tp'=>'1.0460','result'=>'WIN','pnl'=>135.20,'ratio'=>'1:2.0','notes'=>'ECB hawkish surprise. EUR squeeze.'],
            ['date'=>'2026-04-24 08:00','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2310','sl'=>'1.2355','tp'=>'1.2220','result'=>'WIN','pnl'=>138.40,'ratio'=>'1:2.0','notes'=>'BoE cut expectations rising.'],
            ['date'=>'2026-04-27 11:00','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2580','sl'=>'2510','tp'=>'2720','result'=>'WIN','pnl'=>198.70,'ratio'=>'1:2.0','notes'=>'Layer 2 activity surge. Fundamentals.'],
            ['date'=>'2026-04-29 14:45','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'3050.00','sl'=>'3035.00','tp'=>'3080.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'De-dollarization trade intact.'],

            // ── MAYO 2026 ──
            ['date'=>'2026-05-02 09:30','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'94500','sl'=>'95800','tp'=>'92200','result'=>'WIN','pnl'=>245.80,'ratio'=>'1:1.7','notes'=>'Exhaustion at resistance. Volume divergence.'],
            ['date'=>'2026-05-04 14:00','asset'=>'USDJPY','dir'=>'LONG','entry'=>'148.900','sl'=>'148.400','tp'=>'149.800','result'=>'WIN','pnl'=>118.40,'ratio'=>'1:1.8','notes'=>'Risk on. Equities rally.'],
            ['date'=>'2026-05-06 08:30','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0520','sl'=>'1.0565','tp'=>'1.0430','result'=>'WIN','pnl'=>130.50,'ratio'=>'1:2.0','notes'=>'US data strong. ECB in bind.'],
            ['date'=>'2026-05-08 11:45','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2890','sl'=>'2810','tp'=>'3050','result'=>'WIN','pnl'=>238.60,'ratio'=>'1:2.0','notes'=>'Spot ETF approval rumor.'],
            ['date'=>'2026-05-11 16:00','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2380','sl'=>'1.2335','tp'=>'1.2470','result'=>'LOSS','pnl'=>-72.80,'ratio'=>'1:2.0','notes'=>'UK data weak. Short was right.'],
            ['date'=>'2026-05-13 07:15','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'3085.00','sl'=>'3070.00','tp'=>'3115.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'Geopolitical tension. Safe haven.'],
            ['date'=>'2026-05-15 10:00','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'96200','sl'=>'94900','tp'=>'98500','result'=>'WIN','pnl'=>268.40,'ratio'=>'1:1.7','notes'=>'Breaking all-time high. No resistance above.'],
            ['date'=>'2026-05-18 13:30','asset'=>'USDJPY','dir'=>'SHORT','entry'=>'150.200','sl'=>'150.700','tp'=>'149.300','result'=>'WIN','pnl'=>118.00,'ratio'=>'1:1.8','notes'=>'BOJ intervention rumors.'],
            ['date'=>'2026-05-20 09:00','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0410','sl'=>'1.0370','tp'=>'1.0490','result'=>'LOSS','pnl'=>-68.50,'ratio'=>'1:2.0','notes'=>'USD bid on strong retail sales.'],
            ['date'=>'2026-05-22 15:30','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'3150','sl'=>'3220','tp'=>'3020','result'=>'WIN','pnl'=>198.50,'ratio'=>'1:1.8','notes'=>'Sell the news. ETF approved but ETH sold.'],
            ['date'=>'2026-05-25 08:45','asset'=>'XAUUSD','dir'=>'SHORT','entry'=>'3120.00','sl'=>'3135.00','tp'=>'3090.00','result'=>'LOSS','pnl'=>-125.00,'ratio'=>'1:2.0','notes'=>'Gold does not short. Third time, still hurts.'],
            ['date'=>'2026-05-27 11:15','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2510','sl'=>'1.2555','tp'=>'1.2420','result'=>'WIN','pnl'=>138.40,'ratio'=>'1:2.0','notes'=>'BoE dovish pivot confirmed.'],
            ['date'=>'2026-05-30 14:30','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'98800','sl'=>'97500','tp'=>'101200','result'=>'WIN','pnl'=>278.60,'ratio'=>'1:1.8','notes'=>'Consolidation before next leg.'],

            // ── JUNIO 2026 ──
            ['date'=>'2026-06-01 09:00','asset'=>'USDJPY','dir'=>'LONG','entry'=>'147.500','sl'=>'147.000','tp'=>'148.400','result'=>'WIN','pnl'=>118.40,'ratio'=>'1:1.8','notes'=>'New month, new positioning. Risk on.'],
            ['date'=>'2026-06-03 14:30','asset'=>'EURUSD','dir'=>'SHORT','entry'=>'1.0480','sl'=>'1.0525','tp'=>'1.0390','result'=>'WIN','pnl'=>130.80,'ratio'=>'1:2.0','notes'=>'NFP week. USD strengthening.'],
            ['date'=>'2026-06-05 08:15','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2950','sl'=>'2870','tp'=>'3100','result'=>'WIN','pnl'=>225.30,'ratio'=>'1:1.8','notes'=>'Post-ETF accumulation.'],
            ['date'=>'2026-06-08 11:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'3145.00','sl'=>'3130.00','tp'=>'3175.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'CPI comes in hot. Real rates negative.'],
            ['date'=>'2026-06-10 16:30','asset'=>'GBPUSD','dir'=>'LONG','entry'=>'1.2440','sl'=>'1.2395','tp'=>'1.2530','result'=>'LOSS','pnl'=>-72.50,'ratio'=>'1:2.0','notes'=>'False breakout again. Need to wait for close.'],
            ['date'=>'2026-06-12 09:30','asset'=>'BTCUSDT','dir'=>'SHORT','entry'=>'102500','sl'=>'103800','tp'=>'100200','result'=>'WIN','pnl'=>275.60,'ratio'=>'1:1.7','notes'=>'Double top on daily. First short in weeks.'],
            ['date'=>'2026-06-15 13:00','asset'=>'USDJPY','dir'=>'SHORT','entry'=>'148.200','sl'=>'148.700','tp'=>'147.300','result'=>'WIN','pnl'=>118.00,'ratio'=>'1:1.8','notes'=>'Risk off mode. VIX > 25.'],
            ['date'=>'2026-06-17 07:45','asset'=>'EURUSD','dir'=>'LONG','entry'=>'1.0350','sl'=>'1.0310','tp'=>'1.0430','result'=>'WIN','pnl'=>135.40,'ratio'=>'1:2.0','notes'=>'Oversold bounce + ECB hawkish.'],
            ['date'=>'2026-06-19 10:30','asset'=>'ETHUSDT','dir'=>'SHORT','entry'=>'3080','sl'=>'3150','tp'=>'2950','result'=>'LOSS','pnl'=>-105.30,'ratio'=>'1:1.8','notes'=>'ETH strength. Do not fight trend.'],
            ['date'=>'2026-06-22 14:00','asset'=>'XAUUSD','dir'=>'LONG','entry'=>'3180.00','sl'=>'3165.00','tp'=>'3210.00','result'=>'WIN','pnl'=>200.00,'ratio'=>'1:2.0','notes'=>'Central bank demand persistent. Trend intact.'],
            ['date'=>'2026-06-24 09:15','asset'=>'GBPUSD','dir'=>'SHORT','entry'=>'1.2600','sl'=>'1.2645','tp'=>'1.2510','result'=>'WIN','pnl'=>138.40,'ratio'=>'1:2.0','notes'=>'UK inflation cools. BoE cut imminent.'],
            ['date'=>'2026-06-26 15:00','asset'=>'BTCUSDT','dir'=>'LONG','entry'=>'99800','sl'=>'98500','tp'=>'102200','result'=>'WIN','pnl'=>278.60,'ratio'=>'1:1.8','notes'=>'Dip buy near 100k. Strong hands accumulating.'],
            ['date'=>'2026-06-29 08:00','asset'=>'USDJPY','dir'=>'LONG','entry'=>'146.800','sl'=>'146.300','tp'=>'147.700','result'=>'WIN','pnl'=>118.40,'ratio'=>'1:1.8','notes'=>'Q3 positioning. Risk on into summer.'],
            ['date'=>'2026-06-30 11:30','asset'=>'ETHUSDT','dir'=>'LONG','entry'=>'2880','sl'=>'2810','tp'=>'3020','result'=>'WIN','pnl'=>248.60,'ratio'=>'1:2.0','notes'=>'Half year close. ETH recovering.'],
        ];
    }
}
