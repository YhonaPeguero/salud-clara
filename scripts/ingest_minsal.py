"""
ingest_minsal.py
Descarga y normaliza datos de listas de espera del Visor Ciudadano MINSAL.

Fuente: https://visortiemposespera.minsal.cl/
Salida: data/minsal_espera.json

Uso:
    pip install requests beautifulsoup4
    python scripts/ingest_minsal.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent

ESTABLECIMIENTO_IDS = {
    "HOSPITAL SAN JOSE": "hosp_san_jose",
    "HOSPITAL ROBERTO DEL RIO": "hosp_roberto_del_rio",
    "HOSPITAL SAN JUAN DE DIOS": "hosp_san_juan_dios",
    "HOSPITAL FELIX BULNES": "hosp_felix_bulnes",
    "HOSPITAL EL CARMEN DE MAIPU": "hosp_carmen_maipu",
    "HOSPITAL SAN BORJA ARRIARÁN": "hosp_san_borja_arriarán",
    "HOSPITAL SAN BORJA ARRIARAN": "hosp_san_borja_arriarán",
    "HOSPITAL DEL SALVADOR": "hosp_del_salvador",
    "HOSPITAL LUIS CALVO MACKENNA": "hosp_luis_calvo_mackenna",
    "HOSPITAL BARROS LUCO TRUDEAU": "hosp_barros_luco",
    "HOSPITAL BARROS LUCO": "hosp_barros_luco",
    "HOSPITAL DR HERNAN HENRIQUEZ ARAVENA": "hosp_regional_temuco",
    "HOSPITAL HERNÁN HENRÍQUEZ ARAVENA": "hosp_regional_temuco",
    "HOSPITAL DR CARLOS VAN BUREN": "hosp_carlos_van_buren",
    "HOSPITAL CARLOS VAN BUREN": "hosp_carlos_van_buren",
    "HOSPITAL DR GUSTAVO FRICKE": "hosp_gustavo_fricke",
    "HOSPITAL GUSTAVO FRICKE": "hosp_gustavo_fricke",
    "HOSPITAL REGIONAL DE RANCAGUA": "hosp_regional_rancagua",
    "HOSPITAL DE RANCAGUA": "hosp_regional_rancagua",
    "HOSPITAL REGIONAL DE TALCA": "hosp_regional_talca",
    "HOSPITAL HERINDA MARTIN": "hosp_herminda_martin",
    "HOSPITAL HERMINDA MARTIN": "hosp_herminda_martin",
    "HOSPITAL GUILLERMO GRANT BENAVENTE": "hosp_guillermo_grant",
    "HOSPITAL BASE VALDIVIA": "hosp_valdivia",
    "HOSPITAL BASE DE VALDIVIA": "hosp_valdivia",
    "HOSPITAL BASE OSORNO": "hosp_osorno",
    "HOSPITAL DE PUERTO MONTT": "hosp_puerto_montt",
    "HOSPITAL REGIONAL DE COYHAIQUE": "hosp_coyhaique",
    "HOSPITAL LAUTARO NAVARRO": "hosp_punta_arenas",
    "HOSPITAL SAN JUAN DE DIOS LA SERENA": "hosp_la_serena",
    "HOSPITAL LEONARDO GUZMAN": "hosp_antofagasta",
    "HOSPITAL DR ERNESTO TORRES GALDAMES": "hosp_iquique",
    "HOSPITAL DR JUAN NOE CREVANI": "hosp_arica",
}


def normalize_nombre(nombre: str) -> str:
    import unicodedata
    nombre = nombre.upper().strip()
    nombre = "".join(
        c for c in unicodedata.normalize("NFD", nombre)
        if unicodedata.category(c) != "Mn"
    )
    nombre = " ".join(nombre.split())
    return nombre


def explore_minsal_api():
    """
    Explora las fuentes de datos MINSAL disponibles.

    El Visor Ciudadano de Tiempos de Espera está en:
    https://visortiemposespera.minsal.cl/

    Puede tener datos descargables en CSV o accesibles via API REST.
    """
    try:
        import requests

        print("Explorando Visor MINSAL...")

        urls_to_try = [
            "https://visortiemposespera.minsal.cl/",
            "https://visortiemposespera.minsal.cl/api/",
            "https://visortiemposespera.minsal.cl/data/",
        ]

        session = requests.Session()
        session.headers.update({"User-Agent": "Mozilla/5.0 (salud-transparente research bot)"})

        for url in urls_to_try:
            try:
                r = session.get(url, timeout=15)
                print(f"  {url}: HTTP {r.status_code} ({len(r.content)} bytes)")
                if r.status_code == 200 and "json" in r.headers.get("content-type", ""):
                    print("  → Responde JSON!")
                    data = r.json()
                    print(f"  → Claves: {list(data.keys())[:5]}")
            except Exception as e:
                print(f"  {url}: ERROR - {e}")

        print("\nAlternativa: descargar CSV desde el Visor MINSAL manualmente")
        print("y pasarlo como argumento: python scripts/ingest_minsal.py datos_minsal.csv")

        return None

    except ImportError:
        print("ERROR: pip install requests beautifulsoup4")
        return None


def parse_csv_minsal(filepath: str, fecha_corte: str = "Diciembre 2024"):
    """
    Parsea un CSV descargado del Visor MINSAL.

    Columnas esperadas (pueden variar):
    - Establecimiento / Hospital
    - Tipo espera (CIRUGIA, CONSULTA ESPECIALIDAD)
    - N° en espera
    - Variación %

    Args:
        filepath: ruta al CSV de MINSAL
        fecha_corte: período de los datos

    Returns:
        dict con datos por establecimiento_id
    """
    try:
        import csv

        establecimientos = {}

        with open(filepath, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            print(f"Columnas: {reader.fieldnames}")

            for row in reader:
                nombre_raw = row.get("Establecimiento") or row.get("Hospital") or ""
                if not nombre_raw:
                    continue

                nombre_norm = normalize_nombre(nombre_raw)
                eid = None
                for key, val in ESTABLECIMIENTO_IDS.items():
                    if key in nombre_norm or nombre_norm in key:
                        eid = val
                        break

                if not eid:
                    continue

                tipo = (row.get("Tipo") or row.get("TipoEspera") or "").upper()
                cantidad = int(row.get("N°") or row.get("Cantidad") or 0)
                variacion = row.get("Variacion") or row.get("Var%") or None

                if eid not in establecimientos:
                    establecimientos[eid] = {
                        "espera_cirugia": 0,
                        "espera_consulta_especialidad": 0,
                        "variacion_cirugia_pct": None,
                        "variacion_consulta_pct": None,
                        "fecha_corte": fecha_corte,
                        "es_hero": eid in {"hosp_san_jose", "hosp_regional_temuco", "hosp_carlos_van_buren"},
                    }

                if "CIRUG" in tipo:
                    establecimientos[eid]["espera_cirugia"] = cantidad
                    if variacion:
                        try:
                            establecimientos[eid]["variacion_cirugia_pct"] = float(
                                variacion.replace("%", "").replace(",", ".")
                            )
                        except ValueError:
                            pass
                elif "CONSULTA" in tipo or "ESPECIALIDAD" in tipo:
                    establecimientos[eid]["espera_consulta_especialidad"] = cantidad
                    if variacion:
                        try:
                            establecimientos[eid]["variacion_consulta_pct"] = float(
                                variacion.replace("%", "").replace(",", ".")
                            )
                        except ValueError:
                            pass

        print(f"Establecimientos encontrados: {len(establecimientos)}")
        return establecimientos

    except Exception as e:
        print(f"ERROR: {e}")
        return None


def save_output(establecimientos: dict, fecha_corte: str = "Diciembre 2024"):
    """Actualiza el JSON de salida con nuevos datos."""
    path = ROOT / "data" / "minsal_espera.json"

    with open(path) as f:
        existing = json.load(f)

    for eid, data in establecimientos.items():
        if eid in existing["establecimientos"]:
            nombre_actual = existing["establecimientos"][eid].get("nombre", "")
            existing["establecimientos"][eid].update(data)
            existing["establecimientos"][eid]["nombre"] = nombre_actual

    existing["fecha_corte"] = fecha_corte
    existing["fecha_actualizacion"] = datetime.now().strftime("%Y-%m-%d")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"\nGuardado en {path}")
    print(f"Establecimientos actualizados: {len(establecimientos)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Ingesta MINSAL - Visor Ciudadano de Tiempos de Espera")
    print("=" * 60)

    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
        fecha = sys.argv[2] if len(sys.argv) > 2 else "Diciembre 2024"
        print(f"\nModo CSV: {csv_path} ({fecha})")
        establecimientos = parse_csv_minsal(csv_path, fecha)
        if establecimientos:
            save_output(establecimientos, fecha)
    else:
        print("\nModo exploración")
        print("Uso: python scripts/ingest_minsal.py <archivo.csv> [fecha_corte]")
        print("\nExplorando Visor MINSAL...")
        explore_minsal_api()
        print("\nPara actualizar datos:")
        print("1. Visita https://visortiemposespera.minsal.cl/")
        print("2. Descarga los datos en CSV")
        print("3. Ejecuta: python scripts/ingest_minsal.py datos.csv 'Diciembre 2024'")
