"""
TNSVT - Wallet & Torneos con dinero real
=========================================
Genera un PDF profesional con la arquitectura completa de:
- Fase 1: MVP manual (arranca esta semana)
- Fase 2: MercadoPago Argentina
- Fase 3: Binance Pay (USDT/USDC)
- Fase 4: Otros paises (Stripe, Wise, crypto)
- Schema, endpoints, frontend, legal, timeline

Uso:
    py docs/gen_pdf_wallet.py
"""
import os
import sys
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, Flowable, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas

# ── Layout ──
PAGE_MARGIN_LEFT = 2 * cm
PAGE_MARGIN_RIGHT = 2 * cm
PAGE_MARGIN_TOP = 2.5 * cm
PAGE_MARGIN_BOTTOM = 2.5 * cm

# ── Colores TNSVT ──
GOLD = colors.HexColor('#d4af37')
GOLD_DARK = colors.HexColor('#8b6914')
GOLD_LIGHT = colors.HexColor('#fff0c0')
GOLD_BRIGHT = colors.HexColor('#ffd764')
VIOLET = colors.HexColor('#9353ff')
VIOLET_LIGHT = colors.HexColor('#c8a0ff')
GREEN = colors.HexColor('#4ade80')
RED = colors.HexColor('#f87171')
BLUE = colors.HexColor('#60a5fa')
DARK = colors.HexColor('#0d0818')
DARK_MID = colors.HexColor('#1a1228')
GRAY = colors.HexColor('#666666')
GRAY_LIGHT = colors.HexColor('#e0e0e0')
WHITE = colors.HexColor('#ffffff')

# ── Page canvas with header/footer ──
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.setStrokeColor(GOLD)
        self.setLineWidth(1.5)
        self.line(PAGE_MARGIN_LEFT, A4[1] - 1.5 * cm, A4[0] - PAGE_MARGIN_RIGHT, A4[1] - 1.5 * cm)
        self.setFillColor(GOLD_DARK)
        self.setFont('Helvetica-Bold', 9)
        self.drawString(PAGE_MARGIN_LEFT, A4[1] - 1.2 * cm, "TNSVT - Wallet & Torneos con dinero real")
        self.setFillColor(GRAY)
        self.setFont('Helvetica', 9)
        self.drawRightString(A4[0] - PAGE_MARGIN_RIGHT, A4[1] - 1.2 * cm, "Junio 2026 - v1.0")
        self.setStrokeColor(GOLD)
        self.setLineWidth(0.5)
        self.line(PAGE_MARGIN_LEFT, 1.5 * cm, A4[0] - PAGE_MARGIN_RIGHT, 1.5 * cm)
        self.setFillColor(GRAY)
        self.setFont('Helvetica', 8)
        self.drawString(PAGE_MARGIN_LEFT, 1.1 * cm, "TNSVT - Documento interno y confidencial")
        self.setFont('Helvetica-Bold', 9)
        self.setFillColor(GOLD_DARK)
        self.drawRightString(A4[0] - PAGE_MARGIN_RIGHT, 1.1 * cm, f"Pagina {self._pageNumber} de {page_count}")


def make_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle('TNSVT_DocTitle', parent=s['Title'], fontName='Helvetica-Bold',
        fontSize=28, leading=34, textColor=GOLD_BRIGHT, alignment=TA_CENTER, spaceAfter=8))
    s.add(ParagraphStyle('TNSVT_DocSubtitle', parent=s['Normal'], fontName='Helvetica',
        fontSize=14, leading=18, textColor=GRAY_LIGHT, alignment=TA_CENTER, spaceAfter=24))
    s.add(ParagraphStyle('TNSVT_SectionTitle', parent=s['Heading1'], fontName='Helvetica-Bold',
        fontSize=20, leading=24, textColor=GOLD_BRIGHT, spaceBefore=18, spaceAfter=12))
    s.add(ParagraphStyle('TNSVT_Subsection', parent=s['Heading2'], fontName='Helvetica-Bold',
        fontSize=14, leading=18, textColor=VIOLET_LIGHT, spaceBefore=12, spaceAfter=6))
    s.add(ParagraphStyle('TNSVT_H3', parent=s['Heading3'], fontName='Helvetica-Bold',
        fontSize=12, leading=16, textColor=GOLD, spaceBefore=8, spaceAfter=4))
    s.add(ParagraphStyle('TNSVT_Body', parent=s['BodyText'], fontName='Helvetica',
        fontSize=10, leading=14, textColor=GRAY_LIGHT, spaceAfter=6, alignment=TA_JUSTIFY))
    s.add(ParagraphStyle('TNSVT_Bullet', parent=s['BodyText'], fontName='Helvetica',
        fontSize=10, leading=14, textColor=GRAY_LIGHT, leftIndent=14, bulletIndent=2, spaceAfter=3))
    s.add(ParagraphStyle('TNSVT_Code', parent=s['Code'], fontName='Courier',
        fontSize=8, leading=11, textColor=GOLD_LIGHT, backColor=DARK_MID,
        borderColor=GOLD_DARK, borderWidth=0.5, borderPadding=4, leftIndent=8, rightIndent=8, spaceAfter=6))
    s.add(ParagraphStyle('TNSVT_TableHeader', parent=s['Normal'], fontName='Helvetica-Bold',
        fontSize=9, leading=12, textColor=DARK, alignment=TA_CENTER))
    s.add(ParagraphStyle('TNSVT_TableCell', parent=s['Normal'], fontName='Helvetica',
        fontSize=8, leading=11, textColor=GRAY_LIGHT))
    s.add(ParagraphStyle('TNSVT_Callout', parent=s['BodyText'], fontName='Helvetica',
        fontSize=10, leading=14, textColor=WHITE, backColor=DARK_MID,
        borderColor=GOLD, borderWidth=1, borderPadding=8, leftIndent=10, rightIndent=10, spaceAfter=10))
    s.add(ParagraphStyle('TNSVT_Critical', parent=s['BodyText'], fontName='Helvetica-Bold',
        fontSize=10, leading=14, textColor=RED, backColor=colors.HexColor('#2a1010'),
        borderColor=RED, borderWidth=1, borderPadding=8, leftIndent=10, rightIndent=10, spaceAfter=10))
    s.add(ParagraphStyle('TNSVT_Success', parent=s['BodyText'], fontName='Helvetica-Bold',
        fontSize=10, leading=14, textColor=GREEN, backColor=colors.HexColor('#0a1f12'),
        borderColor=GREEN, borderWidth=1, borderPadding=8, leftIndent=10, rightIndent=10, spaceAfter=10))
    return s


