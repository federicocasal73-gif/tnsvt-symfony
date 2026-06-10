<?php

namespace App\Entity;

use App\Repository\TradeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TradeRepository::class)]
#[ORM\Table(name: 'trades')]
class Trade
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $date = null;

    #[ORM\Column(length: 20)]
    private ?string $asset = null;

    #[ORM\Column(length: 10)]
    private ?string $direction = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $entry = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $sl = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $tp = null;

    #[ORM\Column(length: 20)]
    private ?string $result = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 12, scale: 2, options: ['default' => 0])]
    private float $pnl = 0;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $ratio = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $photos = null;

    public function __construct()
    {
        $this->date = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getDate(): ?\DateTimeImmutable { return $this->date; }
    public function setDate(\DateTimeImmutable $date): static { $this->date = $date; return $this; }

    public function getAsset(): ?string { return $this->asset; }
    public function setAsset(string $asset): static { $this->asset = $asset; return $this; }

    public function getDirection(): ?string { return $this->direction; }
    public function setDirection(string $direction): static { $this->direction = $direction; return $this; }

    public function getEntry(): ?string { return $this->entry; }
    public function setEntry(?string $entry): static { $this->entry = $entry; return $this; }

    public function getSl(): ?string { return $this->sl; }
    public function setSl(?string $sl): static { $this->sl = $sl; return $this; }

    public function getTp(): ?string { return $this->tp; }
    public function setTp(?string $tp): static { $this->tp = $tp; return $this; }

    public function getResult(): ?string { return $this->result; }
    public function setResult(string $result): static { $this->result = $result; return $this; }

    public function getPnl(): float { return $this->pnl; }
    public function setPnl(float $pnl): static { $this->pnl = $pnl; return $this; }

    public function getRatio(): ?string { return $this->ratio; }
    public function setRatio(?string $ratio): static { $this->ratio = $ratio; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getPhotos(): ?array { return $this->photos; }
    public function setPhotos(?array $photos): static { $this->photos = $photos; return $this; }
}
