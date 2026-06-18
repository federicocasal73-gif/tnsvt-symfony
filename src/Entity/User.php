<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    private ?string $code = null;

    #[ORM\Column(length: 180, nullable: true)]
    private ?string $email = null;

    #[ORM\Column(length: 100)]
    private ?string $name = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $lastLogin = null;

    #[ORM\Column(type: Types::JSON)]
    private array $roles = ['ROLE_USER'];

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $password = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 12, scale: 2, options: ['default' => '0.00'])]
    private string $walletBalance = '0.00';

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: WalletTransaction::class)]
    private Collection $walletTransactions;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: TournamentEntry::class)]
    private Collection $tournamentEntries;

    public function __construct()
    {
        $this->walletTransactions = new ArrayCollection();
        $this->tournamentEntries = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getCode(): ?string { return $this->code; }
    public function setCode(string $code): static { $this->code = $code; return $this; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): static { $this->email = $email; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }

    public function getLastLogin(): ?\DateTimeImmutable { return $this->lastLogin; }
    public function setLastLogin(?\DateTimeImmutable $lastLogin): static { $this->lastLogin = $lastLogin; return $this; }

    public function getRoles(): array { return $this->roles; }
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }

    public function getPassword(): ?string { return $this->password; }
    public function setPassword(?string $password): static { $this->password = $password; return $this; }

    public function getWalletBalance(): string { return $this->walletBalance; }
    public function setWalletBalance(string $b): static { $this->walletBalance = $b; return $this; }

    public function getWalletBalanceFloat(): float { return (float) $this->walletBalance; }
    public function hasBalance(float $min): bool { return $this->getWalletBalanceFloat() >= $min; }
    public function addToWallet(float $amount): static
    {
        $this->walletBalance = number_format($this->getWalletBalanceFloat() + $amount, 2, '.', '');
        return $this;
    }
    public function subtractFromWallet(float $amount): static
    {
        $this->walletBalance = number_format($this->getWalletBalanceFloat() - $amount, 2, '.', '');
        return $this;
    }

    public function getWalletTransactions(): Collection { return $this->walletTransactions; }
    public function getTournamentEntries(): Collection { return $this->tournamentEntries; }

    public function getUserIdentifier(): string { return $this->code ?? ''; }
    public function eraseCredentials(): void {}
}

