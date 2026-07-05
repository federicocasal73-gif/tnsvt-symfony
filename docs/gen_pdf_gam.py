"""
TNSVT Plan de Implementacion - Generador de PDF
================================================
Genera un PDF profesional desde docs/gamificacion.md
usando reportlab Platypus.

Uso:
    py docs/gen_pdf.py [output_path]

Si no se pasa output_path, usa docs/gamificacion.pdf
"""
import re
import sys
import os
from datetime import datetime

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, Image, KeepTogether, Flowable
    )
    from reportlab.pdfgen import canvas
except ImportError:
    print("ERROR: reportlab no esta instalado. Correr: pip install reportlab")
    sys.exit(1)


# Estilos de la pagina
PAGE_MARGIN_LEFT = 2 * cm
PAGE_MARGIN_RIGHT = 2 * cm
PAGE_MARGIN_TOP = 2.5 * cm
PAGE_MARGIN_BOTTOM = 2.5 * cm


# Colores corporativos TNSVT (gold + dark)
GOLD = colors.HexColor('#d4af37')
GOLD_DARK = colors.HexColor('#8b6914')
GOLD_BRIGHT = colors.HexColor('#ffd764')
DARK = colors.HexColor('#0d0818')
DARK_MID = colors.HexColor('#1a1228')
GRAY = colors.HexColor('#666666')
GRAY_LIGHT = colors.HexColor('#e0e0e0')


class NumberedCanvas(canvas.Canvas):
    """Canvas con header/footer con numero de pagina."""

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
        # Header: linea gold + titulo del documento
        self.setStrokeColor(GOLD)
        self.setLineWidth(1.5)
        self.line(PAGE_MARGIN_LEFT, A4[1] - 1.5 * cm, A4[0] - PAGE_MARGIN_RIGHT, A4[1] - 1.5 * cm)
        self.setFillColor(GOLD_DARK)
        self.setFont('Helvetica-Bold', 9)
        self.drawString(PAGE_MARGIN_LEFT, A4[1] - 1.2 * cm, "TNSVT - Plan de Implementacion v1.0")
        self.setFillColor(GRAY)
        self.setFont('Helvetica', 9)
        self.drawRightString(A4[0] - PAGE_MARGIN_RIGHT, A4[1] - 1.2 * cm, "Junio 2026")

        # Footer: linea gold + numero de pagina
        self.setStrokeColor(GOLD)
        self.setLineWidth(0.5)
        self.line(PAGE_MARGIN_LEFT, 1.5 * cm, A4[0] - PAGE_MARGIN_RIGHT, 1.5 * cm)
        self.setFillColor(GRAY)
        self.setFont('Helvetica', 8)
        self.drawString(PAGE_MARGIN_LEFT, 1.1 * cm, "TNSVT - Documento interno y confidencial")
        self.drawCentredString(A4[0] / 2.0, 1.1 * cm, "")
        self.setFont('Helvetica-Bold', 9)
        self.setFillColor(GOLD_DARK)
        self.drawRightString(A4[0] - PAGE_MARGIN_RIGHT, 1.1 * cm, f"Pagina {self._pageNumber} de {page_count}")


