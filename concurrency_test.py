import requests
import concurrent.futures
from datetime import datetime, timedelta

# Defina a URL do endpoint de criação de agendamento manual
URL = "http://localhost:8000/api/v1/appointments/create_manual/"

# Precisamos do UUID de um serviço válido. 
# ATENÇÃO: Substitua este UUID por um UUID real do seu banco (veja na tela de Serviços)
SERVICE_ID = "COLOQUE_AQUI_O_UUID_DO_SERVICO" 

# Mesma data e horário para forçar a concorrência
START_TIME = (datetime.now() + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat()

def make_request(name, phone):
    payload = {
        "client_name": name,
        "client_phone": phone,
        "service_id": SERVICE_ID,
        "start_time": START_TIME
    }
    
    # Credenciais de teste
    auth = ("admin", "admin")
    
    print(f"[{name}] Tentando agendar para {START_TIME}...")
    try:
        response = requests.post(URL, json=payload, auth=auth)
        if response.status_code == 201:
            print(f"✅ [{name}] Sucesso! Agendamento criado. ID: {response.json().get('id')}")
        else:
            print(f"❌ [{name}] Falha! Status: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ [{name}] Erro de requisição: {e}")

def main():
    if SERVICE_ID == "COLOQUE_AQUI_O_UUID_DO_SERVICO":
        print("ALERTA: Você precisa editar o arquivo 'concurrency_test.py' e colocar um SERVICE_ID válido do banco de dados (pegue na aba Serviços)!")
        return

    print("Iniciando teste de concorrência com 2 threads disparando simultaneamente...")
    
    # Executa ambas as requisições ao mesmo tempo em paralelo
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        executor.submit(make_request, "Cliente Concorrente A", "5511999999991")
        executor.submit(make_request, "Cliente Concorrente B", "5511999999992")

if __name__ == "__main__":
    main()
