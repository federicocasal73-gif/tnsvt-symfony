<?php

namespace App\Controller;

use App\Repository\AcademiaContentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class MainController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        return $this->render('base.html.twig');
    }

    #[Route('/module/{id}', name: 'app_module')]
    public function module(string $id): Response
    {
        $modules = $this->getModulesData();
        if (!isset($modules[$id])) {
            throw $this->createNotFoundException('Módulo no encontrado');
        }

        return $this->render('base.html.twig', [
            'module' => $modules[$id],
            'moduleId' => $id,
        ]);
    }

    public function getModulesData(): array
    {
        return [
            'psi' => [
                'title' => '1. Psicología e Identidad Anclada',
                'blocks' => [
                    ['key' => 'La Fractura de Identidad', 'text' => 'El dinero nunca fue tu problema real. Es el resultado visible de tu nivel de conexión subyacente...'],
                    ['key' => 'El Colapso Biológico', 'text' => 'Si la psicología no tiene suelo firme, la mente se nubla y el cerebro entra en modo supervivencia...'],
                    ['key' => 'El Protocolo del Observador No Reactivo', 'text' => 'Para neutralizar la descarga adrenérgica provocada por el parpadeo del precio...'],
                    ['key' => 'Regulación Vagocelular Operativa', 'text' => 'Antes de pulsar el disparador de órdenes, aplicá respiración táctica...'],
                ],
            ],
            'tec' => [
                'title' => '2. Análisis Técnico Algorítmico',
                'blocks' => [
                    ['key' => 'La Huella Institucional', 'text' => 'Rompemos el paradigma retail. El algoritmo interbancario no reconoce soportes ni resistencias...'],
                    ['key' => 'Mapeo de Estructuras', 'text' => 'Identificamos de forma sistemática la dirección estructural mayor...'],
                    ['key' => 'Piscinas de Liquidez vs. Retail Soporte', 'text' => 'Las consolidaciones minoristas son ingeniería de liquidez...'],
                    ['key' => 'Rangos de Tiempo Sagrados (Killzones)', 'text' => 'El precio solo se mueve con verdadera intención en ventanas específicas...'],
                ],
            ],
            'fun' => [
                'title' => '3. Análisis Fundamental & Flujo Macro',
                'blocks' => [
                    ['key' => 'La Energía Detrás del Gráfico', 'text' => 'El mercado no altera su cotización por capricho de patrones geométricos...'],
                    ['key' => 'PMI e Indicadores Adelantados', 'text' => 'El desglose del PMI de manufacturas y servicios traza el mapa del crecimiento...'],
                    ['key' => 'La Ecuación del Diferencial de Tasas', 'text' => 'El capital global busca rendimiento y seguridad...'],
                    ['key' => 'Divergencia entre PMI y Soft Landing', 'text' => 'Un PMI industrial cayendo por debajo de 45 anuncia contracción económica...'],
                ],
            ],
            'fib' => [
                'title' => '4. Niveles OTE Sagrados',
                'blocks' => [
                    ['key' => 'Zonas Óptimas de Retroceso (OTE)', 'text' => 'Mapeamos de manera quirúrgica la zona de descuento profunda...'],
                    ['key' => 'Unión en Armonía con la Tendencia', 'text' => 'Nuestra victoria matemática no reside en predecir reversiones...'],
                    ['key' => 'Premium vs. Discount Zone', 'text' => 'Nunca compres en la mitad superior de un rango operativo...'],
                    ['key' => 'Confluencia de Bloques de Órdenes', 'text' => 'El nivel OTE alcanza su máxima probabilidad estadística...'],
                ],
            ],
            'step' => [
                'title' => '5. Lógica de Ejecución (2 Steps Inicial)',
                'blocks' => [
                    ['key' => 'La Simplificación de la Complejidad', 'text' => 'En un entorno saturado de indicadores ruidosos...'],
                    ['key' => 'Introducción al Modelo Madre', 'text' => 'El circuito preliminar se cierra entendiendo la base del BOS y del LG...'],
                    ['key' => 'Anatomía de un LG (Liquidity Grab) Válido', 'text' => 'Una toma de liquidez legítima debe ocurrir mediante una mecha rápida...'],
                    ['key' => 'El Filtro del BOS Interno', 'text' => 'Tras el barrido (LG), esperamos el rompimiento de la estructura interna...'],
                ],
            ],
        ];
    }
}
