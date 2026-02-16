# 🚀 LangGraph Resource Manager

Sistema multi-agente para gestão de recursos de projetos de construção civil.

## 📁 Estrutura do Projeto

```
langgraph-resource-manager/
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── consolidator.py      # Agente 1: Consolidador
│   │   ├── detector.py          # Agente 2: Detector de Conflitos
│   │   ├── generator.py         # Agente 3: Gerador de Soluções (Claude)
│   │   ├── ranker.py            # Agente 4: Rankeador
│   │   └── learning.py          # Agentes 6-8: Aprendizado
│   ├── models/
│   │   ├── __init__.py
│   │   └── state.py             # Estado tipado (TypedDict + Pydantic)
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── dates.py             # Funções de data
│   │   └── supabase_client.py   # Cliente Supabase
│   ├── workflow.py              # LangGraph workflow
│   └── api.py                   # FastAPI endpoints
├── tests/
│   ├── __init__.py
│   ├── test_consolidator.py
│   ├── test_detector.py
│   ├── test_ranker.py
│   └── test_workflow.py
├── .env.example                 # Variáveis de ambiente (template)
├── requirements.txt             # Dependências Python
├── Dockerfile                   # Container Docker
└── README.md                    # Este arquivo
```

## 🎯 Funcionalidades

### Pipeline Principal
1. **Consolidador** → Normaliza recursos duplicados
2. **Detector** → Identifica superalocações (>8h/dia)
3. **Gerador (Claude)** → Cria 2-3 soluções por conflito
4. **Rankeador** → Ordena soluções por viabilidade

### Loop de Aprendizado
6. **Feedback Collector** → Registra aceitação/rejeição
7. **Pattern Analyzer** → Identifica preferências do gestor
8. **Weight Adjuster** → Ajusta pesos automaticamente

## 🚀 Quick Start

### 1. Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd langgraph-resource-manager

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configuração

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

Você precisará de:
- **Anthropic API Key**: https://console.anthropic.com/
- **Supabase Project**: https://supabase.com/

### 3. Banco de Dados

Execute os scripts SQL no Supabase (veja documentação completa):

```sql
-- Criar tabelas
CREATE TABLE projects (...);
CREATE TABLE resources (...);
CREATE TABLE assignments (...);
-- etc.
```

### 4. Executar Testes

```bash
# Todos os testes
pytest -v

# Teste específico
pytest tests/test_detector.py -v -s

# Com cobertura
pytest --cov=src tests/
```

### 5. Rodar API

```bash
# Desenvolvimento (com hot-reload)
uvicorn src.api:app --reload --port 8000

# Produção
gunicorn src.api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

API estará disponível em: http://localhost:8000

Documentação interativa: http://localhost:8000/docs

## 📡 Endpoints da API

### POST /analyze
Inicia análise de recursos para projetos.

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "project_ids": ["proj-1", "proj-2"],
    "start_date": "2025-02-01",
    "end_date": "2025-02-28",
    "callback_url": "https://your-frontend.com/api/callback"
  }'
```

**Response:**
```json
{
  "success": true,
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_conflicts": 47,
  "total_solutions": 23,
  "stage": "ranking_complete"
}
```

### POST /feedback
Submete feedback sobre uma solução.

```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "execution_id": "550e8400...",
    "solution_id": "sol-001",
    "accepted": true,
    "manager_rating": 4,
    "implementation_result": "success",
    "context": {"project_priority": "high"}
  }'
```

### GET /status/{execution_id}
Consulta status de uma execução.

```bash
curl http://localhost:8000/status/550e8400-e29b-41d4-a716-446655440000
```

### POST /simulate
Simula impacto de cenário hipotético.

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_type": "add_resource",
    "baseline_conflicts": [...],
    "params": {
      "resource_role": "Engenheiro Civil",
      "availability": 0.8
    }
  }'
```

## 🧪 Testes

Cada agente tem testes unitários:

```python
def test_detector_agent():
    """Testa detecção de conflitos"""
    state = create_initial_state(...)
    state["consolidated_resources"] = [mock_resource]
    
    result = detector_agent(state)
    
    assert result["total_conflicts"] == 3
    assert result["conflicts"][0].severity == "CRITICAL"
```

Teste de integração completo:

```python
@pytest.mark.asyncio
async def test_full_workflow():
    """Testa pipeline completo"""
    app = compile_workflow()
    result = await app.ainvoke(initial_state)
    
    assert result["stage"] == "ranking_complete"
    assert len(result["ranked_solutions"]) > 0
