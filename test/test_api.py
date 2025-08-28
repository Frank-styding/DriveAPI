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


# ==============================
# LECTURA DE ARCHIVO
# ==============================


def load_test_data(file_path="datos.txt"):
    """
    Formato esperado en datos.txt:
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


def build_batch_payload(entries, request_id=None):
    """Construye un payload estilo sendData (bloque de items)."""
    if not entries:
        return None

    spreadsheet = entries[0]["spreadsheet"]
    sheetName = entries[0]["sheetName"]
    tableName = entries[0]["tableName"]

    return {
        "type": "insert:format_1",
        "timestamp": int(time.time()),
        "id": request_id,
        "data": {
            "spreadsheetName": spreadsheet,
            "sheetName": sheetName,
            "data": {
                "tableName": tableName,
                "tableData": {"dni": tableName, "capitan": tableName},
                "items": [
                    {"inicio": e["inicio"], "estado": e["estado"]} for e in entries
                ],
            },
        },
    }


# ==============================
# API HANDLERS
# ==============================


def wait_until_ready(api_url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.post(api_url, json={"type": "isReady"})
            json_resp = resp.json()
            if json_resp.get("isReady") is True:
                return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def send_batch(i, entries):
    """Envía un lote de datos similar a sendData TS."""
    api_url = get_api_url()
    if not wait_until_ready(api_url):
        return {
            "batch": i + 1,
            "tiempo": 0,
            "status": 503,
            "respuesta": "Timeout esperando isReady",
        }

    payload = build_batch_payload(entries, request_id=f"req-{i+1}")
    start = time.time()
    r = requests.post(api_url, json=payload)
    end = time.time()

    return {
        "batch": i + 1,
        "tiempo": end - start,
        "status": r.status_code,
        "respuesta": r.text.strip(),
    }


# ==============================
# TEST SECUENCIAL Y SIMULTÁNEO
# ==============================


def test_batches(data_entries, batch_size=3):
    """Agrupa entradas en lotes y los envía secuencial y simultáneamente."""
    # Dividir datos en lotes
    batches = [
        data_entries[i : i + batch_size]
        for i in range(0, len(data_entries), batch_size)
    ]

    print("\n--- ENVÍO SECUENCIAL DE LOTES ---")
    resultados = []
    for i, batch in enumerate(batches):
        res = send_batch(i, batch)
        resultados.append(res)
        print(f"Lote {res['batch']}: {res['tiempo']:.4f}s, status {res['status']}")

    tiempo_total = sum(r["tiempo"] for r in resultados)
    print(f"\nTiempo total: {tiempo_total:.4f}s")
    print(f"Tiempo promedio: {tiempo_total/len(resultados):.4f}s")

    print("\n--- ENVÍO SIMULTÁNEO DE LOTES ---")
    resultados_sim = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(send_batch, i, batch) for i, batch in enumerate(batches)
        ]
        for future in as_completed(futures):
            res = future.result()
            resultados_sim.append(res)
            print(f"Lote {res['batch']}: {res['tiempo']:.4f}s, status {res['status']}")

    tiempo_total_sim = sum(r["tiempo"] for r in resultados_sim)
    print(f"\nTiempo total simultáneo: {tiempo_total_sim:.4f}s")
    print(f"Tiempo promedio simultáneo: {tiempo_total_sim/len(resultados_sim):.4f}s")


# ==============================
# MAIN
# ==============================


def main():
    data_entries = load_test_data("datos.txt")
    if not data_entries:
        print("❌ No se encontraron datos en el archivo.")
        return

    # Ejecutar tests (ej: lotes de 3 registros)
    test_batches(data_entries, batch_size=3)


if __name__ == "__main__":
    main()
