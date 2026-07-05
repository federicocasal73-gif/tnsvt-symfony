# TSMT v6 PRO — Guía de Forward Test
## Checklist completo para configurar y ejecutar el forward

---

## REQUISITOS PREVIOS

```
[ ] MT5 instalado y actualizado (build 3790+ para ONNX)
[ ] Cuenta FTMO-Demo creada con $25.000 USD
[ ] Archivo TSMT_v6onnx.ex5 compilado (o .mq5 en MQL5/Experts/)
[ ] SET: aprobado.set copiado a MQL5/Files/
[ ] VPS configurado (o PC encendida 24/5)
```

---

## PASO 1 — Configurar la cuenta demo

1. MT5 → Herramientas → Opciones → Servidor
2. Conectar a **FTMO-Demo** (misma IP/server que usarás en live)
3. Crear cuenta demo: **$25.000 USD** (exactamente igual al fondeo objetivo)
4. Verificar balance en la pestaña "Resumen"

**¿Por qué mismo balance?**
El bot usa gestión dinámica (`InpDynamicRisk_Base=25000`). Si el balance es distinto, el cálculo de riesgo no va a funcionar igual en demo que en live.

---

## PASO 2 — Cargar el bot con aprobado.set

1. Abrir gráfico **EURUSD M15**
2. Arrastrar `TSMT_v6onnx.ex5` al gráfico
3. Pestaña **Inputs** → botón **"Cargar"** → seleccionar `aprobado.set`
4. Verificar valores clave:

```
InpMode           = 0        (AUTO)
InpRiskPct        = 0.75
InpDynamicRisk    = true
InpDynRisk_Base   = 25000.0
InpDynRisk_MaxDD  = 8.0
InpDynRisk_MaxDailyDD = 2.0
InpDynRisk_Target = 8.0
InpUseONNX        = false    (activar después de 100+ trades)
```

5. **VERIFICAR SPREAD:**
   - Click derecho en el gráfico → Especificaciones
   - Spread actual debe ser **≤ 1.5 pips** (15 puntos)
   - Si es mayor, el broker tiene spreads altos para EURUSD

6. **Poner en modo AUTO** y dejar correr

---

## PASO 3 — Setup del tracking semanal

Crear un Google Sheet o Excel con estas columnas:

| Semana | Fecha Inicio | Fecha Fin | Trades | Ganadores | PF | WR% | DD Max Semana | DD Max Acum | Balance | R Acumulado | Notas |
|--------|-------------|-----------|--------|-----------|-----|-----|---------------|-------------|---------|-------------|-------|
| 1 | 07/07 | 11/07 | | | | | | | 25000 | | |
| 2 | 14/07 | 18/07 | | | | | | | | | |
| 3 | 21/07 | 25/07 | | | | | | | | | |
| ... | | | | | | | | | | | |

**Exportar cada viernes:**
1. MT5 → Ver → Historial de cuenta
2. Click derecho → "Todas las operaciones"
3. Guardar reporte (detallado)
4. Guardar como `trades_semana_XX.csv`

---

## PASO 4 — Qué monitorear cada semana

### Números que deben ser ESTABLES:
```
✅ Profit Factor semanal > 1.5 (backtest fue 4.87 — real será menor)
✅ Win Rate > 45%
✅ Ningún trade con pérdida > 2% del balance (límite FTMO diario)
✅ DD total acumulado < 5%
✅ Al menos 2-3 trades por semana (si no, el bot está filtrando de más)
```

### Señales de ALARMA:
```
❌ 3+ trades perdedores consecutivos → revisar SET
❌ DD diario > 1.5% → el bot está arriesgando de más
❌ 0 trades en una semana completa → el bot no está detectando setups
❌ PF < 1.0 por 2+ semanas → el mercado no favorece la estrategia
```

### Señales de CONFIRMACIÓN:
```
✅ PF > 2.0 por 4+ semanas seguidas
✅ DD diario nunca supera 1%
✅ Trades se ejecutan en horarios de Londres/NY
✅ El ONNX (cuando se active) está filtrando trades malos
```

---

## PASO 5 — Activar ONNX después de 100+ trades

### Cronograma:
```
Semanas 1-4:   Solo el bot, sin ONNX (validar la estrategia base)
Semanas 5-8:   Exportar CSV → entrenar ONNX v1
Semana 9+:     Activar InpUseONNX=true con score 0.60
Semanas 9-12:  Comparar métricas con/sin ONNX
Semana 13+:    Reentrenar ONNX con todos los datos acumulados
```

### Para activar:
1. Copiar `TSMT_v6_filter.onnx` a `MQL5/Files/`
2. En los inputs del EA:
   ```
   InpUseONNX       = true
   InpONNX_File     = TSMT_v6_filter.onnx
   InpONNX_MinScore = 0.60
   InpONNX_LogScores = true
   ```
3. Reiniciar el EA (quitar y volver a arrastrar al gráfico)
4. Revisar el Journal de MT5 para ver los scores ONNX

---

## PASO 6 — Checklist antes de pasar a LIVE

```
[ ] Forward test mínimo 60 días completado
[ ] Profit Factor forward > 1.8
[ ] DD máximo en forward < 6%
[ ] 50+ trades cerrados en forward
[ ] Ninguna semana superó el límite de DD diario (2%)
[ ] ONNX entrenado con ≥100 trades reales (recomendado)
[ ] SET: aprobado.set (CONSERVADOR TOP06 si querés más protección)
[ ] InpDynamicRisk = true con valores correctos
[ ] VPS configurado y corriendo 24/5
[ ] Spread del broker verificado (máximo 1.5 pips)
[ ] Backtest vs Forward comparado (no deben ser idénticos, pero la tendencia debe ser similar)
```

---

## PARÁMETROS DINÁMICOS (NO TOCAR)

```ini
InpDynamicRisk        = true
InpDynRisk_Base       = 25000.0    # Balance inicial exacto
InpDynRisk_MaxDD      = 8.0        # Límite FTMO estándar
InpDynRisk_MaxDailyDD = 2.0        # Límite FTMO diario
InpDynRisk_Target     = 8.0        # Objetivo para pasar
InpDynRisk_Phase2     = 3.0        # Riesgo baja a 0.50% a los +3%
InpDynRisk_Phase3     = 6.0        # Riesgo baja a 0.25% a los +6%
InpDynRisk_Phase4     = 8.0        # Riesgo baja a 0.10% — objetivo cumplido
```

---

## VPS RECOMENDADO

```
Contabo VPS S:     ~$5 USD/mes  (Europa, bajo costo)
MQL5 VPS:          ~$30 USD/mes (integrado en MT5, fácil)
BeeksFX:           ~$15 USD/mes (especializado en Forex)
Amazon Lightsail:  ~$3.5/mes    (configuración manual)

Requisitos:
- Windows Server 2019+
- 2 GB RAM mínimo
- 100 Mbps conexión
- Latencia < 20ms al broker
```

---

## ERRORES COMUNES

```
❌ Correr solo 2 semanas y darlo por validado
❌ Cambiar parámetros durante el forward (invalida la prueba)
❌ No registrar los números semana a semana
❌ Usar balance diferente al que usarás en live
❌ Correrlo en demo de broker diferente al fondeo (spread distinto)
❌ Activar ONNX antes de tener 100+ trades reales
❌ Poner el bot en modo SEMI y olvidarse de ejecutar trades
❌ No verificar el spread antes de cada sesión
```

---

*Guía generada: 05/07/2026 — T.N.S.V.T*