def create_styles():
    """Crea los estilos personalizados del documento."""
    styles = getSampleStyleSheet()

    # Titulo principal
    styles.add(ParagraphStyle(
        name='DocTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=GOLD,
        alignment=TA_CENTER,
        spaceAfter=12,
        fontName='Helvetica-Bold',
    ))

    # Subtitulo
    styles.add(ParagraphStyle(
        name='DocSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica',
    ))

    # Heading 1 (Capitulos)
    styles.add(ParagraphStyle(
        name='H1',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=GOLD,
        spaceBefore=24,
        spaceAfter=12,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderColor=GOLD,
        borderPadding=0,
    ))

    # Heading 2
    styles.add(ParagraphStyle(
        name='H2',
        parent=styles['Heading2'],
        fontSize=15,
        textColor=GOLD_DARK,
        spaceBefore=14,
        spaceAfter=8,
        fontName='Helvetica-Bold',
    ))

    # Heading 3
    styles.add(ParagraphStyle(
        name='H3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=DARK,
        spaceBefore=10,
        spaceAfter=4,
        fontName='Helvetica-Bold',
    ))

    # Heading 4
    styles.add(ParagraphStyle(
        name='H4',
        parent=styles['Heading4'],
        fontSize=11,
        textColor=GRAY,
        spaceBefore=6,
        spaceAfter=2,
        fontName='Helvetica-Bold',
    ))

    # Parrafo normal
    styles.add(ParagraphStyle(
        name='Body',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor=DARK,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
    ))

    # Codigo
    styles.add(ParagraphStyle(
        name='CodeBlock',
        parent=styles['Code'],
        fontSize=8.5,
        leading=11,
        textColor=DARK,
        backColor=colors.HexColor('#f5f5f5'),
        leftIndent=10,
        rightIndent=10,
        spaceBefore=4,
        spaceAfter=4,
        fontName='Courier',
        borderWidth=0.5,
        borderColor=GRAY_LIGHT,
        borderPadding=6,
    ))

    # Lista
    styles.add(ParagraphStyle(
        name='ListItem',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        leftIndent=18,
        bulletIndent=6,
        spaceAfter=3,
        fontName='Helvetica',
    ))

    # Bold inline
    styles.add(ParagraphStyle(
        name='Bold',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
    ))

    return styles


def md_inline_to_rl(text):
    """Convierte markdown inline a markup de reportlab."""
    # Bold **text**
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic *text*
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # Code `text`
    text = re.sub(r'`(.+?)`', r'<font name="Courier" color="#8b6914">\1</font>', text)
    # Escape ampersand que no sea parte de markup
    text = text.replace('&', '&amp;').replace('&amp;<', '&<').replace('&amp;b', '&b').replace('&amp;i', '&i').replace('&amp;font', '&font')
    return text


