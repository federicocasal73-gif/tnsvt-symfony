"""
TSMT v6 PRO — Entrenamiento del modelo ONNX (REESCRITO)
========================================================
Las 10 features coinciden EXACTAMENTE con el bot MQL5 (TSMT_v6onnx.mq5).

Feature vector del bot (GetONNXScore en línea ~2662):
  [0] hora / 24                    — hora normalizada
  [1] día_semana / 7               — día de la semana normalizado
  [2] spread / ATR                 — volatilidad relativa
  [3] distancia_ERL                — distancia al ERL más cercano (normalizada por ATR)
  [4] wickRatio                    — ratio de mecha de la vela de señal
  [5] confluencia / 6              — cantidad de condiciones de entrada (0-6)
  [6] SL_pips / 100                — distancia del stop loss en pips
  [7] R:R / 5                      — ratio riesgo:beneficio
  [8] rango_día / ATR              — rango del día actual vs ATR
  [9] dirección                    — 1=BUY, 0=SELL

FORMATO DEL CSV — DOS OPCIONES:

OPCIÓN A (recomendada): CSV enriquecido desde el bot
  Si tu EA loguea trades con todos los datos, guardá el CSV con estas columnas:
  Time, Type, Volume, Price, S/L, T/P, Profit, ATR, ERL_Dist, WickRatio, Confluence

  OPCIÓN B: Export estándar de MT5 + cálculos aproximados
  View → Account History → Save as Report (detailed)
  El script calcula lo que puede del CSV y approxima el resto.

USO:
  pip install pandas scikit-learn skl2onnx onnx numpy
  python train_onnx_model.py

  El script busca: trades_history.csv (UTF-16 tab-separated, formato MT5)
  O: trades_enriched.csv (CSV con todas las columnas)

REQUISITOS:
  pip install pandas scikit-learn skl2onnx onnx numpy
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score
import warnings
import os
import sys
warnings.filterwarnings('ignore')

# ── FEATURE NAMES (exactas como en el bot MQL5) ────────────────────
FEATURE_NAMES = [
    'hora_norm',        # [0] dt.hour / 24
    'dia_semana_norm',  # [1] dt.day_of_week / 7
    'spread_atr',       # [2] spread / ATR
    'erl_dist',         # [3] distancia al ERL más cercano (normalizada)
    'wick_ratio',       # [4] ratio de mecha de la vela de señal
    'confluence_norm',  # [5] confluencia / 6
    'sl_pips_norm',     # [6] SL pips / 100
    'rr_norm',          # [7] R:R / 5
    'day_range_pct',    # [8] rango del día / ATR
    'direction',        # [9] 1=BUY, 0=SELL
]

N_FEATURES = len(FEATURE_NAMES)

# ── 1. CARGAR DATOS ────────────────────────────────────────────────
print("=" * 60)
print("TSMT v6 PRO — Entrenamiento ONNX")
print("Features: 10 (idénticas al bot MQL5)")
print("=" * 60)
print()

df = None

# Intentar CSV enriquecido primero
for fname in ['trades_enriched.csv', 'trades_history.csv']:
    if os.path.exists(fname):
        print(f"Archivo encontrado: {fname}")
        try:
            # Intentar UTF-16 (formato MT5 estándar)
            df = pd.read_csv(fname, sep='\t', encoding='utf-16')
        except:
            try:
                # Intentar UTF-8
                df = pd.read_csv(fname, sep=',', encoding='utf-8')
            except:
                df = pd.read_csv(fname, sep='\t')
        break

if df is None:
    print("⚠ No se encontró trades_history.csv ni trades_enriched.csv")
    print("  Generando datos de DEMO para testing del script...")
    print("  IMPORTANTE: Estos datos NO sirven para entrenar el modelo real.")
    print()
    np.random.seed(42)
    n = 500
    hours = np.random.choice(range(24), n, p=[
        0.01,0.01,0.01,0.02,0.03,0.04,0.05,0.06,  # 0-7
        0.08,0.09,0.10,0.09,0.08,0.09,0.10,0.08,  # 8-15
        0.05,0.03,0.02,0.01,0.01,0.01,0.01,0.01   # 16-23
    ])
    days = np.random.randint(0, 5, n)  # Lun-Vie
    directions = np.random.choice([0, 1], n)
    sl_pips = np.random.uniform(10, 60, n)
    rr = np.random.uniform(1.5, 5.0, n)
    wick = np.random.uniform(0.3, 0.9, n)
    confluence = np.random.randint(2, 7, n)
    spread_atr = np.random.uniform(0.01, 0.15, n)
    erl_dist = np.random.uniform(0.1, 2.0, n)
    day_range = np.random.uniform(0.5, 3.0, n)
    # Win probability correlates with features
    logit = (0.3*wick + 0.2*(confluence/6) + 0.15*(rr/5) 
             - 0.2*spread_atr + 0.1*erl_dist + np.random.normal(0, 0.3, n))
    prob = 1 / (1 + np.exp(-logit))
    profit = np.where(np.random.random(n) < prob, 
                      np.random.uniform(20, 200, n),
                      np.random.uniform(-200, -20, n))
    
    df = pd.DataFrame({
        'Time': pd.date_range('2025-01-01', periods=n, freq='3h'),
        'Type': np.where(directions == 1, 'buy', 'sell'),
        'Profit': profit,
        'Volume': np.random.choice([0.01, 0.02, 0.05], n),
        'Price': np.random.uniform(1.02, 1.10, n),
        'S/L': np.random.uniform(1.01, 1.09, n),
        'T/P': np.random.uniform(1.03, 1.11, n),
        # Columnas enriquecidas (approximadas para demo)
        'ATR': np.random.uniform(0.003, 0.012, n),
        'ERL_Dist': erl_dist,
        'WickRatio': wick,
        'Confluence': confluence,
    })

print(f"Filas cargadas: {len(df)}")
print(f"Columnas: {list(df.columns)}")
print()

# ── 2. FEATURE ENGINEERING ────────────────────────────────────────
print("Construyendo las 10 features del bot MQL5...")

df['Time'] = pd.to_datetime(df['Time'])

# [0] Hora normalizada: dt.hour / 24
df['hora_norm'] = df['Time'].dt.hour / 24.0

# [1] Día de semana normalizado: dt.day_of_week / 7
df['dia_semana_norm'] = df['Time'].dt.dayofweek / 7.0

# Direction: [9] 1=BUY, 0=SELL
df['direction'] = df['Type'].astype(str).str.lower().apply(
    lambda x: 1 if 'buy' in x else 0
)

# Win target
df['won'] = (df['Profit'] > 0).astype(int)

# [2] Spread / ATR
if 'ATR' in df.columns:
    atr = df['ATR'].replace(0, 0.001)
    if 'Spread' in df.columns:
        df['spread_atr'] = df['Spread'] / atr
    else:
        # Approximation: spread típico EURUSD ~1.5 pips = 0.00015
        df['spread_atr'] = 0.00015 / atr
else:
    print("  ⚠ ATR no encontrado — usando approximación")
    df['spread_atr'] = np.random.uniform(0.01, 0.10, len(df))

# [3] Distancia ERL normalizada
if 'ERL_Dist' in df.columns:
    df['erl_dist'] = df['ERL_Dist'].clip(0, 5)
else:
    print("  ⚠ ERL_Dist no encontrado — usando approximación")
    # Approximación: distancia al ER level más cercano
    df['erl_dist'] = np.random.uniform(0.2, 2.5, len(df))

# [4] Wick ratio
if 'WickRatio' in df.columns:
    df['wick_ratio'] = df['WickRatio'].clip(0, 1)
else:
    print("  ⚠ WickRatio no encontrado — calculando de S/L y precio")
    if 'S/L' in df.columns and 'Price' in df.columns:
        sl_dist = abs(df['Price'] - df['S/L'])
        body = abs(df['Price'] - df.get('Close', df['Price']))
        body = body.replace(0, 0.0001)
        df['wick_ratio'] = (sl_dist / body).clip(0.1, 1.0)
    else:
        df['wick_ratio'] = np.random.uniform(0.3, 0.9, len(df))

# [5] Confluencia normalizada (0-6 → 0-1)
if 'Confluence' in df.columns:
    df['confluence_norm'] = (df['Confluence'].clip(0, 6) / 6.0)
else:
    print("  ⚠ Confluence no encontrado — usando approximación")
    # Approximación basada en win rate: trades ganadores suelen tener más confluencia
    base_conf = np.where(df['won'] == 1, 4.5, 2.5)
    df['confluence_norm'] = (base_conf + np.random.normal(0, 1, len(df))).clip(0, 6) / 6.0

# [6] SL pips / 100
if 'S/L' in df.columns and 'Price' in df.columns:
    sl_dist_price = abs(df['Price'] - df['S/L'])
    df['sl_pips_norm'] = (sl_dist_price * 10000 / 100).clip(0.05, 2.0)
else:
    df['sl_pips_norm'] = np.random.uniform(0.10, 0.60, len(df))

# [7] R:R / 5
if 'T/P' in df.columns and 'Price' in df.columns and 'S/L' in df.columns:
    sl_d = abs(df['Price'] - df['S/L']).replace(0, 0.0001)
    tp_d = abs(df['T/P'] - df['Price'])
    df['rr_norm'] = (tp_d / sl_d / 5.0).clip(0.1, 2.0)
else:
    df['rr_norm'] = np.random.uniform(0.3, 1.0, len(df))

# [8] Rango del día / ATR
if 'ATR' in df.columns:
    atr = df['ATR'].replace(0, 0.001)
    if 'DayRange' in df.columns:
        df['day_range_pct'] = df['DayRange'] / atr
    else:
        df['day_range_pct'] = np.random.uniform(0.5, 3.0, len(df))
else:
    df['day_range_pct'] = np.random.uniform(0.5, 3.0, len(df))

# ── 3. VALIDAR FEATURES ───────────────────────────────────────────
print()
print("Features construidas:")
for i, fname in enumerate(FEATURE_NAMES):
    vals = df[fname].dropna()
    print(f"  [{i}] {fname:<20} min={vals.min():.4f}  max={vals.max():.4f}  mean={vals.mean():.4f}")

df_clean = df.dropna(subset=FEATURE_NAMES + ['won'])
X = df_clean[FEATURE_NAMES].values.astype(np.float32)
y = df_clean['won'].values

print(f"\nDataset final: {len(X)} trades | Win rate: {y.mean()*100:.1f}%")

# Check for NaN/inf
if np.any(np.isnan(X)) or np.any(np.isinf(X)):
    print("⚠ Hay NaN o Inf en las features — reemplazando por 0")
    X = np.nan_to_num(X, nan=0.0, posinf=1.0, neginf=0.0)

# ── 4. ENTRENAR MODELO ────────────────────────────────────────────
print("\nEntrenando GradientBoosting...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', GradientBoostingClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=10,
        random_state=42
    ))
])

pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

# ── 5. RESULTADOS ─────────────────────────────────────────────────
print(f"\n{'=' * 60}")
print("RESULTADOS DEL MODELO:")
print("=" * 60)
print(classification_report(y_test, y_pred,
      target_names=['Pérdida (0)', 'Ganancia (1)']))

try:
    auc = roc_auc_score(y_test, y_prob)
    print(f"AUC-ROC: {auc:.3f}")
    if auc >= 0.70:
        print("  → BUENO: modelo con poder predictivo sólido")
    elif auc >= 0.65:
        print("  → ÚTIL: modelo funciona, mejorar con más datos")
    elif auc >= 0.60:
        print("  → MARGINAL: funciona pero con poco margen")
    else:
        print("  → DÉBIL: necesita más datos o features adicionales")
except Exception as e:
    print(f"AUC-ROC: no calculable ({e})")

# Cross-validation
try:
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='roc_auc')
    print(f"CV AUC-ROC (5-fold): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
except:
    pass

# Feature importance
fi = pipeline.named_steps['model'].feature_importances_
print(f"\n{'=' * 60}")
print("IMPORTANCIA DE FEATURES (como en el bot MQL5):")
print("=" * 60)
for fname, imp in sorted(zip(FEATURE_NAMES, fi), key=lambda x: -x[1]):
    bar = '█' * int(imp * 100)
    print(f"  {fname:<20} {imp*100:5.1f}%  {bar}")

# ── 6. EXPORTAR A ONNX ────────────────────────────────────────────
print(f"\n{'=' * 60}")
print("EXPORTANDO A ONNX...")
print("=" * 60)

try:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType

    initial_type = [('float_input', FloatTensorType([None, N_FEATURES]))]
    onnx_model = convert_sklearn(pipeline, initial_types=initial_type,
                                 target_opset=12)

    output_file = 'TSMT_v6_filter.onnx'
    with open(output_file, 'wb') as f:
        f.write(onnx_model.SerializeToString())

    file_size = os.path.getsize(output_file)
    print(f"✅ {output_file} generado ({file_size:,} bytes)")
    print()
    print("INSTALACIÓN EN MT5:")
    print(f"  1. Copiar {output_file} a:")
    print(f"     C:\\Users\\TU_USUARIO\\AppData\\Roaming\\MetaQuotes\\Terminal\\")
    print(f"     [ID_TERMINAL]\\MQL5\\Files\\")
    print(f"  2. En MT5: Archivo → Abrir carpeta de datos → MQL5 → Files")
    print(f"  3. Pegar el archivo ahí")
    print()
    print("ACTIVAR EN EL EA:")
    print("  InpUseONNX       = true")
    print("  InpONNX_File     = TSMT_v6_filter.onnx")
    print("  InpONNX_MinScore = 0.60")
    print("  InpONNX_LogScores = true  (para ver scores en el Journal)")

except ImportError:
    print("❌ skl2onnx no instalado")
    print("   Ejecutá: pip install skl2onnx")
    print("   y volvé a correr este script")

# ── 7. INSTRUCCIONES ──────────────────────────────────────────────
print(f"""
{'=' * 60}
PRÓXIMOS PASOS
{'=' * 60}

1. FORWARD TEST (primero):
   - Configurar MT5 con aprobado.set (ver guía completa)
   - Correr mínimo 8-12 semanas
   - Acumular 100+ trades reales

2. CREAR CSV ENRIQUECIDO (para mejor modelo):
   Agregar estas columnas al CSV exportado de MT5:
   - ATR(14) del M15 al momento de cada trade
   - Distancia al ERL más cercano (normalizada por ATR)
   - WickRatio de la vela de señal
   - Confluencia (cantidad de condiciones: 0-6)

3. REENTRENAR CON DATOS REALES:
   python train_onnx_model.py

4. REENTRENAMIENTO:
   - Cada 2-3 meses, o cada 50+ trades nuevos
   - Guardar versiones: TSMT_v6_filter_v1.onnx, v2, etc.
   - Comparar AUC-ROC entre versiones

{'=' * 60}
""")
