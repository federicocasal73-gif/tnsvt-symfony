<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260715000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seed default shop catalog with frames, avatars, themes, effects, backgrounds, bundles';
    }

    public function up(Schema $schema): void
    {
        // FRAMES (8)
        $frames = [
            ['fr_bronze', 'Frame Bronce',   'border bronze básico',        300,  'common'],
            ['fr_silver', 'Frame Plata',    'border plata con shine',       600,  'common'],
            ['fr_gold',   'Frame Oro',      'border oro con partículas',   1200, 'rare'],
            ['fr_violet', 'Frame Violeta',  'border violeta glow',         1000, 'rare'],
            ['fr_diamond','Frame Diamante', 'border diamante facetado',    2500, 'epic'],
            ['fr_fire',   'Frame Fuego',    'animación de llamas',         2000, 'epic'],
            ['fr_legend', 'Frame Legendario','frame con animación XP',     5000, 'legendary'],
            ['fr_pro',    'Frame Pro',      'frame para VIP',              3000, 'epic'],
        ];
        foreach ($frames as $i => [$id, $name, $desc, $cost, $rarity]) {
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                [$id, 'frame', $name, $desc, $cost, $rarity, $i]);
        }

        // AVATARS (12)
        $avatars = [
            ['a1', 'Avatar Base', 'avatar default', 0],
            ['a_cyber', 'Cibernético', 'avatar estilo cyberpunk', 200],
            ['a_zen', 'Zen', 'avatar minimal zen', 200],
            ['a_astro', 'Astronauta', 'avatar traje espacial', 400],
            ['a_merlin', 'Merlín', 'avatar mago del trading', 600],
            ['a_jedi', 'Jedi', 'avatar jedi', 500],
            ['a_spartan', 'Espartano', 'avatar guerrero', 500],
            ['a_pharaoh', 'Faraón', 'avatar egipcio', 800],
            ['a_viking', 'Vikingo', 'avatar vikingo', 600],
            ['a_samurai', 'Samurái', 'avatar samurai', 700],
            ['a_phoenix', 'Fénix', 'avatar fénix animado', 1500],
            ['a_cosmic', 'Cósmico', 'avatar galaxia animada', 1500],
        ];
        foreach ($avatars as $i => [$id, $name, $desc, $cost]) {
            $rarity = $cost >= 1500 ? 'epic' : ($cost >= 500 ? 'rare' : 'common');
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, "avatar", ?, ?, ?, ?, ?, 1)',
                [$id, $name, $desc, $cost, $rarity, $i]);
        }

        // THEMES (6)
        $themes = [
            ['th0', 'Theme Default', 'paleta original', 0],
            ['th_bronze', 'Theme Bronce', 'paleta cálida bronce', 500],
            ['th_neon', 'Theme Neón', 'colores neón vibrantes', 800],
            ['th_mono', 'Theme Monocromático', 'blanco y negro', 1000],
            ['th_forest', 'Theme Bosque', 'verdes naturales', 800],
            ['th_galaxy', 'Theme Galaxia', 'azules cósmicos', 1500],
        ];
        foreach ($themes as $i => [$id, $name, $desc, $cost]) {
            $rarity = $cost >= 1500 ? 'epic' : ($cost >= 800 ? 'rare' : 'common');
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, "theme", ?, ?, ?, ?, ?, 1)',
                [$id, $name, $desc, $cost, $rarity, $i]);
        }

        // EFFECTS (10)
        $effects = [
            ['ef0', 'Sin efecto', 'sin efecto', 0],
            ['ef_sparkle', 'Destellos', 'efecto de chispas', 800],
            ['ef_glow', 'Brillo', 'efecto glow continuo', 800],
            ['ef_fire', 'Fuego', 'efecto de fuego', 1500],
            ['ef_electric', 'Eléctrico', 'rayos eléctricos', 1500],
            ['ef_snow', 'Nieve', 'efecto nieve', 1200],
            ['ef_stars', 'Estrellas', 'estrellas brillantes', 2000],
            ['ef_matrix', 'Matrix', 'efecto matrix', 2500],
            ['ef_rainbow', 'Arcoíris', 'colores arcoíris', 3000],
            ['ef_legend', 'Legendario', 'efecto premium animated', 5000],
        ];
        foreach ($effects as $i => [$id, $name, $desc, $cost]) {
            $rarity = $cost >= 5000 ? 'legendary' : ($cost >= 1500 ? 'epic' : ($cost >= 800 ? 'rare' : 'common'));
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, "effect", ?, ?, ?, ?, ?, 1)',
                [$id, $name, $desc, $cost, $rarity, $i]);
        }

        // BACKGROUNDS (8)
        $bgs = [
            ['bg0', 'Background Default', 'sin fondo', 0],
            ['bg_arctic', 'Ártico', 'aurora boreal', 1000],
            ['bg_desert', 'Desierto', 'dunas al atardecer', 1000],
            ['bg_forest', 'Bosque', 'bosque encantado', 1000],
            ['bg_city', 'Ciudad', 'skyline nocturno', 1500],
            ['bg_ocean', 'Océano', 'océano profundo', 1200],
            ['bg_mountain', 'Montaña', 'cumbre nevada', 1500],
            ['bg_galaxy', 'Galaxia', 'espacio profundo animado', 5000],
        ];
        foreach ($bgs as $i => [$id, $name, $desc, $cost]) {
            $rarity = $cost >= 5000 ? 'legendary' : ($cost >= 1500 ? 'epic' : 'rare');
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, "background", ?, ?, ?, ?, ?, 1)',
                [$id, $name, $desc, $cost, $rarity, $i]);
        }

        // BUNDLES (5)
        $bundles = [
            ['bu_starter', 'Starter Bundle', 'avatar + theme', 2500],
            ['bu_pro', 'Pro Bundle', 'frame + effect + theme', 5000],
            ['bu_legend', 'Legend Bundle', 'todo legendary', 10000],
            ['bu_winter', 'Winter Bundle', 'seasonal', 7500],
            ['bu_vip_pack', 'VIP Pack', 'todos los frames', 15000],
        ];
        foreach ($bundles as $i => [$id, $name, $desc, $cost]) {
            $rarity = $cost >= 10000 ? 'legendary' : 'epic';
            $this->addSql('INSERT INTO shop_items (item_id, category, name, description, coin_cost, rarity, sort_order, active) VALUES (?, "bundle", ?, ?, ?, ?, ?, 1)',
                [$id, $name, $desc, $cost, $rarity, $i]);
        }
    }

    public function down(Schema $schema): void
    {
        // CASCADE on shop_items if references exist
        $this->addSql("DELETE FROM shop_items WHERE category IN ('frame','avatar','theme','effect','background','bundle')");
    }
}
