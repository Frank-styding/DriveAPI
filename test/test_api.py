import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

# ==============================
# CONFIGURACIÓN BASE
# ==============================


def get_api_url():
    if len(sys.argv) > 1:
        return sys.argv[1]
    return "https://script.google.com/macros/s/AKfycbxOMSOO1-PT4-P7s_L8ubCPgqTLUwmBg7XYJujCxXspchoJ2btzmWvZuK4TeaEFUQiQLQ/exec"


# Configuración inicial
CONFIG_PAYLOAD = {
    "type": "config",
    "data": {
        "folderName": "data",
        "headers": ["inicio", "horas", "estado"],
        "headerFormats": {
            1: {"numberFormat": "[h]:mm:ss"},
            2: {
                "conditionalRules": [
                    {"type": "textIsEmpty", "background": "white"},
                    {
                        "type": "textEqualTo",
                        "value": "Trabajando",
                        "background": "#41B451",
                    },
                    {"type": "textEqualTo", "value": "FIN", "background": "#389FBE"},
                    {
                        "type": "notEqualTo",
                        "value": "Trabajando",
                        "background": "#AA3636",
                    },
                ],
            },
        },
        "rowFormulas": {
            "fin": "=A2",
            "horas": "=IF(OR(ISBLANK(A1); ISBLANK(A2)); 0; A2 - A1)",
        },
        "formulasFormat": {
            "horas_trabajo": {"numberFormat": "[h]:mm:ss"},
            "horas_almuerzo": {"numberFormat": "[h]:mm:ss"},
        },
        "formulas": {
            "horas_trabajo": '=SUMIF(C2:C, "Trabajando", B2:B)',
            "horas_almuerzo": '=SUMIF(C2:C, "Almuerzo", B2:B)',
        },
    },
}

CONFIG_PAYLOAD_INIT_TRIGGER = {
    "type": "config",
    "data": {"time": 1, "operation": "initProcessQueueTrigger"},
}

CONFIG_PAYLOAD_DELETE_TRIGGER = {
    "type": "config",
    "data": {"operation": "deleteTriggers"},
}

# ==============================
# LECTURA DE ARCHIVO
# ==============================


def load_test_data(file_path="datos.txt"):
    """
    Lee un archivo de texto con el formato:
    spreadsheet sheetName tableName inicio estado
    """
    data = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) < 5:
                print(f"⚠️ Línea inválida: {line}")
                continue
            spreadsheet, sheetName, tableName, inicio, estado = parts[0:5]
            data.append(
                {
                    "spreadsheet": spreadsheet,
                    "sheetName": sheetName,
                    "tableName": tableName,
                    "inicio": inicio,
                    "estado": estado,
                }
            )
    return data


# ==============================
# PAYLOAD
# ==============================


def build_queue_payload(entry, i):
    return {
        "type": "insertFormat_1",
        "data": {
            "spreadsheetName": entry["spreadsheet"],
            "sheetName": entry["sheetName"],
            "data": {
                "tableName": entry["tableName"],
                "tableData": {"capitan": entry["tableName"]},  # igual que tableName
                "items": [
                    {
                        "inicio": entry["inicio"],
                        "estado": entry["estado"],
                    }
                ],
            },
        },
        "timestamp": int(time.time() * 1000),
    }


# ==============================
# API HANDLERS
# ==============================


def wait_until_ready(api_url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.post(api_url, data=json.dumps({"type": "isReady"}))
        if resp.text.strip() == "true":
            return True
        time.sleep(0.1)
    return False


def send_request(i, entry):
    api_url = get_api_url()
    if not wait_until_ready(api_url):
        return {
            "peticion": i + 1,
            "tiempo": 0,
            "status": 503,
            "respuesta": "Timeout esperando isReady",
        }
    payload = build_queue_payload(entry, i)
    start = time.time()
    r = requests.post(api_url, data=json.dumps(payload))
    end = time.time()
    return {
        "peticion": i + 1,
        "tiempo": end - start,
        "status": r.status_code,
        "respuesta": r.text.strip(),
    }


# ==============================
# CONFIGURACIÓN DE LA APP
# ==============================


def config():
    api_url = get_api_url()
    print("⚙️ Configurando la app...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD))
    print(f"Respuesta configuración: {resp.text}")

    print("⏱️ Iniciando trigger...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD_INIT_TRIGGER))
    print(f"Respuesta trigger: {resp.text}")


def delete_trigger():
    api_url = get_api_url()
    print("🗑️ Eliminando triggers...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD_DELETE_TRIGGER))
    print(f"Respuesta eliminación: {resp.text}")


def clear_cache():
    api_url = get_api_url()
    print("🧹 Limpiando cache...")
    payload = {"type": "config", "data": {"operation": "clearCache"}}
    resp = requests.post(api_url, data=json.dumps(payload))
    print(f"Respuesta limpieza cache: {resp.text}")


# ==============================
# TEST SECUENCIAL Y SIMULTÁNEO
# ==============================


def test(data_entries):
    print("\n--- PETICIONES SECUENCIALES ---")
    resultados = []
    for i, entry in enumerate(data_entries):
        res = send_request(i, entry)
        resultados.append(res)
        print(
            f"Petición {res['peticion']}: {res['tiempo']:.4f} s, status {res['status']}"
        )

    tiempo_total = sum(r["tiempo"] for r in resultados)
    print(f"\nTiempo total: {tiempo_total:.4f} s")
    print(f"Tiempo promedio: {tiempo_total/len(resultados):.4f} s")

    print("\n--- PETICIONES SIMULTÁNEAS ---")
    resultados_sim = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(send_request, i, entry)
            for i, entry in enumerate(data_entries)
        ]
        for future in as_completed(futures):
            res = future.result()
            resultados_sim.append(res)
            print(
                f"Petición {res['peticion']}: {res['tiempo']:.4f} s, status {res['status']}"
            )

    tiempo_total_sim = sum(r["tiempo"] for r in resultados_sim)
    print(f"\nTiempo total simultáneo: {tiempo_total_sim:.4f} s")
    print(f"Tiempo promedio simultáneo: {tiempo_total_sim/len(resultados_sim):.4f} s")


# ==============================
# MAIN
# ==============================


def main():
    data_entries = load_test_data("datos.txt")
    if not data_entries:
        print("❌ No se encontraron datos en el archivo.")
        return

    # Limpieza previa
    delete_trigger()
    clear_cache()

    # Configuración y trigger
    config()

    # Ejecutar tests
    test(data_entries)

    # Espera antes de borrar el trigger (opcional)
    time.sleep(60)
    delete_trigger()


if __name__ == "__main__":
    main()