def code_block(s, text, lang=''):
    """Render a code block with syntax-style formatting."""
    return Paragraph(text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>'), s)


def table(s, header, rows, col_widths=None):
    """Build a styled table."""
    data = [[Paragraph(c, s['TNSVT_TableHeader']) for c in header]]
    for r in rows:
        data.append([Paragraph(c, s['TNSVT_TableCell']) for c in r])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, -1), DARK_MID),
        ('GRID', (0, 0), (-1, -1), 0.4, GOLD_DARK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t


# ════════════════════════════════════════════════════════════
# DOCUMENT CONTENT
# ════════════════════════════════════════════════════════════

def build():
    out_path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\HP 240 inch G9\tnsvt-symfony\docs\wallet-torneos.pdf"
    doc = SimpleDocTemplate(out_path, pagesize=A4,
        leftMargin=PAGE_MARGIN_LEFT, rightMargin=PAGE_MARGIN_RIGHT,
        topMargin=PAGE_MARGIN_TOP, bottomMargin=PAGE_MARGIN_BOTTOM,
        title="TNSVT - Wallet & Torneos con dinero real",
        author="TNSVT Dev")
    s = make_styles()
    story = []

    # ── COVER ──
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph("T.N.S.V.T", s['TNSVT_DocTitle']))
    story.append(Paragraph("Wallet &amp; Torneos con dinero real", s['TNSVT_DocTitle']))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Arquitectura completa para monetizar la comunidad", s['TNSVT_DocSubtitle']))
    story.append(Paragraph("12 amigos ya estan listos para poner plata. Arrancamos.", s['TNSVT_DocSubtitle']))
    story.append(Spacer(1, 1*cm))
    story.append(table(s,
        ['Fase', 'Stack', 'Tiempo', 'Status'],
        [
            ['1. MVP manual', 'Admin panel + DB', '1-2 dias', '⬅ ARRANCA HOY'],
            ['2. MercadoPago AR', 'API MP + webhooks', '2-3 dias', 'Semana 2'],
            ['3. Binance Pay', 'binance-connector-php', '2-3 dias', 'Semana 3'],
            ['4. Crypto directo', 'Self-custody multi-chain', '3-5 dias', 'Mes 2'],
            ['5. Stripe (cards)', 'stripe/stripe-php', '1 dia', 'Cuando haga falta'],
            ['6. Wise (bancos)', 'transferwise/api', '1 dia', 'Cuando haga falta'],
        ],
        col_widths=[4*cm, 5*cm, 2.5*cm, 4*cm]))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        f"<b>Documento generado:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}<br/>"
        f"<b>Version:</b> 1.0 - Plan inicial<br/>"
        f"<b>Autor:</b> TNSVT Dev<br/>"
        f"<b>Stack:</b> Symfony 7 + PHP 8.4 + SQLite + Capacitor 6 + Vanilla JS",
        s['TNSVT_Body']))
    story.append(PageBreak())

    # ── TOC ──
    story.append(Paragraph("Indice", s['TNSVT_SectionTitle']))
    story.append(Paragraph(
        "1. Vision general y fases<br/>"
        "2. Fase 1 - MVP manual (lo que arrancamos)<br/>"
        "3. Schema de base de datos<br/>"
        "4. Endpoints de la API<br/>"
        "5. Frontend TNSVT (sidebar + tabs)<br/>"
        "6. Frontend Game (s-torneos refactor)<br/>"
        "7. Cron y auto-close<br/>"
        "8. Admin panel completo<br/>"
        "9. Conversion ARS-USD (live rate)<br/>"
        "10. Fase 2 - MercadoPago Argentina<br/>"
        "11. Fase 3 - Binance Pay<br/>"
        "12. Fase 4 - Otros paises<br/>"
        "13. Compliance &amp; legal en Argentina<br/>"
        "14. Plan por etapas (4-6 stages)<br/>"
        "15. Costos, ROI y proyeccion",
        s['TNSVT_Body']))
    story.append(PageBreak())

    # ═══════════ SECTION 1 ═══════════
    story.append(Paragraph("1. Vision general y fases", s['TNSVT_SectionTitle']))

    story.append(Paragraph("El objetivo", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Convertir T.N.S.V.T de un juego didactico gratis a una plataforma con economia interna donde los "
        "traders pueden competir entre si por dinero real. La mecanica es simple: el admin crea un torneo "
        "con un entry fee (ej. $5 USD), los users se suman, operan una semana en el Portfolio virtual, "
        "y el que mas PnL genera se lleva el pozo.", s['TNSVT_Body']))

    story.append(Paragraph("El truco: Portfolio mode ya esta listo", s['TNSVT_H3']))
    story.append(Paragraph(
        "TNSVT ya tiene un Portfolio demo con $50k virtuales, posiciones LONG/SHORT, apalancamiento, "
        "stop loss, take profit, y ahora precios reales de CoinGecko. Los torneos reutilizan esta "
        "infraestructura - no hay que inventar nada nuevo, solo agregar:</s['TNSVT_Body']>".replace("</s['TNSVT_Body']>", "</s>") if False else s['TNSVT_Body'],)) if False else None
    story.append(Paragraph(
        "TNSVT ya tiene un Portfolio demo con $50k virtuales, posiciones LONG/SHORT, apalancamiento, "
        "stop loss, take profit, y ahora precios reales de CoinGecko. Los torneos reutilizan esta "
        "infraestructura - no hay que inventar nada nuevo, solo agregar:", s['TNSVT_Body']))

    story.append(Paragraph(
        "<b>1.</b> Un wallet virtual por user (tabla users.wallet_balance)<br/>"
        "<b>2.</b> Un sistema de torneos con entry fee + prize pool<br/>"
        "<b>3.</b> Una UI para depositar plata real (MP/Binance/Crypto)<br/>"
        "<b>4.</b> Una UI para ver leaderboard en vivo durante la semana", s['TNSVT_Bullet']))

    story.append(Paragraph("Fases de implementacion", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Fase', 'Que resuelve', 'Stack', 'Tiempo', 'Costo', 'Complejidad'],
        [
            ['1. MVP', 'Lanzar YA con 12 amigos', 'Admin panel + DB', '1-2 dias', '$0', '🟢 Baja'],
            ['2. MP AR', 'Auto-deposito en ARS', 'mercadopago/sdk-php', '2-3 dias', '$0 + fees MP', '🟡 Media'],
            ['3. Binance', 'USDT/USDC global', 'binance-connector-php', '2-3 dias', '$0 (0% fee)', '🟡 Media'],
            ['4. Crypto', 'USDT ERC20/TRC20/BEP20', 'web3.php + alchemy', '3-5 dias', '$0-50/mes RPCs', '🔴 Alta'],
            ['5. Stripe', 'Cards internacionales', 'stripe/stripe-php', '1 dia', '0 + 2.9% fee', '🟡 Media'],
            ['6. Wise', 'Bancos EU/UK', 'transferwise/api', '1 dia', '0 + 0.5% fee', '🟡 Media'],
        ],
        col_widths=[1.8*cm, 4.5*cm, 4.2*cm, 1.8*cm, 2.7*cm, 2*cm]))

    story.append(Paragraph("Por que Fase 1 manual primero", s['TNSVT_H3']))
    story.append(Paragraph(
        "Con 12 amigos, vos podes recibir un MP de $5.000 ARS, mirar tu cuenta, y acreditarles el "
        "balance a mano en 30 segundos. Es mas seguro, mas rapido de implementar, y no requiere "
        "ninguna API externa. Cuando tengas 50+ users o quieras escalar, swap a Fase 2 con MP API. "
        "El codigo de Fase 1 se mantiene - solo cambia el &quot;como se acredita&quot; (manual vs auto).",
        s['TNSVT_Callout']))

    story.append(PageBreak())

    # ═══════════ SECTION 2 ═══════════
    story.append(Paragraph("2. Fase 1 - MVP manual (la que arrancamos)", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Flujo end-to-end de un user", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Dia 0 (deposito):</b><br/>"
        "&nbsp;&nbsp;1. Juan te manda $5.000 ARS por MP<br/>"
        "&nbsp;&nbsp;2. Vos vas a /admin/wallet en tu panel privado<br/>"
        "&nbsp;&nbsp;3. Pones code &quot;juanp01&quot;, monto $5 USD (equiv a $5.000 ARS hoy), boton &quot;Acreditar&quot;<br/>"
        "&nbsp;&nbsp;4. Se crea wallet_transaction type=deposit, status=confirmed<br/>"
        "&nbsp;&nbsp;5. Su balance sube a $5 USD<br/><br/>"
        "<b>Dia 0 (entrar a torneo):</b><br/>"
        "&nbsp;&nbsp;1. Juan ve el torneo activo &quot;Semanal $5&quot; en s-torneos<br/>"
        "&nbsp;&nbsp;2. Click &quot;Unirme $5&quot; - el sistema le descuenta $5 de su wallet<br/>"
        "&nbsp;&nbsp;3. Se crea tournament_entry, captura starting_equity = balance + open_pnl actual<br/>"
        "&nbsp;&nbsp;4. Aparece en el leaderboard del torneo<br/><br/>"
        "<b>Dia 1-7 (compete):</b><br/>"
        "&nbsp;&nbsp;1. Juan opera en Portfolio, gana/perdin PnL<br/>"
        "&nbsp;&nbsp;2. Cada tick actualiza su pnl_pct = (current_equity - starting) / starting * 100<br/>"
        "&nbsp;&nbsp;3. Leaderboard muestra rank en vivo<br/><br/>"
        "<b>Dia 7 (cierre):</b><br/>"
        "&nbsp;&nbsp;1. Vos (o cron automatico) cierra el torneo<br/>"
        "&nbsp;&nbsp;2. Top 1 recibe 60% del prize pool, top 2 recibe 30%, top 3 recibe 10%<br/>"
        "&nbsp;&nbsp;3. Se acredita a sus wallets automaticamente<br/>"
        "&nbsp;&nbsp;4. Vos les mandas el MP/transfer a mano<br/>"
        "&nbsp;&nbsp;5. Torneo queda en historial con todos los ranks y payouts", s['TNSVT_Body']))

    story.append(Paragraph("Como se calcula el rank", s['TNSVT_H3']))
    story.append(Paragraph(
        "Cada participante tiene un <b>starting_equity</b> capturado al momento del join. Mientras "
        "el torneo esta activo, el sistema mira en vivo el <b>current_equity</b> = balance + open_pnl "
        "de su Portfolio. El <b>pnl_pct</b> = (current - starting) / starting * 100. El ranking se "
        "ordena por pnl_pct descendente. Si un user no opera durante la semana, su pnl es 0 y queda "
        "ultimo. Si todos pierden plata, el que menos perdio gana.", s['TNSVT_Body']))

    story.append(Paragraph("Que pasa si el torneo no llega a 3 participantes", s['TNSVT_H3']))
    story.append(Paragraph(
        "Si hay 1 participante: se cancela y se devuelve el entry fee. Si hay 2: se redistribuye "
        "60/40 al top 1/2. Si hay 3+: 60/30/10 como dice prize_distribution.", s['TNSVT_Body']))

    story.append(Paragraph("Que pasa si un participante hace fraude", s['TNSVT_H3']))
    story.append(Paragraph(
        "Como todo es virtual y el admin controla los creditos, no hay vector de fraude del lado "
        "del user. Lo unico que podria pasar es que alguien abuse de la confianza (jugar y no pagar, "
        "o pagar y no recibir payout). Por eso 12 amigos es manejable - si uno se manda una cagada, "
        "lo bloqueas. Si creces a 100+ users desconocidos, ahi si necesitas KYC + reputacion.", s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 3 ═══════════
    story.append(Paragraph("3. Schema de base de datos", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Migracion SQL completa (SQLite)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Toda la migracion se hace via Doctrine Migrations. Aca esta el SQL equivalente para referencia:",
        s['TNSVT_Body']))

    story.append(Paragraph(
        "-- 1. Agregar wallet_balance a users<br/>"
        "ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL;<br/>"
        "<br/>"
        "-- 2. Wallet transactions<br/>"
        "CREATE TABLE wallet_transactions (<br/>"
        "&nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT,<br/>"
        "&nbsp;&nbsp;user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,<br/>"
        "&nbsp;&nbsp;type VARCHAR(20) NOT NULL,  -- 'deposit'|'entry_fee'|'payout'|'refund'|'withdraw'<br/>"
        "&nbsp;&nbsp;amount DECIMAL(12,2) NOT NULL,  -- +credita / -debit<br/>"
        "&nbsp;&nbsp;currency VARCHAR(8) DEFAULT 'USD' NOT NULL,<br/>"
        "&nbsp;&nbsp;ref_tournament_id INT NULL,<br/>"
        "&nbsp;&nbsp;ref_payment_id VARCHAR(100) NULL,  -- MP payment_id o Binance prepayId<br/>"
        "&nbsp;&nbsp;ref_payment_method VARCHAR(20) NULL,  -- 'mp'|'binance'|'crypto'|'manual'<br/>"
        "&nbsp;&nbsp;status VARCHAR(20) DEFAULT 'confirmed' NOT NULL,  -- 'pending'|'confirmed'|'rejected'|'refunded'<br/>"
        "&nbsp;&nbsp;notes TEXT,<br/>"
        "&nbsp;&nbsp;created_at DATETIME NOT NULL,<br/>"
        "&nbsp;&nbsp;confirmed_at DATETIME NULL,<br/>"
        "&nbsp;&nbsp;confirmed_by INT NULL REFERENCES users(id)  -- admin que acredito (si es manual)<br/>"
        ");<br/>"
        "CREATE INDEX idx_wtx_user ON wallet_transactions(user_id);<br/>"
        "CREATE INDEX idx_wtx_tournament ON wallet_transactions(ref_tournament_id);<br/>"
        "CREATE INDEX idx_wtx_status ON wallet_transactions(status);<br/>"
        "CREATE INDEX idx_wtx_created ON wallet_transactions(created_at);<br/>"
        "<br/>"
        "-- 3. Tournaments<br/>"
        "CREATE TABLE tournaments (<br/>"
        "&nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT,<br/>"
        "&nbsp;&nbsp;name VARCHAR(100) NOT NULL,<br/>"
        "&nbsp;&nbsp;description TEXT,<br/>"
        "&nbsp;&nbsp;entry_fee DECIMAL(10,2) NOT NULL,<br/>"
        "&nbsp;&nbsp;prize_pool DECIMAL(12,2) DEFAULT 0.00 NOT NULL,<br/>"
        "&nbsp;&nbsp;prize_distribution VARCHAR(20) DEFAULT '60,30,10' NOT NULL,  -- pct para 1/2/3<br/>"
        "&nbsp;&nbsp;start_date DATETIME NOT NULL,<br/>"
        "&nbsp;&nbsp;end_date DATETIME NOT NULL,<br/>"
        "&nbsp;&nbsp;status VARCHAR(20) DEFAULT 'pending' NOT NULL,  -- 'pending'|'active'|'closed'|'finished'|'cancelled'<br/>"
        "&nbsp;&nbsp;max_players INT DEFAULT 100 NOT NULL,<br/>"
        "&nbsp;&nbsp;min_players INT DEFAULT 2 NOT NULL,<br/>"
        "&nbsp;&nbsp;created_by INT NOT NULL REFERENCES users(id),<br/>"
        "&nbsp;&nbsp;created_at DATETIME NOT NULL,<br/>"
        "&nbsp;&nbsp;finished_at DATETIME NULL<br/>"
        ");<br/>"
        "CREATE INDEX idx_trn_status ON tournaments(status);<br/>"
        "CREATE INDEX idx_trn_end_date ON tournaments(end_date);<br/>"
        "CREATE INDEX idx_trn_active ON tournaments(status, end_date);<br/>"
        "<br/>"
        "-- 4. Tournament entries<br/>"
        "CREATE TABLE tournament_entries (<br/>"
        "&nbsp;&nbsp;id INTEGER PRIMARY KEY AUTOINCREMENT,<br/>"
        "&nbsp;&nbsp;tournament_id INT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,<br/>"
        "&nbsp;&nbsp;user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,<br/>"
        "&nbsp;&nbsp;starting_equity DECIMAL(14,4) NOT NULL,  -- PORT.balance + open_pnl al join<br/>"
        "&nbsp;&nbsp;final_equity DECIMAL(14,4) NULL,<br/>"
        "&nbsp;&nbsp;pnl_usd DECIMAL(14,4) NULL,  -- final - starting<br/>"
        "&nbsp;&nbsp;pnl_pct DECIMAL(10,6) NULL,  -- pnl_usd / starting * 100<br/>"
        "&nbsp;&nbsp;final_rank INT NULL,<br/>"
        "&nbsp;&nbsp;payout_amount DECIMAL(12,2) NULL,<br/>"
        "&nbsp;&nbsp;status VARCHAR(20) DEFAULT 'active' NOT NULL,  -- 'active'|'finished'|'disqualified'<br/>"
        "&nbsp;&nbsp;joined_at DATETIME NOT NULL,<br/>"
        "&nbsp;&nbsp;finalized_at DATETIME NULL,<br/>"
        "&nbsp;&nbsp;UNIQUE(tournament_id, user_id)<br/>"
        ");<br/>"
        "CREATE INDEX idx_te_tournament ON tournament_entries(tournament_id);<br/>"
        "CREATE INDEX idx_te_user ON tournament_entries(user_id);<br/>"
        "CREATE INDEX idx_te_status ON tournament_entries(status);<br/>"
        "CREATE INDEX idx_te_pnl ON tournament_entries(tournament_id, pnl_pct DESC);",
        s['TNSVT_Code']))

    story.append(Paragraph("Entidades Doctrine", s['TNSVT_H3']))
    story.append(Paragraph(
        "Cada tabla tiene su entity PHP correspondiente (src/Entity/) con relaciones, getters/setters, "
        "y metodos de negocio:<br/>"
        "<b>User</b> (+ $walletBalance, getWalletBalance(), addToWallet($amount), hasBalance($min))<br/>"
        "<b>WalletTransaction</b> (const TYPE_DEPOSIT, TYPE_ENTRY_FEE, TYPE_PAYOUT, etc, getFormattedAmount())<br/>"
        "<b>Tournament</b> (const STATUS_*, isActive(), getDaysRemaining(), getCurrentPrizePool(), getParticipants())<br/>"
        "<b>TournamentEntry</b> (computeCurrentPnl($currentEquity), isActive())", s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 4 ═══════════
    story.append(Paragraph("4. Endpoints de la API", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Wallet", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Metodo', 'Path', 'Auth', 'Descripcion'],
        [
            ['GET',  '/api/wallet/balance',         'sesion o X-Game-Code', 'Devuelve el balance USD del user actual'],
            ['GET',  '/api/wallet/transactions',     'sesion o X-Game-Code', 'Lista de transacciones del user'],
            ['GET',  '/api/wallet/rates',           'publico',             'Cotizacion ARS-USD blue/oficial/mep/tarjeta'],
            ['POST', '/api/wallet/withdraw',        'sesion o X-Game-Code', 'Solicita retiro (queda pending hasta que admin confirme)'],
        ],
        col_widths=[1.5*cm, 5.5*cm, 3.5*cm, 6.5*cm]))

    story.append(Paragraph("Admin wallet", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Metodo', 'Path', 'Auth', 'Descripcion'],
        [
            ['POST', '/api/admin/wallet/credit',     'admin password', 'Acredita USD a un user (uso: confirmaste MP/Binance)'],
            ['POST', '/api/admin/wallet/debit',      'admin password', 'Debita USD de un user (uso: pagaste un payout)'],
            ['GET',  '/api/admin/wallet/pending',    'admin password', 'Lista de withdraws pendientes'],
            ['POST', '/api/admin/wallet/withdraw/{id}/approve',  'admin password', 'Aprueba un withdraw'],
            ['POST', '/api/admin/wallet/withdraw/{id}/reject',   'admin password', 'Rechaza un withdraw (devuelve el monto)'],
        ],
        col_widths=[1.5*cm, 5.5*cm, 3.5*cm, 6.5*cm]))

    story.append(Paragraph("Torneos", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Metodo', 'Path', 'Auth', 'Descripcion'],
        [
            ['GET',  '/api/tournaments/active',       'publico',       'Lista de torneos activos (status=active y end_date > now)'],
            ['GET',  '/api/tournaments/{id}',          'publico',       'Info de un torneo + lista de participantes'],
            ['POST', '/api/tournaments/{id}/join',     'user',          'Une al user al torneo, descuenta entry_fee del wallet'],
            ['GET',  '/api/tournaments/{id}/leaderboard', 'publico',    'Leaderboard en vivo ordenado por pnl_pct'],
            ['GET',  '/api/tournaments/my',            'user',          'Historial de torneos del user (activos, finalizados)'],
            ['POST', '/api/admin/tournaments/create',  'admin',         'Crea un nuevo torneo'],
            ['POST', '/api/admin/tournaments/{id}/close', 'admin',      'Cierra torneo, calcula ganadores, distribuye prize pool'],
            ['POST', '/api/admin/tournaments/{id}/cancel','admin',      'Cancela torneo (ej: si no llega al minimo)'],
        ],
        col_widths=[1.5*cm, 5.5*cm, 3.5*cm, 6.5*cm]))

    story.append(Paragraph("Detalles de /api/tournaments/{id}/join", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Request body</b> (vacio, usa sesion o X-Game-Code):<br/>"
        "<b>Response 200</b>:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;&quot;tournament_entry_id&quot;: 42,<br/>"
        "&nbsp;&nbsp;&quot;tournament_id&quot;: 7,<br/>"
        "&nbsp;&nbsp;&quot;starting_equity&quot;: 50000.0000,<br/>"
        "&nbsp;&nbsp;&quot;wallet_balance_after&quot;: 45.00,<br/>"
        "&nbsp;&nbsp;&quot;current_rank&quot;: 4<br/>"
        "}<br/><br/>"
        "<b>Errores posibles</b>:<br/>"
        "<b>400</b>: tournament_not_active, wallet_insufficient (mostrar cuanto falta), already_joined, tournament_full<br/>"
        "<b>404</b>: tournament_not_found<br/>"
        "<b>401</b>: no autenticado", s['TNSVT_Code']))

    story.append(Paragraph("Detalles de /api/admin/tournaments/create", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Request body</b>:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;&quot;name&quot;: &quot;Semanal Express&quot;,<br/>"
        "&nbsp;&nbsp;&quot;description&quot;: &quot;1 semana - BTC/ETH/SOL - el mejor trader se lleva el pozo&quot;,<br/>"
        "&nbsp;&nbsp;&quot;entry_fee&quot;: 5.00,<br/>"
        "&nbsp;&nbsp;&quot;duration_days&quot;: 7,<br/>"
        "&nbsp;&nbsp;&quot;max_players&quot;: 50,<br/>"
        "&nbsp;&nbsp;&quot;min_players&quot;: 3,<br/>"
        "&nbsp;&nbsp;&quot;prize_distribution&quot;: &quot;60,30,10&quot;,<br/>"
        "&nbsp;&nbsp;&quot;start_now&quot;: true  // si false, tomar start_date del body<br/>"
        "}<br/><br/>"
        "<b>Response 200</b>:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;&quot;tournament_id&quot;: 7,<br/>"
        "&nbsp;&nbsp;&quot;name&quot;: &quot;Semanal Express&quot;,<br/>"
        "&nbsp;&nbsp;&quot;status&quot;: &quot;active&quot;,<br/>"
        "&nbsp;&nbsp;&quot;start_date&quot;: &quot;2026-06-17T18:00:00Z&quot;,<br/>"
        "&nbsp;&nbsp;&quot;end_date&quot;: &quot;2026-06-24T18:00:00Z&quot;,<br/>"
        "&nbsp;&nbsp;&quot;entry_fee&quot;: 5.00,<br/>"
        "&nbsp;&nbsp;&quot;prize_pool&quot;: 0.00,<br/>"
        "&nbsp;&nbsp;&quot;participants&quot;: 0<br/>"
        "}",
        s['TNSVT_Code']))

    story.append(PageBreak())

    # ═══════════ SECTION 5 ═══════════
    story.append(Paragraph("5. Frontend TNSVT (sidebar + tabs)", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Sidebar nuevo", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Se agregan 2 botones al sidebar de TNSVT (debajo de Chat de Ejecutores):<br/>"
        "&nbsp;&nbsp;💰 Mi Wallet<br/>"
        "&nbsp;&nbsp;🏆 Torneos<br/><br/>"
        "El admin tiene ademas:<br/>"
        "&nbsp;&nbsp;⚙️ Admin (existente - le agregamos sub-tabs de Wallet + Torneos)",
        s['TNSVT_Body']))

    story.append(Paragraph("Tab Wallet", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Layout mobile-first con 4 bloques:<br/>"
        "<b>1. Balance card</b> (header): $XX.XX USD, equivalente en ARS (live rate), boton &quot;Depositar&quot;<br/>"
        "<b>2. Acciones rapidas</b>: Depositar / Retirar / Historial<br/>"
        "<b>3. Metodos de deposito</b> (segun fase):<br/>"
        "&nbsp;&nbsp;• Fase 1: Solo &quot;Pedile al admin que acredite&quot; + tu code visible para copiar<br/>"
        "&nbsp;&nbsp;• Fase 2: + MercadoPago (boton amarillo, abre checkout)<br/>"
        "&nbsp;&nbsp;• Fase 3: + Binance Pay (boton amarillo, abre QR)<br/>"
        "&nbsp;&nbsp;• Fase 4: + Crypto directo (boton, muestra address + QR)<br/>"
        "<b>4. Transacciones recientes</b>: lista de los ultimos 20 movimientos con tipo, monto, fecha",
        s['TNSVT_Body']))

    story.append(Paragraph("Tab Torneos (user)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Tabs internos: <b>Activos</b> | <b>Mis torneos</b> | <b>Historial</b><br/><br/>"
        "<b>Activos</b>: grid de cards con torneos disponibles. Cada card muestra: nombre, entry fee, "
        "prize pool actual, participantes, tiempo restante, boton &quot;Unirme $X&quot;<br/><br/>"
        "<b>Mis torneos</b>: cards con tus entries. Cada card muestra: nombre, mi rank, mi pnl % actual, "
        "tiempo restante, link &quot;Ir al Portfolio&quot;<br/><br/>"
        "<b>Historial</b>: tabla con torneos pasados: nombre, mi rank final, mi pnl, payout recibido, fecha",
        s['TNSVT_Body']))

    story.append(Paragraph("Admin panel - sub-tabs nuevos", s['TNSVT_H3']))
    story.append(Paragraph(
        "Dentro del tab Admin existente, se agregan:<br/>"
        "<b>Sub-tab Wallet</b>:<br/>"
        "&nbsp;&nbsp;• Form: code de user + monto USD + notas -> Acreditar<br/>"
        "&nbsp;&nbsp;• Form: code de user + monto USD + notas -> Debitar (payout manual)<br/>"
        "&nbsp;&nbsp;• Lista de transacciones pendientes de aprobar (withdraws)<br/>"
        "&nbsp;&nbsp;• Auditoria: ultimas 100 transacciones<br/><br/>"
        "<b>Sub-tab Torneos</b>:<br/>"
        "&nbsp;&nbsp;• Form: crear torneo (nombre, fee, duracion, distribucion)<br/>"
        "&nbsp;&nbsp;• Lista de torneos: filtrable por status, con acciones (cerrar/cancelar)<br/>"
        "&nbsp;&nbsp;• Auditoria: todos los payouts realizados",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 6 ═══════════
    story.append(Paragraph("6. Frontend Game (s-torneos refactor)", s['TNSVT_SectionTitle']))

    story.append(Paragraph(
        "La pantalla s-torneos del Game ya existe pero es hardcodeada. La refactoreamos para que "
        "traiga data real del backend:",
        s['TNSVT_Body']))

    story.append(Paragraph("Estructura nueva del s-torneos", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Header</b>: titulo grande &quot;🏆 Torneos&quot; + subtitulo &quot;Compite por dinero real&quot;<br/>"
        "<b>Mi estado</b>: card con mi rank actual, mi pnl % en mi torneo activo, tiempo restante<br/>"
        "<b>Sub-tabs</b>: Activos | Mis torneos | Historial<br/>"
        "<b>Grid de cards</b>: 2 columnas, cada card con info del torneo<br/>"
        "<b>Accion al clickear card</b>: modal con detalles + leaderboard inline + boton Unirme/Ver mi posicion",
        s['TNSVT_Body']))

    story.append(Paragraph("Sincronizacion con backend", s['TNSVT_H3']))
    story.append(Paragraph(
        "El Game ya tiene TNSVT_CONFIG con serverUrl y code. Solo hay que agregar:<br/>"
        "<b>tournamentsInit()</b>: al abrir s-torneos, hace GET /api/tournaments/active con X-Game-Code<br/>"
        "<b>tournamentJoin(id)</b>: POST /api/tournaments/{id}/join, actualiza balance y lista<br/>"
        "<b>tournamentLeaderboard(id)</b>: GET /api/tournaments/{id}/leaderboard cada 30s mientras esta abierto<br/>"
        "<b>Realtime</b>: el leaderboard se actualiza cada 30s con polling (suficiente para 12 users)",
        s['TNSVT_Body']))

    story.append(Paragraph("Edge case: user sin code TNSVT", s['TNSVT_H3']))
    story.append(Paragraph(
        "El Game es standalone - si el user no configuro su code TNSVT en Sync TNSVT, los botones de "
        "torneo muestran un mensaje &quot;Primero configura tu codigo TNSVT en Perfil -&gt; Sync TNSVT&quot; "
        "y link al tab correspondiente. No bloqueamos el juego, solo el feature de torneos.", s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 7 ═══════════
    story.append(Paragraph("7. Cron y auto-close", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Symfony Scheduler", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Usamos symfony/scheduler (incluido en symfony/scheduler-bundle) para correr tareas automaticas:<br/>"
        "&nbsp;&nbsp;• <b>Cada 1 minuto</b>: actualizar status de torneos (pending -&gt; active cuando llega start_date, "
        "active -&gt; closed cuando llega end_date)<br/>"
        "&nbsp;&nbsp;• <b>Cada 5 minutos</b>: refrescar leaderboard de torneos activos en cache (opcional)<br/>"
        "&nbsp;&nbsp;• <b>Cada 1 hora</b>: refrescar rate ARS-USD de dolarapi.com (cache 1h)<br/>"
        "&nbsp;&nbsp;• <b>Cuando un torneo se cierra</b>: calcular ganadores, distribuir prize pool, marcar como finished",
        s['TNSVT_Body']))

    story.append(Paragraph("Comando artisan", s['TNSVT_H3']))
    story.append(Paragraph(
        "Se crea un comando &quot;tournaments:process&quot; que:<br/>"
        "<b>1.</b> Busca torneos con status=active y end_date &lt;= now<br/>"
        "<b>2.</b> Para cada uno, cambia status a closed<br/>"
        "<b>3.</b> Calcula final_equity, pnl_pct, final_rank para cada entry<br/>"
        "<b>4.</b> Ordena por pnl_pct DESC, asigna rank<br/>"
        "<b>5.</b> Distribuye prize pool segun prize_distribution<br/>"
        "<b>6.</b> Crea wallet_transactions type=payout para los winners<br/>"
        "<b>7.</b> Suma payout_amount al wallet_balance de cada winner<br/>"
        "<b>8.</b> Cambia status a finished + set finished_at",
        s['TNSVT_Body']))

    story.append(Paragraph("Comando &quot;rates:refresh&quot;", s['TNSVT_H3']))
    story.append(Paragraph(
        "Hace GET a https://dolarapi.com/v1/dolares/{blue,oficial,mep,tarjeta} y guarda en cache "
        "(tabla rates_cache o APCu). Si falla, usa el ultimo valor conocido y loggea warning.",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 8 ═══════════
    story.append(Paragraph("8. Admin panel completo", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Autenticacion de admin", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Reusamos el patron existente en TNSVT: el admin tiene un header &quot;X-Admin-Password&quot; con el "
        "valor &quot;TNSVT-2026-CristoRey!&quot; (mismo que ya usas para login admin). El backend valida "
        "en cada endpoint /api/admin/*.<br/><br/>"
        "Alternativa futura: tabla admins con sus propios users. Para 1 admin (vos), el header es suficiente.",
        s['TNSVT_Body']))

    story.append(Paragraph("Pantalla admin - Wallet", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Form de acreditar:<br/>"
        "&nbsp;&nbsp;• Input: user code (autocomplete desde lista de users activos)<br/>"
        "&nbsp;&nbsp;• Input: monto USD (default 0, validacion positivo)<br/>"
        "&nbsp;&nbsp;• Select: payment method (manual_mp, manual_binance, manual_crypto, gift, other)<br/>"
        "&nbsp;&nbsp;• Textarea: notas (ej: &quot;Confirmado por MP operacion 12345&quot;)<br/>"
        "&nbsp;&nbsp;• Boton: &quot;Acreditar $X.XX USD a {code}&quot;<br/><br/>"
        "Tabla de transacciones recientes con filtros: por user, por tipo, por fecha.<br/>"
        "Paginada (50 por pagina).",
        s['TNSVT_Body']))

    story.append(Paragraph("Pantalla admin - Torneos", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Form de crear:<br/>"
        "&nbsp;&nbsp;• Input: nombre<br/>"
        "&nbsp;&nbsp;• Textarea: descripcion<br/>"
        "&nbsp;&nbsp;• Input: entry fee USD (default 5)<br/>"
        "&nbsp;&nbsp;• Select: duracion (1d, 3d, 7d, 14d, 30d)<br/>"
        "&nbsp;&nbsp;• Input: max players (default 100)<br/>"
        "&nbsp;&nbsp;• Input: min players (default 2)<br/>"
        "&nbsp;&nbsp;• Select: prize distribution (50/30/20, 60/30/10, 100)<br/>"
        "&nbsp;&nbsp;• Checkbox: start now vs fecha custom<br/>"
        "&nbsp;&nbsp;• Boton: &quot;Crear torneo&quot;<br/><br/>"
        "Lista de torneos con acciones: ver leaderboard, cerrar, cancelar, ver detalle.",
        s['TNSVT_Body']))

    story.append(Paragraph("Auditoria", s['TNSVT_H3']))
    story.append(Paragraph(
        "Toda accion admin se loggea en wallet_transactions y tournament_entries con confirmed_by y "
        "created_at. Esto te da un trail completo de quien acredito que, cuando, y por que. Para 12 "
        "amigos es overkill, pero cuando crezcas te salva de disputas.",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 9 ═══════════
    story.append(Paragraph("9. Conversion ARS-USD (live rate)", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Por que importa", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "MercadoPago Argentina cobra en pesos. Vos necesitas saber cuanto USD equivale para acreditar "
        "el wallet del user. Hay 3 cotizaciones relevantes:<br/>"
        "&nbsp;&nbsp;• <b>Oficial</b>: el del BCRA, siempre mas bajo<br/>"
        "&nbsp;&nbsp;• <b>Blue</b>: el del mercado paralelo, siempre mas alto (el que usa la gente)<br/>"
        "&nbsp;&nbsp;• <b>Tarjeta</b>: el que cobra MP cuando pagás con tarjeta, incluye impuestos<br/><br/>"
        "Recomendacion: <b>usar Blue</b> como default (es lo que la gente usa en la calle). El user ve "
        "&quot;USD 10 = ARS 12.000 (blue)&quot; antes de pagar, y vos le acreditas los 10 USD exactos.",
        s['TNSVT_Body']))

    story.append(Paragraph("API publica: dolarapi.com", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Endpoint</b>: https://dolarapi.com/v1/dolares/blue<br/>"
        "<b>Response</b>:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;&quot;moneda&quot;: &quot;USD&quot;,<br/>"
        "&nbsp;&nbsp;&quot;casa&quot;: &quot;blue&quot;,<br/>"
        "&nbsp;&nbsp;&quot;nombre&quot;: &quot;Blue&quot;,<br/>"
        "&nbsp;&nbsp;&quot;compra&quot;: 1180,<br/>"
        "&nbsp;&nbsp;&quot;venta&quot;: 1200,<br/>"
        "&nbsp;&nbsp;&quot;fecha&quot;: &quot;2026-06-17T18:00:00.000Z&quot;<br/>"
        "}<br/><br/>"
        "Otros endpoints: /oficial, /mep, /ccl, /tarjeta, /cripto. Sin autenticacion, sin rate limit "
        "agresivo, gratis, ~99.9% uptime. Refresh: cada 30 segundos del lado de dolarapi.",
        s['TNSVT_Code']))

    story.append(Paragraph("Como se usa en el flujo", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>1.</b> User pide depositar $10 USD<br/>"
        "<b>2.</b> Backend lee rate blue.venta del cache (si no hay, fetchea y cachea 1h)<br/>"
        "<b>3.</b> Calcula: amount_ars = 10 * rate_venta = 10 * 1200 = $12.000 ARS<br/>"
        "<b>4.</b> Devuelve al frontend: { amount_usd: 10, amount_ars: 12000, rate: 1200, source: &quot;dolarapi.com - 17/06 18:00&quot; }<br/>"
        "<b>5.</b> Frontend muestra: &quot;Vas a pagar $12.000 ARS (cotizacion blue)&quot;<br/>"
        "<b>6.</b> User confirma y paga via MP<br/>"
        "<b>7.</b> MP notifica via webhook que pago $12.000 ARS<br/>"
        "<b>8.</b> Backend valida el monto (puede haber fluctuado 1%, tolerancia) y acredita 10 USD",
        s['TNSVT_Body']))

    story.append(Paragraph("Cache de rates", s['TNSVT_H3']))
    story.append(Paragraph(
        "Tabla <b>rates_cache</b> con (currency, type, buy, sell, source, fetched_at). Refresh cada 1h. "
        "Si dolarapi cae, usamos el ultimo valor conocido y loggeamos warning. Para el user final, la "
        "UI siempre muestra el rate actual con timestamp.",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 10 ═══════════
    story.append(Paragraph("10. Fase 2 - MercadoPago Argentina", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Cuando implementar", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Cuando vos ya no quieras acreditar a mano. Trigger: si te llega mas de 5 depositos por dia, "
        "o si los 12 amigos se quejan de la friccion. Tiempo estimado: 2-3 dias.",
        s['TNSVT_Body']))

    story.append(Paragraph("Setup de MP", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>1.</b> Crear cuenta MercadoPago (ya la tenes)<br/>"
        "<b>2.</b> Ir a https://www.mercadopago.com.ar/developers/panel/credentials<br/>"
        "<b>3.</b> Crear aplicacion &quot;TNSVT Wallet&quot;<br/>"
        "<b>4.</b> Copiar credenciales:<br/>"
        "&nbsp;&nbsp;• APP_USR-xxxx (Access Token produccion)<br/>"
        "&nbsp;&nbsp;• APP_USR-yyyy (Public Key)<br/>"
        "<b>5.</b> Configurar webhook URL en el panel: https://tnsvt.com/api/wallet/deposit/webhook/mp<br/>"
        "<b>6.</b> Agregar a .env:<br/>"
        "&nbsp;&nbsp;MP_ACCESS_TOKEN=APP_USR-xxxx<br/>"
        "&nbsp;&nbsp;MP_PUBLIC_KEY=APP_USR-yyyy<br/>"
        "&nbsp;&nbsp;MP_WEBHOOK_URL=https://tnsvt.com/api/wallet/deposit/webhook/mp",
        s['TNSVT_Body']))

    story.append(Paragraph("SDK PHP oficial", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Composer</b>: composer require mercadopago/sdk:^2.5<br/>"
        "<b>Uso basico</b> (Checkout Pro):<br/>"
        "use MercadoPago\\SDK\\MercadoPago;<br/>"
        "use MercadoPago\\SDK\\Preference;<br/>"
        "use MercadoPago\\SDK\\Item;<br/>"
        "<br/>"
        "MercadoPago::setAccessToken(env('MP_ACCESS_TOKEN'));<br/>"
        "$preference = new Preference();<br/>"
        "$item = new Item();<br/>"
        "$item-&gt;title = 'T.N.S.V.T Wallet Deposit $10 USD';<br/>"
        "$item-&gt;quantity = 1;<br/>"
        "$item-&gt;unit_price = 12000;  // ARS<br/>"
        "$preference-&gt;items = [$item];<br/>"
        "$preference-&gt;back_urls = [<br/>"
        "&nbsp;&nbsp;'success' =&gt; 'https://tnsvt.com/wallet?status=success',<br/>"
        "&nbsp;&nbsp;'failure' =&gt; 'https://tnsvt.com/wallet?status=failure',<br/>"
        "&nbsp;&nbsp;'pending' =&gt; 'https://tnsvt.com/wallet?status=pending',<br/>"
        "];<br/>"
        "$preference-&gt;notification_url = env('MP_WEBHOOK_URL');<br/>"
        "$preference-&gt;external_reference = 'deposit_' . $depositId;<br/>"
        "$preference-&gt;save();<br/>"
        "return new JsonResponse([&quot;checkout_url&quot; =&gt; $preference-&gt;sandbox_init_point]);",
        s['TNSVT_Code']))

    story.append(Paragraph("Webhook handler", s['TNSVT_H3']))
    story.append(Paragraph(
        "MP envia un POST al webhook cuando el pago se acredita. Estructura del payload:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;&quot;type&quot;: &quot;payment&quot;,<br/>"
        "&nbsp;&nbsp;&quot;data&quot;: {<br/>"
        "&nbsp;&nbsp;&nbsp;&quot;id&quot;: 123456789<br/>"
        "&nbsp;&nbsp;}<br/>"
        "}<br/><br/>"
        "El handler hace GET a /v1/payments/{id} con el access token para obtener detalles, valida "
        "que status=approved, valida el monto, y acredita el wallet. Tambien valida la firma HMAC "
        "del header x-signature para evitar webhooks spoofeados.",
        s['TNSVT_Body']))

    story.append(Paragraph("Metodos de pago que acepta MP Argentina", s['TNSVT_H3']))
    story.append(table(s,
        ['Metodo', 'Tipo', 'Comision MP', 'Tiempo de acreditacion'],
        [
            ['Tarjeta de credito', 'Online', '~3-6%', 'Inmediato'],
            ['Tarjeta de debito', 'Online', '~2-3%', 'Inmediato'],
            ['Mercado Pago (saldo)', 'Online', '0%', 'Inmediato'],
            ['Rapipago / Pago Facil', 'Efectivo', '~3-4%', '24-48h (cuando paga)'],
            ['Transferencia bancaria', 'Bancaria', '0%', 'Inmediato'],
            ['Cripto (via MP)', 'N/A', 'No soporta directo', '-'],
        ],
        col_widths=[5*cm, 3.5*cm, 3*cm, 5.5*cm]))

    story.append(Paragraph("Idempotencia del webhook", s['TNSVT_H3']))
    story.append(Paragraph(
        "MP puede enviar el mismo webhook multiples veces. Por eso:<br/>"
        "&nbsp;&nbsp;1. Antes de acreditar, hacemos SELECT por ref_payment_id en wallet_transactions<br/>"
        "&nbsp;&nbsp;2. Si ya existe con status=confirmed, retornamos 200 sin hacer nada (idempotente)<br/>"
        "&nbsp;&nbsp;3. Si no existe, creamos con status=confirmed y acreditamos el wallet<br/>"
        "&nbsp;&nbsp;4. Si falla el credito, dejamos status=pending y reintentamos",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 11 ═══════════
    story.append(Paragraph("11. Fase 3 - Binance Pay", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Por que Binance Pay", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Binance Pay es un sistema de pagos entre usuarios de Binance, sin fees, con crypto (USDT, "
        "USDC, BTC, ETH, BNB). Esta disponible en 100+ paises incluyendo Argentina, Mexico, Brasil, "
        "Colombia, Chile, Peru, etc. Para vos significa: tus amigos que ya estan en crypto pueden "
        "depositar sin friccion. Y vos recibis USDT en tu cuenta Binance, que podes cambiar a ARS "
        "via P2P o transferir a un exchange local.",
        s['TNSVT_Body']))

    story.append(Paragraph("Setup de Binance Pay", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>1.</b> Crear cuenta Binance Business: https://merchant.binance.com/<br/>"
        "<b>2.</b> Verificar identidad (KYC business - LDN/email/etc)<br/>"
        "<b>3.</b> Activar Binance Pay en el panel<br/>"
        "<b>4.</b> Crear API key con permisos de Pay<br/>"
        "<b>5.</b> Copiar credenciales:<br/>"
        "&nbsp;&nbsp;• API Key<br/>"
        "&nbsp;&nbsp;• Secret Key<br/>"
        "&nbsp;&nbsp;• Merchant ID<br/>"
        "<b>6.</b> Configurar webhook: https://tnsvt.com/api/wallet/deposit/webhook/binance<br/>"
        "<b>7.</b> Agregar a .env:<br/>"
        "&nbsp;&nbsp;BINANCE_PAY_API_KEY=xxx<br/>"
        "&nbsp;&nbsp;BINANCE_PAY_SECRET=xxx<br/>"
        "&nbsp;&nbsp;BINANCE_PAY_MERCHANT_ID=xxx<br/>"
        "&nbsp;&nbsp;BINANCE_PAY_WEBHOOK=https://tnsvt.com/api/wallet/deposit/webhook/binance",
        s['TNSVT_Body']))

    story.append(Paragraph("SDK PHP", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Composer</b>: composer require binance/binance-connector-php:^1.0<br/>"
        "<b>Uso basico</b> (crear orden de pago):<br/>"
        "$api = new \\Binance\\Spot(['apiKey' =&gt; env('BINANCE_PAY_API_KEY'), 'apiSecret' =&gt; env('BINANCE_PAY_SECRET')]);<br/>"
        "$response = $api-&gt;payCreateOrder([<br/>"
        "&nbsp;&nbsp;'merchantId' =&gt; env('BINANCE_PAY_MERCHANT_ID'),<br/>"
        "&nbsp;&nbsp;'merchantTradeNo' =&gt; 'deposit_' . $depositId,<br/>"
        "&nbsp;&nbsp;'totalFee' =&gt; '10.00',<br/>"
        "&nbsp;&nbsp;'currency' =&gt; 'USDT',<br/>"
        "&nbsp;&nbsp;'productName' =&gt; 'T.N.S.V.T Wallet Deposit',<br/>"
        "&nbsp;&nbsp;'productType' =&gt; '01',<br/>"
        "&nbsp;&nbsp;'transType' =&gt; 'APP',<br/>"
        "&nbsp;&nbsp;'returnUrl' =&gt; 'https://tnsvt.com/wallet?status=success',<br/>"
        "&nbsp;&nbsp;'cancelUrl' =&gt; 'https://tnsvt.com/wallet?status=cancel',<br/>"
        "]);<br/>"
        "return new JsonResponse([&quot;checkout_url&quot; =&gt; $response['data']['checkoutUrl'], &quot;qrcode&quot; =&gt; $response['data']['qrCodeLink']]);",
        s['TNSVT_Code']))

    story.append(Paragraph("Flujo del user", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>1.</b> User clickea &quot;Depositar con Binance Pay&quot; en TNSVT<br/>"
        "<b>2.</b> Backend crea la orden y devuelve QR + URL<br/>"
        "<b>3.</b> User escanea QR con Binance app o abre URL<br/>"
        "<b>4.</b> User confirma el pago en Binance (10 USDT)<br/>"
        "<b>5.</b> Binance notifica via webhook<br/>"
        "&nbsp;&nbsp;&nbsp;Payload: { merchantTradeNo, status: 'PAID', totalFee, currency }<br/>"
        "<b>6.</b> Backend valida, acredita 10 USD al wallet (1:1 con USDT)<br/>"
        "<b>7.</b> User ve el balance actualizado en su app",
        s['TNSVT_Body']))

    story.append(Paragraph("Ventajas vs MercadoPago", s['TNSVT_H3']))
    story.append(table(s,
        ['Caracteristica', 'MercadoPago AR', 'Binance Pay'],
        [
            ['Fee', '2-6% segun metodo', '0%'],
            ['Moneda', 'ARS solamente', 'USDT, USDC, BTC, ETH, BNB'],
            ['Paises', 'Argentina (10 mas en LATAM)', '100+ paises'],
            ['Tiempo de acredit.', 'Inmediato / 24-48h', 'Inmediato'],
            ['KYC user', 'Si (CBU/cuenta)', 'No (ya lo tiene en Binance)'],
            ['Para vos', 'Recibis ARS en tu MP', 'Recibis USDT en tu Binance'],
            ['Cambio a ARS', 'Ya esta en ARS', 'P2P o exchange local'],
        ],
        col_widths=[5*cm, 6*cm, 6*cm]))

    story.append(PageBreak())

    # ═══════════ SECTION 12 ═══════════
    story.append(Paragraph("12. Fase 4 - Otros paises", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Mapa de soluciones por pais", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Pais', 'Recomendado Fase 2-3', 'Alternativa', 'Notas'],
        [
            ['Argentina', 'MercadoPago', 'Binance Pay / USDT', 'MP es lo mas comodo para ARS'],
            ['Mexico', 'MercadoPago Mexico / Binance Pay', 'Conekta (OXXO, SPEI)', 'OXXO efectivo en 18k tiendas'],
            ['Brasil', 'MercadoPago Brasil / Binance Pay', 'PIX directo', 'PIX es instantaneo 24/7'],
            ['Colombia', 'MercadoPago Colombia / Binance Pay', 'Nequi / Daviplata', 'PSE para bancos'],
            ['Chile', 'MercadoPago Chile / Binance Pay', 'Webpay / Khipu', 'Webpay es el mas usado'],
            ['Peru', 'MercadoPago Peru / Binance Pay', 'Yape / Plin', 'Yape es de BCP'],
            ['Uruguay', 'MercadoPago Uruguay / Binance Pay', 'PREX / MiDinero', 'PSE no aplica'],
            ['USA', 'Stripe / Coinbase Commerce', 'PayPal', 'ACH + cards'],
            ['Canada', 'Stripe / Coinbase Commerce', 'Interac', 'Interac e-Transfer'],
            ['UK', 'Stripe / Wise', 'PayPal', 'FCA regulated'],
            ['Europa SEPA', 'Wise / Stripe', 'SEPA Direct', '1-2% fee'],
            ['Asia / Africa', 'Crypto (USDT)', 'Binance Pay', 'Sin sistema bancario formal'],
            ['Cualquier lado', 'USDT/USDC', '-', 'Funciona siempre, sin KYC'],
        ],
        col_widths=[3*cm, 5*cm, 4*cm, 5*cm]))

    story.append(Paragraph("Solucion universal: crypto directo (self-custody)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Para maxima cobertura sin depender de PSPs, una wallet self-custody multi-chain:<br/><br/>"
        "<b>1.</b> Backend genera una direccion unica por user, por chain<br/>"
        "<b>2.</b> User envia USDT/USDC desde cualquier wallet (Binance, MetaMask, Phantom, Trust, etc)<br/>"
        "<b>3.</b> Backend detecta el deposito via:<br/>"
        "&nbsp;&nbsp;• <b>Alchemy webhooks</b> (Ethereum, Polygon) - $0-50/mes segun volumen<br/>"
        "&nbsp;&nbsp;• <b>BSCscan / TronGrid API</b> (BSC, Tron) - gratis con API key<br/>"
        "&nbsp;&nbsp;• <b>Block native</b> - alternativa paga<br/>"
        "&nbsp;&nbsp;• <b>Polling propio</b> cada 1 min via Alchemy/nownodes - $0-50/mes<br/>"
        "<b>4.</b> Cuando se detecta TX con confirmaciones &gt;= 3, se acredita el wallet del user<br/>"
        "<b>5.</b> User ve el balance actualizado en su app<br/><br/>"
        "<b>Pro</b>: 100% cobertura global, sin KYC, 0% fee de PSP, solo gas de blockchain (&lt;$1)<br/>"
        "<b>Con</b>: UX mas compleja (user tiene que entender crypto), riesgos de clave privada, requiere node RPCs",
        s['TNSVT_Body']))

    story.append(Paragraph("Chains recomendadas y sus fees", s['TNSVT_H3']))
    story.append(table(s,
        ['Chain', 'Token', 'Gas tipico', 'Tiempo confirmacion', 'Mejor para'],
        [
            ['Tron (TRC20)', 'USDT', '$0.50', '60 segundos', 'Usuarios retail, bajo costo'],
            ['BSC (BEP20)', 'USDT/USDC', '$0.30', '15 segundos', 'Velocidad + bajo costo'],
            ['Polygon', 'USDC', '$0.005', '5 segundos', 'Micropagos'],
            ['Ethereum (ERC20)', 'USDT/USDC', '$3-10', '5-15 min', 'Liquidez maxima'],
            ['Solana', 'USDC', '$0.001', '5 segundos', 'Lo mas rapido y barato'],
        ],
        col_widths=[3*cm, 3*cm, 2.5*cm, 4*cm, 4.5*cm]))

    story.append(Paragraph("Cuando implementar cada uno", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Fase 4A (mes 2)</b>: USDT-TRC20 + USDT-BEP20. Cubre 90% de usuarios crypto. Implementacion: 3-5 dias.<br/>"
        "<b>Fase 4B (mes 3)</b>: Polygon (USDC) + Ethereum (USDT). Para usuarios DeFi. Implementacion: +2 dias.<br/>"
        "<b>Fase 5 (cuando tengas 50+ users)</b>: Stripe (cards internacionales). 1 dia.<br/>"
        "<b>Fase 6 (cuando quieras expansion EU/UK)</b>: Wise (bancos). 1 dia.<br/><br/>"
        "Mi recomendacion: arranca con Fase 1 manual esta semana, Fase 2 MP la semana que viene, "
        "Fase 3 Binance Pay en 2 semanas, y Fase 4 crypto cuando ya tengas flujo constante de "
        "depositos (te dara tiempo para pensar bien la seguridad de la wallet self-custody).",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 13 ═══════════
    story.append(Paragraph("13. Compliance &amp; legal en Argentina", s['TNSVT_SectionTitle']))

    story.append(Paragraph(
        "<b>Disclaimer</b>: No soy abogado. Esto es orientativo. Para temas legales serios, consulta "
        "con un profesional matriculado en Argentina.",
        s['TNSVT_Critical']))

    story.append(Paragraph("Estado actual del proyecto", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "TNSVT es un juego didactico de trading con un Portfolio virtual. NO hay dinero real en el "
        "sistema. Los XP/levels/leaderboard son virtuales. Esto lo posiciona como:<br/>"
        "&nbsp;&nbsp;• <b>Videojuego</b> (no juego de azar)<br/>"
        "&nbsp;&nbsp;• <b>Software educativo</b> (no plataforma de inversion)<br/>"
        "&nbsp;&nbsp;• <b>Servicio gratuito</b> (no opera dinero de terceros)<br/><br/>"
        "Regulado por: <b>Ley 25.675</b> (industria del software), no por Loterias ni BCRA.",
        s['TNSVT_Body']))

    story.append(Paragraph("Que cambia al agregar torneos con dinero real", s['TNSVT_H3']))
    story.append(Paragraph(
        "Si los 12 amigos se ponen de acuerdo para jugar con plata, estas en un area gris:<br/>"
        "&nbsp;&nbsp;• <b>Apuestas privadas</b> entre amigos: generalmente OK, no regulado<br/>"
        "&nbsp;&nbsp;• <b>Pool de premios</b>: la plata se reparte segun habilidad, no suerte pura<br/>"
        "&nbsp;&nbsp;• <b>Habilidad vs suerte</b>: como es trading (conocimiento), es mas skill que azar<br/><br/>"
        "La clave legal: NO sos una plataforma publica de juegos de azar. Sos un software de practica "
        "que ademas tiene un feature opcional de competencia entre usuarios.",
        s['TNSVT_Body']))

    story.append(Paragraph("Recomendaciones legales operativas", s['TNSVT_H3']))
    story.append(table(s,
        ['Tema', 'Recomendacion', 'Costo'],
        [
            ['Tipo societario', 'Monotributo (hasta $7M anual)', '~$30k ARS/mes'],
            ['Facturacion', 'Factura C a cada user por entry fee + payout', 'Tiempo admin'],
            ['IIBB (ingresos brutos)', 'Segun jurisdiccion (CABA ~3%)', 'Autocalculado'],
            ['Ganancias', 'Si superas monotributo, pasar a Resp Inscripto', 'Contador'],
            ['PSPs (MP, Binance)', 'Ya estan registrados en BCRA como PSPs', '$0'],
            ['UIF (Unidad Info Financiera)', 'Reportes solo si hay sospecha de lavado', '$0'],
            ['KYC user', 'No obligatorio en Fase 1 (12 amigos)', '$0'],
            ['KYC user', 'Obligatorio si escalas a publico (>100 users)', 'Onboarding'],
            ['Terminos y condiciones', 'Disclaimers: simulacion, no inversion real, sin garantia', 'Abogado ~$50k ARS'],
            ['Proteccion de datos', 'Ley 25.326 - no compartir datos sin consent', '$0'],
        ],
        col_widths=[4*cm, 9*cm, 4*cm]))

    story.append(Paragraph("Disclaimers obligatorios en la UI", s['TNSVT_H3']))
    story.append(Paragraph(
        "En TODA pantalla relacionada a torneos/wallet:<br/>"
        "&nbsp;&nbsp;⚠ <b>Simulacion con dinero virtual</b>. Los precios son reales pero el dinero es virtual.<br/>"
        "&nbsp;&nbsp;⚠ <b>No es consejo financiero</b>. Competicion didactica entre traders.<br/>"
        "&nbsp;&nbsp;⚠ <b>Sin garantia de resultados</b>. El mejor trader puede perder.<br/>"
        "&nbsp;&nbsp;⚠ <b>Para mayores de 18</b>. Verificar KYC si se escala.<br/>"
        "&nbsp;&nbsp;⚠ <b>Politica de reembolso</b>: el admin puede cancelar un torneo y devolver entry fees.",
        s['TNSVT_Callout']))

    story.append(Paragraph("Cuando profesionalizar", s['TNSVT_H3']))
    story.append(Paragraph(
        "<b>Trigger: mas de $500 USD/mes en entry fees o mas de 30 users.</b><br/><br/>"
        "Ahi si:<br/>"
        "&nbsp;&nbsp;1. Habla con un contador (no abogado) para temas impositivos<br/>"
        "&nbsp;&nbsp;2. Decide si queres SA, SAS, o monotributo<br/>"
        "&nbsp;&nbsp;3. Implementa KYC basico (DNI + selfie) para users nuevos<br/>"
        "&nbsp;&nbsp;4. Genera facturas automaticas con AFIP (via Facturapi o similar)<br/>"
        "&nbsp;&nbsp;5. Reportes mensuales de UIF si aplica<br/><br/>"
        "Costo estimado: $100-200k ARS/mes de contador + sistemas. Vale la pena si los ingresos "
        "lo justifican.",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 14 ═══════════
    story.append(Paragraph("14. Plan por etapas (4-6 stages)", s['TNSVT_SectionTitle']))

    story.append(Paragraph(
        "Las 10-12 horas de trabajo se dividen en 6 stages verificables. Cada stage termina con un "
        "test funcional antes de seguir. El user (vos) verifica y aprueba antes del siguiente.",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 1 - Backend foundation (~2.5h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: DB migrada con 4 tablas nuevas + 4 entities + 1 controller simple<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• Migration: add wallet_balance to users, create wallet_transactions, tournaments, tournament_entries<br/>"
        "&nbsp;&nbsp;• Entities: User (+walletBalance), WalletTransaction, Tournament, TournamentEntry<br/>"
        "&nbsp;&nbsp;• Repository para cada entity<br/>"
        "&nbsp;&nbsp;• DolarController con GET /api/wallet/rates (dolarapi.com integration)<br/>"
        "&nbsp;&nbsp;• Test curl: GET /api/wallet/rates devuelve blue, oficial, mep<br/><br/>"
        "<b>Verificacion</b>: php bin/console doctrine:migrations:migrate + curl rates endpoint",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 2 - Wallet system (~2.5h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: 4 endpoints de wallet + 1 admin credit endpoint funcionales<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• WalletController: balance, transactions, withdraw request<br/>"
        "&nbsp;&nbsp;• AdminController: POST /api/admin/wallet/credit con X-Admin-Password<br/>"
        "&nbsp;&nbsp;• AdminController: lista pending withdrawals, approve/reject<br/>"
        "&nbsp;&nbsp;• Validaciones: wallet_insufficient, user_not_found, etc<br/>"
        "&nbsp;&nbsp;• Test curl completo: acreditar -&gt; ver balance -&gt; ver transactions<br/><br/>"
        "<b>Verificacion</b>: acreditar $10 a user de prueba, ver balance sube, ver tx en historial",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 3 - Torneos CRUD + cron (~3h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: 6 endpoints de torneos + comando cron auto-close<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• TournamentController: list, get, join, leaderboard, my (5 endpoints publicos/user)<br/>"
        "&nbsp;&nbsp;• AdminController: create, close, cancel (3 endpoints admin)<br/>"
        "&nbsp;&nbsp;• Logica de join: descuenta entry fee, captura starting_equity, crea tx wallet<br/>"
        "&nbsp;&nbsp;• Logica de leaderboard: calcula pnl_pct en vivo desde PORT data<br/>"
        "&nbsp;&nbsp;• Logica de close: ordena por pnl_pct, distribuye prize pool segun distribution<br/>"
        "&nbsp;&nbsp;• Comando tournaments:process (corre via cron cada 1 min)<br/>"
        "&nbsp;&nbsp;• Test: crear torneo -&gt; 3 users join -&gt; manipular PnL -&gt; close -&gt; ver winners<br/><br/>"
        "<b>Verificacion</b>: end-to-end test con 3 users de prueba, ver payouts correctos",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 4 - TNSVT main frontend (~2h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: Sidebar con 2 tabs nuevos + UI completa de wallet y torneos + admin panel<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• Sidebar: agregar botones &quot;💰 Mi Wallet&quot; y &quot;🏆 Torneos&quot;<br/>"
        "&nbsp;&nbsp;• Tab Wallet: balance, ARS equivalente, transacciones, boton depositar<br/>"
        "&nbsp;&nbsp;• Tab Torneos: sub-tabs Activos/Mis/Historial, grid de cards, modal detalle<br/>"
        "&nbsp;&nbsp;• Tab Admin: sub-tabs Wallet + Torneos con forms de acreditar y crear<br/>"
        "&nbsp;&nbsp;• Llamadas API via api.js existente (window.API)<br/>"
        "&nbsp;&nbsp;• Toasts de feedback (success/error)<br/><br/>"
        "<b>Verificacion</b>: visual en navegador, crear torneo desde admin, ver en user",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 5 - Game frontend (~1.5h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: s-torneos refactorizado con data real del backend<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• tournamentsInit() al abrir s-torneos: GET /api/tournaments/active<br/>"
        "&nbsp;&nbsp;• tournamentJoin(id): POST con X-Game-Code, actualiza balance local<br/>"
        "&nbsp;&nbsp;• tournamentLeaderboard(id): GET cada 30s mientras esta abierto<br/>"
        "&nbsp;&nbsp;• UI: cards de torneos, modal de detalle, leaderboard inline<br/>"
        "&nbsp;&nbsp;• Edge case: si no configuro TNSVT_SYNC, mensaje de ayuda<br/>"
        "&nbsp;&nbsp;• Sincronizar via npx cap sync android<br/><br/>"
        "<b>Verificacion</b>: entrar al Game, ver torneos reales, joinear uno, ver rank en vivo",
        s['TNSVT_Body']))

    story.append(Paragraph("Stage 6 - Polish + deploy (~1h)", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Entrega</b>: APK reconstruido, doc actualizada, commit + push, landing page actualizada<br/>"
        "<b>Detalle</b>:<br/>"
        "&nbsp;&nbsp;• build_game_apk.bat -&gt; APK nuevo en Downloads<br/>"
        "&nbsp;&nbsp;• Actualizar landing page /download/tnsvt-market con info de torneos<br/>"
        "&nbsp;&nbsp;• Actualizar boton sidebar TNSVT: link a &quot;Torneos&quot;<br/>"
        "&nbsp;&nbsp;• git add -A + commit + push con mensaje descriptivo<br/>"
        "&nbsp;&nbsp;• Commit history: feat(wallet), feat(torneos), chore(cron), chore(deploy)<br/>"
        "&nbsp;&nbsp;• Resumen final para user con todos los endpoints + como probar<br/><br/>"
        "<b>Verificacion</b>: APK instalado, todos los flujos probados end-to-end",
        s['TNSVT_Body']))

    story.append(PageBreak())

    # ═══════════ SECTION 15 ═══════════
    story.append(Paragraph("15. Costos, ROI y proyeccion", s['TNSVT_SectionTitle']))

    story.append(Paragraph("Costos del proyecto", s['TNSVT_Subsection']))
    story.append(table(s,
        ['Item', 'Costo', 'Notas'],
        [
            ['Desarrollo (vos haces)', '$0 (tiempo)', '10-12 hs, ya cubierto'],
            ['Hosting TNSVT (actual)', '$0', 'Esta en tu PC con Tailscale'],
            ['Hosting produccion (Hostinger VPS)', '$9.99/mes', 'Recomendado en Etapa 2 de hosting'],
            ['Dominio .com', '~$10/ano', 'Para que los 12 amigos entren por URL bonita'],
            ['MP comision', '2-6%', 'Solo cuando se usa MP'],
            ['Binance Pay comision', '0%', 'Gratis siempre'],
            ['Contador (cuando factures)', '~$100-200k ARS/mes', 'Solo si &gt;$500 USD/mes en fees'],
            ['Abogado (TyC + compliance)', '~$50k ARS one-time', 'Solo si escalas a publico'],
        ],
        col_widths=[5*cm, 3*cm, 9*cm]))

    story.append(Paragraph("ROI con 12 amigos", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "<b>Escenario conservador</b> (1 torneo/semana, $5 entry, 8 participants):<br/>"
        "&nbsp;&nbsp;• 8 users x $5 = $40 USD prize pool por torneo<br/>"
        "&nbsp;&nbsp;• 4 torneos/mes = $160 USD prize pool/mes<br/>"
        "&nbsp;&nbsp;• Tu margen: si cobras un 10% de rake = $16 USD/mes<br/><br/>"
        "<b>Escenario medio</b> (2 torneos/semana, $10 entry, 12 participants):<br/>"
        "&nbsp;&nbsp;• 12 users x $10 = $120 USD prize pool por torneo<br/>"
        "&nbsp;&nbsp;• 8 torneos/mes = $960 USD prize pool/mes<br/>"
        "&nbsp;&nbsp;• Tu margen: 10% rake = $96 USD/mes<br/><br/>"
        "<b>Escenario alto</b> (1 torneo diario, $15 entry, 12 participants):<br/>"
        "&nbsp;&nbsp;• 12 users x $15 = $180 USD prize pool por torneo<br/>"
        "&nbsp;&nbsp;• 30 torneos/mes = $5.400 USD prize pool/mes<br/>"
        "&nbsp;&nbsp;• Tu margen: 10% rake = $540 USD/mes<br/><br/>"
        "<b>Nota</b>: el rake es opcional. Si no cobras rake, todo va al prize pool, y el valor para "
        "los users es mayor (motiva a participar). Podes cobrar en otros features (subscription $9/mes).",
        s['TNSVT_Body']))

    story.append(Paragraph("Proyeccion de crecimiento", s['TNSVT_H3']))
    story.append(table(s,
        ['Mes', 'Users activos', 'Torneos/mes', 'Volumen USD', 'Notas'],
        [
            ['Mes 1', '12', '4', '$160', 'Lanzamiento MVP manual con amigos'],
            ['Mes 2', '25', '8', '$640', 'MP Argentina integrado, llega +invitados'],
            ['Mes 3', '50', '15', '$2.250', 'Binance Pay agregado, llegan crypto users'],
            ['Mes 6', '150', '40', '$12.000', 'Crypto directo, scaling + influencer share'],
            ['Mes 12', '500+', '120+', '$60.000+', 'Multi-pais, suscripciones $9 + torneos'],
        ],
        col_widths=[2*cm, 2.5*cm, 2.5*cm, 3*cm, 7*cm]))

    story.append(Paragraph("Conclusion", s['TNSVT_Subsection']))
    story.append(Paragraph(
        "Con 12 amigos ya tenes un MVP validable. La implementacion es de 10-12 horas divididas en 6 "
        "stages verificables. Arrancamos con Fase 1 (manual) esta semana, automatizamos con MP y "
        "Binance en las siguientes 2 semanas, y dejamos crypto + Stripe + Wise para cuando el "
        "volumen lo justifique. El codigo de Fase 1 se mantiene - solo cambia el &quot;como se "
        "acredita&quot; de manual a automatico. Legalmente, en uso privado entre amigos no hay "
        "mayores restricciones, pero hay que sumar disclaimers y, cuando factures mas de $500 USD/mes, "
        "hablar con un contador.<br/><br/>"
        "<b>Proximo paso: arranco con Stage 1 (Backend foundation). Decime dale y voy.</b>",
        s['TNSVT_Success']))

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "---<br/>"
        "Fin del documento.<br/>"
        "Cualquier duda, preguntar antes de empezar.<br/>"
        f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        s['TNSVT_Body']))

    # ── Build ──
    doc.build(story, canvasmaker=NumberedCanvas)
    size = os.path.getsize(out_path)
    print(f"OK PDF generado: {out_path}")
    print(f"   Tamaño: {size/1024:.1f} KB ({size} bytes)")


if __name__ == '__main__':
    build()