```

## 📊 Arquitetura

### LangGraph StateGraph

```
START
  ↓
consolidate (Agente 1)
  ↓
detect (Agente 2)
  ↓
[tem conflitos?]
  ├─ Sim → generate (Agente 3 - Claude)
  │          ↓
  │        rank (Agente 4)
  │          ↓
  │        END
  └─ Não → END
```

### Feedback Loop (Aprendizado Contínuo)

```
feedback (Agente 6)
  ↓
analyze_patterns (Agente 7)
  ↓
adjust_weights (Agente 8)
  ↓
[continuar iterando?]
  ├─ Sim → detect (volta para Agente 2)
  └─ Não → END
```

## 🔧 Desenvolvimento

### Adicionar Novo Agente

1. Criar arquivo em `src/agents/new_agent.py`:
```python
from ..models.state import AgentState

def new_agent(state: AgentState) -> AgentState:
    # Sua lógica aqui
    return {**state, "new_field": value}
```

2. Adicionar ao workflow em `src/workflow.py`:
```python
workflow.add_node("new_agent", new_agent)
workflow.add_edge("previous_agent", "new_agent")
```

3. Criar teste em `tests/test_new_agent.py`:
```python
def test_new_agent():
    state = {...}
    result = new_agent(state)
    assert result["new_field"] == expected
```

### Debug

```python
# Adicionar logging
import logging
logger = logging.getLogger(__name__)
logger.info(f"Processing {len(items)} items")

# Usar breakpoints
import pdb; pdb.set_trace()

# Inspecionar estado em cada nó
workflow.add_node("debug", lambda s: print(s) or s)
```

## 🐳 Docker

### Build

```bash
docker build -t langgraph-resource-manager .
```

### Run

```bash
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e SUPABASE_URL=https://... \
  langgraph-resource-manager
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
```

## 🔐 Segurança

- Use variáveis de ambiente para credenciais (nunca commite .env)
- Configure CORS adequadamente em produção
- Use HTTPS em produção
- Implemente rate limiting
- Valide todos os inputs com Pydantic

## 📈 Observabilidade

### LangSmith Integration

```python
from langsmith import trace

@trace
def detector_agent(state: AgentState):
    # Automaticamente loga input, output, tempo de execução
    ...
```

Dashboard: https://smith.langchain.com/

### Logging

Todos os agentes logam ações importantes:

```
[CONSOLIDATOR] Consolidados 38 recursos únicos
[DETECTOR] Detectados 47 conflitos (12 CRITICAL)
[GENERATOR] Geradas 23 soluções em 8.2s
[RANKER] Top solução: REDISTRIBUTE_WITH_SLACK (score: 0.875)
```

## 🚢 Deploy

### Railway / Render

```bash
# Adicionar Procfile
web: uvicorn src.api:app --host 0.0.0.0 --port $PORT
```

### AWS Lambda

Use Mangum para adaptar FastAPI:

```python
from mangum import Mangum
handler = Mangum(app)
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langgraph-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: langgraph-resource-manager:latest
        ports:
        - containerPort: 8000
```

## 🤝 Integração com n8n

Workflow n8n simplificado:

```
┌─────────────────┐
│ Webhook Trigger │
└────────┬────────┘
         ↓
┌─────────────────┐
│  HTTP Request   │
│ POST /analyze   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Wait for Webhook│ ← Callback do LangGraph
└────────┬────────┘
         ↓
┌─────────────────┐
│ Save to Supabase│
└────────┬────────┘
         ↓
┌─────────────────┐
│  Notifications  │
│ Teams/WhatsApp  │
└─────────────────┘
```

## 📚 Documentação

- **LangGraph**: https://langchain-ai.github.io/langgraph/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **Anthropic**: https://docs.anthropic.com/

## 🆘 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'langgraph'"

```bash
pip install langgraph
```

### Erro: "ANTHROPIC_API_KEY not found"

Verifique se o arquivo `.env` existe e contém a chave:

```bash
cat .env
# Deve mostrar: ANTHROPIC_API_KEY=sk-ant-...
```

### Testes falhando

```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall

# Limpar cache
pytest --cache-clear
```

## 📝 Licença

MIT License - veja LICENSE para detalhes

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -am 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido com ❤️ usando LangGraph**
