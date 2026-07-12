<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class KernelTest extends KernelTestCase
{
    public function testKernelBoots(): void
    {
        $kernel = self::bootKernel();
        $this->assertNotNull($kernel);
        $this->assertSame('test', $kernel->getEnvironment());
    }
}
