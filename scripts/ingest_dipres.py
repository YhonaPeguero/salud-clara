"""
ingest_dipres.py
Descarga y normaliza datos de ejecución presupuestaria de DIPRES para los
Servicios de Salud (Partida 16 - Ministerio de Salud).

Fuente: https://datos.gob.cl / https://www.dipres.gob.cl
Salida: data/dipres_ejecucion.json

Uso:
    pip install requests pandas openpyxl
    python scripts/ingest_dipres.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent

SERVICIO_SALUD_IDS = {
    "SERVICIO DE SALUD METROPOLITANO NORTE": "ss_metro_norte",
    "SERVICIO DE SALUD METROPOLITANO OCCIDENTE": "ss_metro_occidente",
    "SERVICIO DE SALUD METROPOLITANO CENTRAL": "ss_metro_central",
    "SERVICIO DE SALUD METROPOLITANO ORIENTE": "ss_metro_oriente",
    "SERVICIO DE SALUD METROPOLITANO SUR": "ss_metro_sur",
    "SERVICIO DE SALUD METROPOLITANO SUR ORIENTE": "ss_metro_sur_oriente",
    "SERVICIO DE SALUD VALPARAISO - SAN ANTONIO": "ss_valparaiso_sa",
    "SERVICIO DE SALUD VINA DEL MAR - QUILLOTA": "ss_vina_quillota",
    "SERVICIO DE SALUD ACONCAGUA": "ss_aconcagua",
    "SERVICIO DE SALUD LIBERTADOR GENERAL BERNARDO O'HIGGINS": "ss_ohiggins",
    "SERVICIO DE SALUD MAULE": "ss_maule",
    "SERVICIO DE SALUD NUBLE": "ss_nuble",
    "SERVICIO DE SALUD BIOBIO": "ss_biobio",
    "SERVICIO DE SALUD TALCAHUANO": "ss_talcahuano",
    "SERVICIO DE SALUD ARAUCO": "ss_arauco",
    "SERVICIO DE SALUD ARAUCANIA NORTE": "ss_araucania_norte",
    "SERVICIO DE SALUD ARAUCANIA SUR": "ss_araucania_sur",
    "SERVICIO DE SALUD VALDIVIA": "ss_valdivia",
    "SERVICIO DE SALUD OSORNO": "ss_osorno",
    "SERVICIO DE SALUD DEL RELONCAVI": "ss_reloncavi",
    "SERVICIO DE SALUD CHILOE": "ss_chiloe",
    "SERVICIO DE SALUD AYSEN": "ss_aysen",
    "SERVICIO DE SALUD MAGALLANES": "ss_magallanes",
    "SERVICIO DE SALUD COQUIMBO": "ss_coquimbo",
    "SERVICIO DE SALUD ATACAMA": "ss_atacama",
    "SERVICIO DE SALUD ANTOFAGASTA": "ss_antofagasta",
    "SERVICIO DE SALUD TARAPACA": "ss_tarapaca",
    "SERVICIO DE SALUD ARICA Y PARINACOTA": "ss_arica_parinacota",
}

HERO_IDS = {"ss_metro_norte", "ss_araucania_sur", "ss_valparaiso_sa"}


def normalize_nombre(nombre: str) -> str:
    import unicodedata
    nombre = nombre.upper().strip()
    nombre = "".join(
        c for c in unicodedata.normalize("NFD", nombre)
        if unicodedata.category(c) != "Mn"
    )
    return nombre


def ingest_from_api():
    """
    Intenta obtener datos desde la API de datos.gob.cl / DIPRES.

    DIPRES publica archivos Excel mensuales con ejecución presupuestaria.
    URL típica: https://www.dipres.gob.cl/598/articles-XXXXX_doc_xls.xls

    También disponible en: https://datos.gob.cl/dataset/ejecucion-presupuestaria
    """
    try:
        import requests
        import pandas as pd

        print("Intentando conectar con API datos.gob.cl...")

        # Buscar datasets de DIPRES en datos.gob.cl
        url_api = "https://datos.gob.cl/api/3/action/package_search"
        params = {
            "q": "ejecucion presupuestaria dipres salud",
            "rows": 5,
        }
        r = requests.get(url_api, params=params, timeout=30)
        r.raise_for_status()

        results = r.json().get("result", {}).get("results", [])
        print(f"Datasets encontrados: {len(results)}")

        for ds in results:
            print(f"  - {ds.get('title', 'sin título')}: {ds.get('name', '')}")

        print("\nNOTA: La descarga e interpretación del Excel de DIPRES requiere")
        print("conocer la estructura exacta del archivo para el año consultado.")
        print("Revisar manualmente en: https://www.dipres.gob.cl/597/w3-propertyvalue-15131.html")

        return None

    except ImportError:
        print("ERROR: Instala dependencias: pip install requests pandas openpyxl")
        return None
    except Exception as e:
        print(f"ERROR al conectar con API: {e}")
        return None


def parse_excel_dipres(filepath: str, ano: int = 2024):
    """
    Parsea el Excel de ejecución presupuestaria de DIPRES.

    Estructura típica del Excel DIPRES:
    - Columna "Institución" o "Nombre": nombre del servicio
    - Columna "Presupuesto Inicial": monto asignado
    - Columna "Presupuesto Vigente": monto vigente (con modificaciones)
    - Columna "Gasto Devengado": monto efectivamente ejecutado

    Args:
        filepath: ruta al archivo Excel de DIPRES
        ano: año del presupuesto

    Returns:
        dict con datos normalizados por servicio_id
    """
    try:
        import pandas as pd

        print(f"Leyendo {filepath}...")
        df = pd.read_excel(filepath, header=None)

        print(f"Dimensiones: {df.shape}")
        print("Primeras filas:")
        print(df.head(10).to_string())

        print("\nNOTA: Ajusta las referencias de columnas según la estructura")
        print("real del archivo Excel descargado de DIPRES.")

        servicios = {}
        mes_corte = f"Diciembre {ano}"

        for _, row in df.iterrows():
            nombre_raw = str(row.get(0, "")).strip()
            nombre_norm = normalize_nombre(nombre_raw)

            if nombre_norm in SERVICIO_SALUD_IDS:
                sid = SERVICIO_SALUD_IDS[nombre_norm]
                try:
                    ppto_inicial = float(row.get(1, 0)) / 1_000_000
                    ppto_vigente = float(row.get(2, 0)) / 1_000_000
                    devengado = float(row.get(3, 0)) / 1_000_000
                    pct = (devengado / ppto_vigente * 100) if ppto_vigente > 0 else 0

                    servicios[sid] = {
                        "presupuesto_inicial_MM": round(ppto_inicial, 0),
                        "presupuesto_vigente_MM": round(ppto_vigente, 0),
                        "devengado_MM": round(devengado, 0),
                        "pct_ejecucion": round(pct, 1),
                        "mes_corte": mes_corte,
                        "es_hero": sid in HERO_IDS,
                    }
                except (ValueError, TypeError) as e:
                    print(f"  WARN: Error parseando {nombre_raw}: {e}")

        print(f"Servicios encontrados: {len(servicios)}")
        return servicios

    except ImportError:
        print("ERROR: pip install pandas openpyxl")
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None


def save_output(servicios: dict, ano: int = 2024, mes_corte: str = "Diciembre 2024"):
    """Guarda el JSON de salida."""
    existing_path = ROOT / "data" / "dipres_ejecucion.json"

    with open(existing_path) as f:
        existing = json.load(f)

    for sid, data in servicios.items():
        if sid in existing["servicios"]:
            existing["servicios"][sid].update(data)

    existing["ano"] = ano
    existing["mes_corte"] = mes_corte
    existing["fecha_actualizacion"] = datetime.now().strftime("%Y-%m-%d")

    with open(existing_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en {existing_path}")
    print(f"Servicios actualizados: {len(servicios)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Ingesta DIPRES - Ejecución Presupuestaria Salud")
    print("=" * 60)

    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
        ano = int(sys.argv[2]) if len(sys.argv) > 2 else 2024
        print(f"\nModo Excel: {excel_path} (año {ano})")
        servicios = parse_excel_dipres(excel_path, ano)
        if servicios:
            save_output(servicios, ano)
    else:
        print("\nModo exploración (sin archivo Excel)")
        print("Uso: python scripts/ingest_dipres.py <ruta_excel.xlsx> [año]")
        print("\nExplorando API datos.gob.cl...")
        ingest_from_api()
        print("\nPara actualizar datos:")
        print("1. Descarga el Excel de DIPRES desde:")
        print("   https://www.dipres.gob.cl/597/w3-propertyvalue-15131.html")
        print("2. Ejecuta: python scripts/ingest_dipres.py ruta_al_archivo.xlsx 2024")
