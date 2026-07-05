<?php

namespace App\Command;

use App\Entity\Trade;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed-trades', description: 'Crea trades de ejemplo para DEMO y ADMIN01 para probar el journal compartido')]
class SeedTradesCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $repo = $this->entityManager->getRepository(User::class);

        foreach (['DEMO', 'ADMIN01'] as $code) {
            $user = $repo->findByCode($code);
            if (!$user) {
                $io->warning("Usuario $code no encontrado, saltando...");
                continue;
            }

            $existing = $this->entityManager->getRepository(Trade::class)->findBy(['user' => $user]);
            if (count($existing) > 0) {
                $io->writeln("⏭️  $code ya tiene " . count($existing) . " trades, saltando (idempotente).");
                continue;
            }

            $trades = $this->getTradeData($code);
            foreach ($trades as $data) {
                $trade = new Trade();
                $trade->setUser($user);
                $trade->setDate(new \DateTimeImmutable($data['date']));
                $trade->setAsset($data['asset']);
                $trade->setDirection($data['direction']);
                $trade->setEntry($data['entry']);
                $trade->setSl($data['sl']);
                $trade->setTp($data['tp']);
                $trade->setResult($data['result']);
                $trade->setPnl($data['pnl']);
                $trade->setRatio($data['ratio']);
                $trade->setNotes($data['notes']);
                $this->entityManager->persist($trade);
            }

            $this->entityManager->flush();
            $io->writeln("✅ " . count($trades) . " trades creados para $code.");
        }

        $io->success('Seed de trades completado.');
        return Command::SUCCESS;
    }

    private function getTradeData(string $userCode): array
    {
        $now = new \DateTimeImmutable();
        $d = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 10:00:00';
        $d2 = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 14:30:00';
        $d3 = fn(int $daysAgo) => $now->modify("-{$daysAgo} days")->format('Y-m-d') . ' 09:15:00';

        $trades = $userCode === 'DEMO' ? $this->demoTrades() : $this->adminTrades();
        $dates = $userCode === 'DEMO'
            ? [2, 4, 7, 9, 11, 14, 16, 19, 21, 24, 27, 29]
            : [1, 3, 6, 8, 10, 13, 15, 18, 20, 23, 25, 28];
        $timeFns = [$d, $d2, $d3, $d, $d2, $d3, $d, $d2, $d3, $d, $d2, $d3];

        $result = [];
        foreach ($trades as $i => $t) {
            $fn = $timeFns[$i];
            $result[] = [
                'date'      => $fn($dates[$i]),
                'asset'     => $t['asset'],
                'direction' => $t['dir'],
                'entry'     => $t['entry'],
                'sl'        => $t['sl'],
                'tp'        => $t['tp'],
                'result'    => $t['result'],
                'pnl'       => $t['pnl'],
                'ratio'     => $t['ratio'],
                'notes'     => $t['notes'],
            ];
        }

        return $result;
    }

    private function demoTrades(): array
    {
        return [
            ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '67200', 'sl' => '65500', 'tp' => '71000', 'result' => 'WIN',  'pnl' => 1850.00, 'ratio' => '1:2.1', 'notes' => '[DEMO] Soporte semanal. BTC rebotó con volumen.'],
            ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3380',  'sl' => '3280',  'tp' => '3650',  'result' => 'WIN',  'pnl' => 1240.00, 'ratio' => '1:2.0', 'notes' => '[DEMO] Acumulacion 4H. Ruptura de rango.'],
            ['asset' => 'XAUUSD',  'dir' => 'SELL', 'entry' => '2360',  'sl' => '2385',  'tp' => '2315',  'result' => 'WIN',  'pnl' => 980.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Doble techo. Cobertura corta USD.'],
            ['asset' => 'BTCUSDT', 'dir' => 'SELL', 'entry' => '69800', 'sl' => '70800', 'tp' => '67500', 'result' => 'WIN',  'pnl' => 1520.00, 'ratio' => '1:2.3', 'notes' => '[DEMO] Rechazo EMA-50 diaria.'],
            ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3520',  'sl' => '3450',  'tp' => '3680',  'result' => 'LOSS', 'pnl' => -340.00, 'ratio' => '1:1.5', 'notes' => '[DEMO] Stoploss ajustado por noticia.'],
            ['asset' => 'XAUUSD',  'dir' => 'BUY',  'entry' => '2310',  'sl' => '2290',  'tp' => '2350',  'result' => 'WIN',  'pnl' => 720.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Compra en soporte 2300.'],
            ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '68100', 'sl' => '67000', 'tp' => '70500', 'result' => 'WIN',  'pnl' => 980.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Continuacion alcista tras correccion.'],
            ['asset' => 'ETHUSDT', 'dir' => 'SELL', 'entry' => '3620',  'sl' => '3700',  'tp' => '3450',  'result' => 'WIN',  'pnl' => 850.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Reversión desde resistencia 3650.'],
            ['asset' => 'BTCUSDT', 'dir' => 'BUY',  'entry' => '66500', 'sl' => '65500', 'tp' => '69000', 'result' => 'LOSS', 'pnl' => -520.00, 'ratio' => '1:2.0', 'notes' => '[DEMO] SL tocado por wick antes de ir a TP.'],
            ['asset' => 'XAUUSD',  'dir' => 'BUY',  'entry' => '2285',  'sl' => '2270',  'tp' => '2320',  'result' => 'WIN',  'pnl' => 630.00,  'ratio' => '1:2.0', 'notes' => '[DEMO] Patron martillo en 4H confirmado.'],
            ['asset' => 'ETHUSDT', 'dir' => 'BUY',  'entry' => '3450',  'sl' => '3380',  'tp' => '3600',  'result' => 'WIN',  'pnl' => 580.00,  'ratio' => '1:1.9', 'notes' => '[DEMO] Rebote en EMA-20 con confirmacion.'],
            ['asset' => 'BTCUSDT', 'dir' => 'SELL', 'entry' => '70200', 'sl' => '71000', 'tp' => '68500', 'result' => 'WIN',  'pnl' => 1120.00, 'ratio' => '1:2.2', 'notes' => '[DEMO] Falso breakout rechazado en 70k.'],
        ];
    }

    private function adminTrades(): array
    {
        return [
            ['asset' => 'EURUSD',  'dir' => 'SELL', 'entry' => '1.0870','sl' => '1.0910','tp' => '1.0780','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.3', 'notes' => '[ADMIN01] Datos PMI Alemania debiles.'],
            ['asset' => 'GBPUSD',  'dir' => 'BUY',  'entry' => '1.2680','sl' => '1.2640','tp' => '1.2770','result' => 'LOSS', 'pnl' => -240.00, 'ratio' => '1:1.8', 'notes' => '[ADMIN01] BoE decepciono en su comunicado.'],
            ['asset' => 'USDJPY',  'dir' => 'BUY',  'entry' => '157.20','sl' => '156.50','tp' => '158.80','result' => 'WIN',  'pnl' => 640.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Carry trade alcista sigue activo.'],
            ['asset' => 'EURUSD',  'dir' => 'BUY',  'entry' => '1.0800','sl' => '1.0770','tp' => '1.0870','result' => 'WIN',  'pnl' => 350.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Soporte tecnico 1.0800 confirmado.'],
            ['asset' => 'GBPUSD',  'dir' => 'SELL', 'entry' => '1.2750','sl' => '1.2790','tp' => '1.2660','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.3', 'notes' => '[ADMIN01] Doble techo H4 confirmado.'],
            ['asset' => 'NAS100',  'dir' => 'BUY',  'entry' => '19450', 'sl' => '19300', 'tp' => '19800', 'result' => 'WIN',  'pnl' => 700.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Earnings tech positivos impulsan.'],
            ['asset' => 'USDJPY',  'dir' => 'SELL', 'entry' => '158.40','sl' => '159.00','tp' => '157.00','result' => 'LOSS', 'pnl' => -300.00, 'ratio' => '1:1.7', 'notes' => '[ADMIN01] Intervencion verbal del BoJ.'],
            ['asset' => 'NAS100',  'dir' => 'SELL', 'entry' => '19700', 'sl' => '19850', 'tp' => '19400', 'result' => 'LOSS', 'pnl' => -600.00, 'ratio' => '1:1.7', 'notes' => '[ADMIN01] Rebote tecnico no anticipado.'],
            ['asset' => 'EURUSD',  'dir' => 'SELL', 'entry' => '1.0890','sl' => '1.0920','tp' => '1.0820','result' => 'WIN',  'pnl' => 350.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Cierre mensual bajo 1.0900.'],
            ['asset' => 'GBPUSD',  'dir' => 'BUY',  'entry' => '1.2620','sl' => '1.2580','tp' => '1.2710','result' => 'WIN',  'pnl' => 450.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Dato inflacion UK sorpresivamente alto.'],
            ['asset' => 'NAS100',  'dir' => 'BUY',  'entry' => '19200', 'sl' => '19050', 'tp' => '19500', 'result' => 'WIN',  'pnl' => 600.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Soporte 19000 respetado nuevamente.'],
            ['asset' => 'USDJPY',  'dir' => 'BUY',  'entry' => '156.80','sl' => '156.20','tp' => '158.00','result' => 'WIN',  'pnl' => 480.00,  'ratio' => '1:2.0', 'notes' => '[ADMIN01] Diferencial de tasas sigue amplio.'],
        ];
    }
}