def parse_markdown(md_text, styles):
    """Parsea Markdown y genera una lista de Flowables de reportlab."""
    story = []
    lines = md_text.split('\n')
    i = 0
    in_code_block = False
    code_buffer = []
    in_table = False
    table_buffer = []
    skip_next_blank = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Code blocks
        if stripped.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_buffer = []
            else:
                # End of code block
                code_text = '\n'.join(code_buffer)
                if code_text.strip():
                    # Escapar HTML
                    code_text = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    story.append(Paragraph(code_text, styles['CodeBlock']))
                in_code_block = False
                code_buffer = []
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        # Tables (markdown pipes)
        if stripped.startswith('|') and stripped.endswith('|') and '|' in stripped[1:]:
            if not in_table:
                in_table = True
                table_buffer = []
            table_buffer.append(stripped)
            i += 1
            continue
        else:
            if in_table:
                # Renderizar tabla acumulada
                if len(table_buffer) >= 2:
                    # Separar header del separator
                    header = [c.strip() for c in table_buffer[0].strip('|').split('|')]
                    # Ignorar separator (table_buffer[1])
                    rows = []
                    for row_line in table_buffer[2:]:
                        if row_line.strip():
                            row = [c.strip() for c in row_line.strip('|').split('|')]
                            rows.append(row)

                    # Crear tabla
                    data = [header] + rows
                    # Wrap en Paragraphs para que se vea bien
                    wrapped_data = []
                    for row_idx, row in enumerate(data):
                        wrapped_row = []
                        for cell in row:
                            cell_html = md_inline_to_rl(cell)
                            try:
                                p = Paragraph(cell_html, styles['Body'] if row_idx > 0 else ParagraphStyle(
                                    name='TableHeader',
                                    parent=styles['Body'],
                                    fontName='Helvetica-Bold',
                                    textColor=colors.white,
                                ))
                            except:
                                p = Paragraph(cell_html, styles['Body'])
                            wrapped_row.append(p)
                        wrapped_data.append(wrapped_row)

                    # Calcular anchos
                    num_cols = len(header)
                    available_width = A4[0] - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT
                    col_width = available_width / num_cols

                    t = Table(wrapped_data, colWidths=[col_width] * num_cols, repeatRows=1)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_LIGHT),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
                        ('LEFTPADDING', (0, 0), (-1, -1), 6),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ]))
                    story.append(Spacer(1, 6))
                    story.append(t)
                    story.append(Spacer(1, 10))
                in_table = False
                table_buffer = []

        # Headings
        if stripped.startswith('# '):
            text = md_inline_to_rl(stripped[2:])
            story.append(Paragraph(text, styles['DocTitle']))
            story.append(Spacer(1, 12))
        elif stripped.startswith('## '):
            text = md_inline_to_rl(stripped[3:])
            story.append(Paragraph(text, styles['H1']))
        elif stripped.startswith('### '):
            text = md_inline_to_rl(stripped[4:])
            story.append(Paragraph(text, styles['H2']))
        elif stripped.startswith('#### '):
            text = md_inline_to_rl(stripped[5:])
            story.append(Paragraph(text, styles['H3']))
        elif stripped.startswith('##### '):
            text = md_inline_to_rl(stripped[6:])
            story.append(Paragraph(text, styles['H4']))
        # Horizontal rule
        elif stripped == '---':
            story.append(Spacer(1, 8))
            # Linea horizontal
            from reportlab.platypus import HRFlowable
            story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceBefore=4, spaceAfter=8))
        # Lists
        elif stripped.startswith('- ') or stripped.startswith('* '):
            text = md_inline_to_rl(stripped[2:])
            # Indentacion adicional si empieza con sub-items (2 espacios)
            indent = ''
            if line.startswith('  '):
                indent = '  '
            story.append(Paragraph(f"{indent}&bull; {text}", styles['ListItem']))
        elif re.match(r'^\d+\.\s', stripped):
            # Lista numerada
            text = re.sub(r'^\d+\.\s', '', stripped)
            text = md_inline_to_rl(text)
            story.append(Paragraph(f"&bull; {text}", styles['ListItem']))
        # Linea vacia
        elif stripped == '':
            story.append(Spacer(1, 4))
        # Parrafo normal
        else:
            text = md_inline_to_rl(stripped)
            if text:
                story.append(Paragraph(text, styles['Body']))

        i += 1

    # Renderizar tabla final si quedo abierta
    if in_table and len(table_buffer) >= 2:
        header = [c.strip() for c in table_buffer[0].strip('|').split('|')]
        rows = []
        for row_line in table_buffer[2:]:
            if row_line.strip():
                row = [c.strip() for c in row_line.strip('|').split('|')]
                rows.append(row)
        data = [header] + rows
        num_cols = len(header)
        available_width = A4[0] - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT
        col_width = available_width / num_cols
        t = Table(data, colWidths=[col_width] * num_cols, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), GOLD),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_LIGHT),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
        ]))
        story.append(t)

    return story


