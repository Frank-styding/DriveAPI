def test_secuenciales_1min():
    print("\n--- PETICIONES SECUENCIALES SEPARADAS POR 1 MINUTO ---")
    resultados = []
    for i in range(REPETITIONS):
        res = send_request(i, "1 MINUTO")
        resultados.append(res)
        print(
            f"Petición {res['peticion']}: {res['tiempo']:.4f} segundos, status {res['status']}"
        )
        if i < REPETITIONS - 1:
            time.sleep(10)  # Espera 1 minuto entre peticiones
    print(f"\nTotal de peticiones: {len(resultados)}")
    if resultados:
        tiempo_total = sum(r["tiempo"] for r in resultados)
        print(
            f"Tiempo promedio por petición: {tiempo_total/len(resultados):.4f} segundos"
        )


def clear_cache():
    api_url = get_api_url()
    print("Limpiando cache de Drive y Google Sheet...")
    payload = {"type": "config", "data": {"operation": "clearCache"}}
    resp = requests.post(api_url, data=json.dumps(payload))
    print(f"Respuesta limpieza de cache: {resp.text}")


def test_simultaneas_1min():
    print("\n--- PETICIONES SIMULTÁNEAS DURANTE 1 MINUTO ---")
    resultados = []
    start_time = time.time()
    count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        while time.time() - start_time < 60:
            futures.append(executor.submit(send_request, count, "1 MINUTO SIMULTÁNEAS"))
            count += 1
            time.sleep(0.05)  # Pequeño retardo para evitar saturar el sistema
        for future in as_completed(futures):
            res = future.result()
            resultados.append(res)
            print(
                f"Petición {res['peticion']}: {res['tiempo']:.4f} segundos, status {res['status']}"
            )
    print(f"\nTotal de peticiones en 1 minuto: {len(resultados)}")
    if resultados:
        tiempo_total = sum(r["tiempo"] for r in resultados)
        print(
            f"Tiempo promedio por petición: {tiempo_total/len(resultados):.4f} segundos"
        )


import sys
import requests
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed


def get_api_url():
    if len(sys.argv) > 1:
        return sys.argv[1]
    return "https://script.google.com/macros/s/AKfycbxOMSOO1-PT4-P7s_L8ubCPgqTLUwmBg7XYJujCxXspchoJ2btzmWvZuK4TeaEFUQiQLQ/exec"


