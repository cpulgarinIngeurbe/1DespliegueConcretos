import pandas as pd
import os
from datetime import datetime

archivo_consolidado = "desplegable/Consolidado.xlsx"
archivo_html = "index.html"

# Verificar que el archivo existe
if not os.path.exists(archivo_consolidado):
    print(f'[!] El archivo {archivo_consolidado} no existe')
    exit(1)

# Leer el Excel
print(f'[*] Leyendo: {archivo_consolidado}')
df = pd.read_excel(archivo_consolidado)
print(f'[+] Datos cargados: {len(df)} registros, {len(df.columns)} columnas')

# Obtener información
columnas = list(df.columns)
num_registros = len(df)
num_columnas = len(df.columns)
fecha_generacion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

print(f'[+] Columnas: {", ".join(columnas)}')

# Generar tabla HTML
tabla_html = df.head(100).to_html(
    classes='w-full border-collapse',
    index=False,
    justify='center'
)

# Generar estadísticas
stats_html = ''
for col in columnas[:5]:
    if pd.api.types.is_numeric_dtype(df[col]):
        media = df[col].mean()
        maximo = df[col].max()
        minimo = df[col].min()
        stats_html += f'''<div class="glass-card-light p-4 rounded-lg border border-accent-active/20">
                    <h3 class="font-label-sm text-accent-active uppercase tracking-wider mb-3">{col}</h3>
                    <div class="space-y-1 text-sm">
                        <p><span class="text-secondary font-semibold">Media:</span> {media:.2f}</p>
                        <p><span class="text-secondary font-semibold">Máximo:</span> {maximo:.2f}</p>
                        <p><span class="text-secondary font-semibold">Mínimo:</span> {minimo:.2f}</p>
                    </div>
                </div>
                '''

# Crear HTML
html_content = f"""<!DOCTYPE html>
<html class="light" lang="es">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Dashboard - Consolidado de Resistencias</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <style>
        body {{
            background-color: #ffffff;
            color: #141311;
        }}
        .glass-card-light {{
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid #E7E9C1;
        }}
        .pulse-node {{
            animation: pulseGlow 2s infinite ease-in-out;
        }}
        @keyframes pulseGlow {{
            0%, 100% {{
                box-shadow: 0 0 20px rgba(163, 198, 16, 0.35);
            }}
            50% {{
                box-shadow: 0 0 35px rgba(163, 198, 16, 0.55);
            }}
        }}
        table {{
            border-collapse: collapse;
        }}
        table th {{
            background-color: #4B4F1D;
            color: #ffffff;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
        }}
        table td {{
            padding: 12px;
            border-bottom: 1px solid #e5e2dd;
        }}
        table tr:hover {{
            background-color: #f8f8f7;
        }}
    </style>
</head>
<body style="background: #ffffff; color: #141311;">
    <nav style="position: fixed; top: 0; width: 100%; z-index: 50; padding: 24px 64px; background: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 16px;">
            <span style="color: #A3C610; font-size: 28px;">📊</span>
            <div>
                <h1 style="font-size: 32px; font-weight: 500; color: #4B4F1D; margin: 0;">Dashboard</h1>
                <p style="font-size: 14px; color: #47473e; margin: 0;">Consolidado de Resistencias</p>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #A3C610;">📅</span>
            <span style="font-size: 14px; color: #47473e;">{fecha_generacion}</span>
        </div>
    </nav>

    <main style="margin-top: 100px; padding: 0 64px 48px 64px;">
        <div style="max-width: 1440px; margin: 0 auto;">
            <!-- Resumen -->
            <section style="margin-bottom: 48px;">
                <h2 style="font-size: 32px; font-weight: 500; color: #4B4F1D; margin-bottom: 24px; padding-left: 16px; border-left: 4px solid #A3C610;">Resumen de Datos</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
                    <div class="glass-card-light pulse-node" style="padding: 24px; border-radius: 8px; border: 1px solid #E7E9C1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-size: 12px; color: #A3C610; text-transform: uppercase; margin: 0;">Total Registros</h3>
                            <span style="font-size: 24px;">📊</span>
                        </div>
                        <p style="font-size: 32px; font-weight: bold; color: #4B4F1D; margin: 0;">{num_registros}</p>
                    </div>
                    <div class="glass-card-light" style="padding: 24px; border-radius: 8px; border: 1px solid #E7E9C1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-size: 12px; color: #4B4F1D; text-transform: uppercase; margin: 0;">Columnas</h3>
                            <span style="font-size: 24px;">📋</span>
                        </div>
                        <p style="font-size: 32px; font-weight: bold; color: #4B4F1D; margin: 0;">{num_columnas}</p>
                    </div>
                    <div class="glass-card-light" style="padding: 24px; border-radius: 8px; border: 1px solid #E7E9C1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-size: 12px; color: #4B4F1D; text-transform: uppercase; margin: 0;">Fuente</h3>
                            <span style="font-size: 24px;">📄</span>
                        </div>
                        <p style="font-size: 14px; color: #4B4F1D; margin: 0;">Consolidado.xlsx</p>
                    </div>
                    <div class="glass-card-light" style="padding: 24px; border-radius: 8px; border: 1px solid #E7E9C1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-size: 12px; color: #4B4F1D; text-transform: uppercase; margin: 0;">Generado</h3>
                            <span style="font-size: 24px;">⏰</span>
                        </div>
                        <p style="font-size: 12px; color: #4B4F1D; margin: 0;">{fecha_generacion}</p>
                    </div>
                </div>
            </section>

            <!-- Estadísticas -->
            <section style="margin-bottom: 48px;">
                <h2 style="font-size: 32px; font-weight: 500; color: #4B4F1D; margin-bottom: 24px; padding-left: 16px; border-left: 4px solid #A3C610;">Estadísticas</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    {stats_html}
                </div>
            </section>

            <!-- Tabla -->
            <section>
                <h2 style="font-size: 32px; font-weight: 500; color: #4B4F1D; margin-bottom: 24px; padding-left: 16px; border-left: 4px solid #A3C610;">Datos (Primeros 100 registros)</h2>
                <div class="glass-card-light" style="padding: 24px; border-radius: 8px; border: 1px solid #E7E9C1; overflow-x: auto;">
                    {tabla_html}
                </div>
            </section>
        </div>
    </main>
</body>
</html>"""

# Guardar HTML
with open(archivo_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f'[+] ✅ HTML generado: {archivo_html}')