def add_cover_page(styles):
    """Crea una pagina de portada."""
    story = []
    story.append(Spacer(1, 4 * cm))

    # Logo text (no se puede renderizar el PNG, usamos texto estilizado)
    title_style = ParagraphStyle(
        name='CoverTitle',
        parent=styles['Title'],
        fontSize=48,
        textColor=GOLD,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=8,
    )
    story.append(Paragraph("TNSVT", title_style))

    tagline_style = ParagraphStyle(
        name='Tagline',
        parent=styles['Normal'],
        fontSize=14,
        textColor=GOLD_DARK,
        alignment=TA_CENTER,
        fontName='Helvetica-Oblique',
        spaceAfter=40,
    )
    story.append(Paragraph("Mentoria de Elite - Eleva tu Trading", tagline_style))

    # Linea decorativa
    from reportlab.platypus import HRFlowable
    story.append(HRFlowable(width="60%", thickness=2, color=GOLD, hAlign='CENTER', spaceBefore=20, spaceAfter=30))

    # Subtitulo principal
    subtitle = ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontSize=22,
        textColor=DARK,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=8,
    )
    story.append(Paragraph("Plan de Implementacion", subtitle))

    sub2 = ParagraphStyle(
        name='CoverSub2',
        parent=styles['Normal'],
        fontSize=16,
        textColor=GRAY,
        alignment=TA_CENTER,
        fontName='Helvetica',
        spaceAfter=60,
    )
    story.append(Paragraph("De proyecto local a producto escalable (50 personas)", sub2))

    # Cuadro con informacion clave
    info_data = [
        ['Version', '1.0'],
        ['Fecha', 'Junio 2026'],
        ['Estado', 'Aprobado para implementacion'],
        ['Hosting elegido', 'Hostinger VPS KVM 2'],
        ['Inversion inicial', '~$135 USD (ARS 162.000)'],
        ['Proyeccion 12m', '50 clientes / $500+ USD/mes'],
    ]
    info_table = Table(info_data, colWidths=[5 * cm, 8 * cm], hAlign='CENTER')
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), GOLD_DARK),
        ('TEXTCOLOR', (1, 0), (1, -1), DARK),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_LIGHT),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)

    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph(
        "Documento interno y confidencial",
        ParagraphStyle(
            name='Confidential',
            parent=styles['Normal'],
            fontSize=10,
            textColor=GRAY,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique',
        )
    ))

    story.append(PageBreak())
    return story


def add_toc_page(styles, sections):
    """Crea una pagina de tabla de contenidos."""
    story = []
    story.append(Paragraph("Tabla de Contenidos", styles['H1']))
    story.append(Spacer(1, 12))

    for section in sections:
        story.append(Paragraph(
            f'<font color="#8b6914"><b>{section["num"]}</b></font> &nbsp; {section["title"]}',
            styles['ListItem']
        ))

    story.append(PageBreak())
    return story


def generate_pdf(md_path, pdf_path):
    """Funcion principal: lee el MD y genera el PDF."""

    print(f"Leyendo Markdown: {md_path}")
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    styles = create_styles()

    # Extraer titulo y secciones para TOC
    sections = []
    for line in md_text.split('\n'):
        m = re.match(r'^## (\d+)\.\s+(.+)$', line.strip())
        if m:
            sections.append({
                'num': m.group(1),
                'title': m.group(2),
            })

    print(f"Encontradas {len(sections)} secciones")

    # Crear documento
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=PAGE_MARGIN_LEFT,
        rightMargin=PAGE_MARGIN_RIGHT,
        topMargin=PAGE_MARGIN_TOP,
        bottomMargin=PAGE_MARGIN_BOTTOM,
        title='TNSVT - Plan de Implementacion',
        author='TNSVT',
        subject='Plan de implementacion para escalar TNSVT a 50 personas',
    )

    # Construir contenido
    story = []
    story.extend(add_cover_page(styles))
    story.extend(add_toc_page(styles, sections))
    story.extend(parse_markdown(md_text, styles))

    print(f"Generando PDF: {pdf_path}")
    doc.build(story, canvasmaker=NumberedCanvas)

    # Tamano del archivo
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"PDF generado: {size_kb:.1f} KB")


if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(script_dir, 'gamificacion.md')

    if len(sys.argv) >= 2:
        pdf_path = sys.argv[1]
    else:
        pdf_path = os.path.join(script_dir, 'gamificacion.pdf')

    if not os.path.exists(md_path):
        print(f"ERROR: No se encontro {md_path}")
        sys.exit(1)

    generate_pdf(md_path, pdf_path)