# Configuración de la app (ajusta según tu API)
CONFIG_PAYLOAD = {
    "type": "config",
    "data": {
        "folderName": "data",
        "headers": ["inicio", "horas", "estado"],
        "headerFormats": {
            1: {
                "numberFormat": "[h]:mm:ss",
            },
            2: {
                "conditionalRules": [
                    {
                        "type": "textIsEmpty",
                        "background": "white",
                    },
                    {
                        "type": "textEqualTo",
                        "value": "Trabajando",
                        "background": "#41B451",
                    },
                    {
                        "type": "textEqualTo",
                        "value": "FIN",
                        "background": "#389FBE",
                    },
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
            "horas_trabajo": {
                "numberFormat": "[h]:mm:ss",
            },
            "horas_almuerzo": {
                "numberFormat": "[h]:mm:ss",
            },
        },
        "formulas": {
            "horas_trabajo": '=SUMIF(C2:C, "Trabajando", B2:B)',
            "horas_almuerzo": '=SUMIF(C2:C, "Almuerzo", B2:B)',
        },
    },
}
# Configuración de la app (ajusta según tu API)
CONFIG_PAYLOAD_INIT_TRIGGER = {
    "type": "config",
    "data": {"time": 1, "operation": "initProcessQueueTrigger"},
}
CONFIG_PAYLOAD_DELETE_TRIGGER = {
    "type": "config",
    "data": {"operation": "deleteTriggers"},
}

REPETITIONS = 15


# Payload de prueba para la cola (estructura anidada como espera el API)

horas = [
    "9:00",
    "9:15",
    "9:30",
    "10:00",
    "10:15",
    "10:30",
    "11:00",
    "11:15",
    "11:30",
    "12:00",
    "12:15",
    "12:30",
    "13:00",
    "13:15",
    "13:30",
    "14:00",
    "14:15",
    "14:30",
    "15:00",
    "15:15",
    "15:30",
    "16:00",
    "16:15",
    "16:30",
    "17:00",
    "17:15",
    "17:30",
    "18:00",
    "18:15",
    "18:30",
    "19:00",
    "19:15",
    "19:30",
    "20:00",
    "20:15",
    "20:30",
    "21:00",
]

estados = [
    "Trabajando",
    "Trabajando",
    "Trabajando",
    "Materiales",
    "Materiales",
    "Almuerzo",
    "Materiales",
]


def build_queue_payload(i, data):
    return {
        "type": "insertFormat_1",
        "data": {
            "spreadsheetName": "sheets",
            "sheetName": f"fundo_{1}",
            "data": {
                "tableName": f"persona_{i%2+1}",
                "tableData": {"capitan": f"persona_{i%2+1}"},
                "items": [
                    {
                        "inicio": horas[i % len(horas)],
                        "estado": estados[i % len(estados)],
                    }
                ],
            },
        },
        "timestamp": int(time.time() * 1000),
    }


def wait_until_ready(api_url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.post(api_url, data=json.dumps({"type": "isReady"}))
        if resp.text.strip() == "true":
            return True
        time.sleep(0.1)
    return False


def send_request(i, data):
    api_url = get_api_url()
    # Esperar a que isReady sea true antes de enviar la petición
    if not wait_until_ready(api_url):
        return {
            "peticion": i + 1,
            "tiempo": 0,
            "status": 503,
            "respuesta": "Timeout esperando isReady",
        }
    payload = build_queue_payload(i, data)
    start = time.time()
    r = requests.post(api_url, data=json.dumps(payload))
    end = time.time()
    return {
        "peticion": i + 1,
        "tiempo": end - start,
        "status": r.status_code,
        "respuesta": r.text.strip(),
    }


def config():
    api_url = get_api_url()
    print("Configurando la app...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD))
    print(f"Respuesta configuración: {resp.text}")

    print("iniciando trigger...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD_INIT_TRIGGER))
    print(f"Respuesta configuración: {resp.text}")


def delete_trigger():
    api_url = get_api_url()
    print("Eliminando trigger...")
    resp = requests.post(api_url, data=json.dumps(CONFIG_PAYLOAD_DELETE_TRIGGER))
    print(f"Respuesta eliminación de trigger: {resp.text}")


def test():
    # Realizar 40 peticiones secuenciales
    print("\n--- PETICIONES SECUENCIALES ---")
    resultados = []
    for i in range(REPETITIONS):
        res = send_request(i, "SECUENCIALES")
        resultados.append(res)
        print(
            f"Petición {res['peticion']}: {res['tiempo']:.4f} segundos, status {res['status']}"
        )

    tiempo_total = sum(r["tiempo"] for r in resultados)
    print(f"\nTiempo total para 40 peticiones: {tiempo_total:.4f} segundos")
    print(f"Tiempo promedio por petición: {tiempo_total/REPETITIONS:.4f} segundos")

    # Realizar 40 peticiones simultáneas
    print("\n--- PETICIONES SIMULTÁNEAS ---")
    resultados_simultaneas = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(send_request, i, "SIMULTÁNEAS") for i in range(REPETITIONS)
        ]
        for future in as_completed(futures):
            res = future.result()
            resultados_simultaneas.append(res)
            print(
                f"Petición {res['peticion']}: {res['tiempo']:.4f} segundos, status {res['status']}"
            )

    tiempo_total_sim = sum(r["tiempo"] for r in resultados_simultaneas)
    print(
        f"\nTiempo total para 40 peticiones simultáneas: {tiempo_total_sim:.4f} segundos"
    )
    print(
        f"Tiempo promedio por petición simultánea: {tiempo_total_sim/REPETITIONS:.4f} segundos"
    )


# def main():
#    if len(sys.argv) > 1:
#        if sys.argv[1] == "config":
#            config()
#        elif sys.argv[1] == "test":
#            test()
#        elif sys.argv[1] == "clear":
#            delete_trigger()
#        elif sys.argv[1] == "clear_cache":
#            clear_cache()
#        elif sys.argv[1] == "test_1min":
#            test_simultaneas_1min()
#        elif sys.argv[1] == "test_seq_1min":
#            test_secuenciales_1min()
#        else:
#            print("Argumento no reconocido. Usa 'test', 'clear', 'clear_cache', 'test_1min' o 'test_seq_1min'.")
#    else:
#        print("Debes proporcionar un argumento: 'test', 'clear', 'clear_cache', 'test_1min' o 'test_seq_1min'.")
#
def main():
    delete_trigger()
    clear_cache()
    config()
    test()
    # test_secuenciales_1min()
    time.sleep(120)
    delete_trigger()


if __name__ == "__main__":
    main()
