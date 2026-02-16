# 🚀 Exemplo Prático: LangGraph - Parte 2

## 🌊 workflow.py - Definição do Grafo

```python
"""
Workflow LangGraph - Orquestração dos Agentes

Este arquivo define o grafo de estados (StateGraph) que coordena
a execução de todos os agentes de forma declarativa.
"""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import Literal

from .models.state import AgentState, create_initial_state
from .agents.consolidator import consolidator_agent
from .agents.detector import detector_agent
from .agents.generator import generator_agent
from .agents.ranker import ranker_agent
from .agents.learning import (
    feedback_agent,
    pattern_analyzer_agent,
    weight_adjuster_agent
)

import logging

logger = logging.getLogger(__name__)


# ============================================================================
# ROUTING FUNCTIONS (Conditional Edges)
# ============================================================================

def should_generate_solutions(state: AgentState) -> Literal["generate", "end"]:
    """
    Decide se deve gerar soluções baseado em conflitos detectados.
    
    Se conflitos > 0 → "generate"
    Se conflitos == 0 → "end"
    """
    conflicts = state.get("conflicts", [])
    
    if len(conflicts) > 0:
        logger.info(f"[ROUTER] {len(conflicts)} conflicts detected, generating solutions")
        return "generate"
    else:
        logger.info("[ROUTER] No conflicts detected, ending workflow")
        return "end"


def should_continue_iteration(state: AgentState) -> Literal["detect", "end"]:
    """
    Decide se deve re-executar detecção com novos pesos.
    
    Continua se:
    - iterations < 3 AND
    - trigger_pattern_analysis == True (novo feedback disponível)
    """
    iterations = state.get("iterations", 0)
    trigger = state.get("trigger_pattern_analysis", False)
    
    if iterations < 3 and trigger:
        logger.info(f"[ROUTER] Iteration {iterations + 1}/3, re-running detection with new weights")
        return "detect"
    else:
        logger.info("[ROUTER] Max iterations reached or no trigger, ending")
        return "end"


# ============================================================================
# WORKFLOW BUILDER
# ============================================================================

def create_workflow() -> StateGraph:
    """
    Cria e compila o workflow LangGraph.
    
    Estrutura do Grafo:
    
    START
      ↓
    consolidate (Agente 1)
      ↓
    detect (Agente 2)
      ↓
    [conditional: tem conflitos?]
      ├─ Sim → generate (Agente 3)
      │          ↓
      │        rank (Agente 4)
      │          ↓
      │        END
      │
      └─ Não → END
    
    
    Loop de Feedback (separado):
    
    feedback (Agente 6)
      ↓
    analyze_patterns (Agente 7)
      ↓
    adjust_weights (Agente 8)
      ↓
    [conditional: continuar iterando?]
      ├─ Sim → detect (volta pro Agente 2)
      └─ Não → END
    """
    
    # Criar grafo
    workflow = StateGraph(AgentState)
    
    # ========================================================================
    # ADICIONAR NÓS (Agentes)
    # ========================================================================
    
    workflow.add_node("consolidate", consolidator_agent)
    workflow.add_node("detect", detector_agent)
    workflow.add_node("generate", generator_agent)
    workflow.add_node("rank", ranker_agent)
    
    # Agentes de feedback (executados separadamente)
    workflow.add_node("feedback", feedback_agent)
    workflow.add_node("analyze_patterns", pattern_analyzer_agent)
    workflow.add_node("adjust_weights", weight_adjuster_agent)
    
    # ========================================================================
    # DEFINIR ENTRY POINT
    # ========================================================================
    
    workflow.set_entry_point("consolidate")
    
    # ========================================================================
    # ADICIONAR EDGES (Fluxo)
    # ========================================================================
    
    # Pipeline principal (sequencial)
    workflow.add_edge("consolidate", "detect")
    
    # Conditional: se tem conflitos, gerar soluções
    workflow.add_conditional_edges(
        "detect",
        should_generate_solutions,
        {
            "generate": "generate",
            "end": END
        }
    )
    
    workflow.add_edge("generate", "rank")
    workflow.add_edge("rank", END)
    
    # ========================================================================
    # FEEDBACK LOOP (executado via invoke separado)
    # ========================================================================
    
    workflow.add_edge("feedback", "analyze_patterns")
    workflow.add_edge("analyze_patterns", "adjust_weights")
    
    # Conditional: re-executar detecção com novos pesos?
    workflow.add_conditional_edges(
        "adjust_weights",
        should_continue_iteration,
        {
            "detect": "detect",  # Loop de volta!
            "end": END
        }
    )
    
    return workflow


def compile_workflow(checkpointer=None) -> any:
    """
    Compila o workflow para execução.
    
    Args:
        checkpointer: Opcional. MemorySaver para persistência de estado.
    
    Returns:
        App compilado pronto para .invoke() ou .ainvoke()
    """
    workflow = create_workflow()
    
    # Compilar com checkpointing (persistência)
    app = workflow.compile(
        checkpointer=checkpointer,
        # interrupt_before=["rank"]  # Pausar antes de rankear (human-in-the-loop)
    )
    
    logger.info("[WORKFLOW] Compiled successfully")
    
    return app


# ============================================================================
# HELPER: EXECUTAR WORKFLOW
# ============================================================================

async def run_analysis(
    project_ids: list,
    start_date,
    end_date,
    callback_url=None,
    execution_id=None
) -> AgentState:
    """
    Executa análise completa de recursos.
    
    Args:
        project_ids: Lista de IDs de projetos
        start_date: Data de início
        end_date: Data de fim
        callback_url: URL para callback (opcional)
        execution_id: ID de execução (opcional, gera automaticamente)
    
    Returns:
        Estado final após execução completa
    """
    from uuid import uuid4
    from .utils.supabase_client import fetch_project_data
    
    # Gerar execution_id se não fornecido
    if not execution_id:
        execution_id = str(uuid4())
    
    # Criar estado inicial
    initial_state = create_initial_state(
        execution_id=execution_id,
        project_ids=project_ids,
        start_date=start_date,
        end_date=end_date,
        callback_url=callback_url
    )
    
    # Buscar dados do Supabase
    logger.info(f"[WORKFLOW] Fetching project data for execution {execution_id}")
    project_data = await fetch_project_data(project_ids, start_date, end_date)
    
    initial_state["projects"] = project_data["projects"]
    initial_state["resources"] = project_data["resources"]
    initial_state["assignments"] = project_data["assignments"]
    
    # Compilar workflow com checkpointing
    checkpointer = MemorySaver()
    app = compile_workflow(checkpointer=checkpointer)
    
    # Executar workflow
    logger.info(f"[WORKFLOW] Starting execution {execution_id}")
    
    final_state = await app.ainvoke(
        initial_state,
        config={
            "configurable": {
                "thread_id": execution_id
            }
        }
    )
    
    logger.info(
        f"[WORKFLOW] Execution {execution_id} completed. "
        f"Stage: {final_state['stage']}, "
        f"Conflicts: {final_state.get('total_conflicts', 0)}, "
        f"Solutions: {final_state.get('total_solutions', 0)}"
    )
    
    return final_state


# ============================================================================
# EXEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    import asyncio
    from datetime import date
    
    async def main():
        # Executar análise
        result = await run_analysis(
            project_ids=["proj-1", "proj-2"],
            start_date=date(2025, 2, 1),
            end_date=date(2025, 2, 28)
        )
        
        print(f"\n✅ Análise concluída!")
        print(f"   Conflitos detectados: {result['total_conflicts']}")
        print(f"   Soluções geradas: {result['total_solutions']}")
        
        if result.get('ranked_solutions'):
            print(f"\n🏆 Top 3 Soluções:")
            for i, sol in enumerate(result['ranked_solutions'][:3], 1):
                print(f"   {i}. {sol.strategy} (score: {sol.rank_score:.3f})")
                print(f"      {sol.description}")
    
    asyncio.run(main())
```

---

## 🌐 api.py - FastAPI Endpoints

```python
"""
FastAPI Application - REST API para LangGraph Service

Endpoints:
- POST /analyze - Iniciar análise de recursos
- POST /feedback - Submeter feedback e continuar execução
- GET /status/{execution_id} - Consultar status de execução
- POST /simulate - Simular cenário hipotético
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime
from uuid import uuid4
import logging

from .workflow import run_analysis, compile_workflow
from .models.state import AgentState, Feedback
from .utils.supabase_client import save_results, notify_callback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LangGraph Resource Manager",
    description="Multi-agent system for construction resource management",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class AnalysisRequest(BaseModel):
    """Request para iniciar análise"""
    project_ids: List[str] = Field(..., min_items=1)
    start_date: date
    end_date: date
    callback_url: Optional[str] = None


class AnalysisResponse(BaseModel):
    """Response da análise"""
    success: bool
    execution_id: str
    message: str
    total_conflicts: int
    total_solutions: int
    stage: str


class FeedbackRequest(BaseModel):
    """Request para submeter feedback"""
    execution_id: str
    solution_id: str
    accepted: bool
    manager_rating: int = Field(ge=1, le=5)
    implementation_result: Literal["success", "partial", "failed"]
    context: dict = {}


class FeedbackResponse(BaseModel):
    """Response do feedback"""
    success: bool
    message: str
    continued: bool


class StatusResponse(BaseModel):
    """Response de status"""
    execution_id: str
    stage: str
    total_conflicts: Optional[int]
    total_solutions: Optional[int]
    completed_at: Optional[datetime]


class SimulationRequest(BaseModel):
    """Request para simulação de cenário"""
    scenario_type: Literal["prioritize_project", "add_resource", "delay_project"]
    baseline_conflicts: List[dict]
    params: dict


class SimulationResponse(BaseModel):
    """Response da simulação"""
    scenario_type: str
    improvement_score: float
    recommendation: str
    simulated_metrics: dict
    delta: dict


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "LangGraph Resource Manager",
        "version": "1.0.0"
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resources(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Inicia análise de recursos para projetos especificados.
    
    Fluxo:
    1. Valida input
    2. Gera execution_id
    3. Executa workflow LangGraph (assíncrono)
    4. Salva resultados no Supabase
    5. Envia callback (se fornecido)
    6. Retorna execution_id
    
    Exemplo:
        POST /analyze
        {
          "project_ids": ["proj-1", "proj-2"],
          "start_date": "2025-02-01",
          "end_date": "2025-02-28",
          "callback_url": "https://frontend.com/api/callback"
        }
    """
    try:
        # Gerar execution ID
        execution_id = str(uuid4())
        
        logger.info(
            f"[API] Starting analysis {execution_id} for "
            f"{len(request.project_ids)} projects"
        )
        
        # Executar análise (síncrono por enquanto, pode ser background task)
        result = await run_analysis(
            project_ids=request.project_ids,
            start_date=request.start_date,
            end_date=request.end_date,
            callback_url=request.callback_url,
            execution_id=execution_id
        )
        
        # Salvar resultados no Supabase
        await save_results(result)
        
        # Enviar callback se fornecido
        if request.callback_url:
            background_tasks.add_task(
                notify_callback,
                request.callback_url,
                execution_id,
                result
            )
        
        return AnalysisResponse(
            success=True,
            execution_id=execution_id,
            message="Analysis completed successfully",
            total_conflicts=result.get("total_conflicts", 0),
            total_solutions=result.get("total_solutions", 0),
            stage=result.get("stage", "unknown")
        )
        
    except Exception as e:
        logger.error(f"[API] Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """
    Submete feedback sobre uma solução.
    
    Se a execução foi pausada (human-in-the-loop), continua a partir
    do checkpoint salvo.
    
    Fluxo:
    1. Salva feedback no Supabase
    2. Carrega estado salvo (checkpoint)
    3. Adiciona feedback ao estado
    4. Continua execução (feedback → patterns → weights → detect)
    5. Retorna resultado
    
    Exemplo:
        POST /feedback
        {
          "execution_id": "550e8400...",
          "solution_id": "sol-001",
          "accepted": true,
          "manager_rating": 4,
          "implementation_result": "success",
          "context": {"project_priority": "high"}
        }
    """
    try:
        logger.info(
            f"[API] Received feedback for solution {request.solution_id} "
            f"(execution {request.execution_id})"
        )
        
        # Criar objeto Feedback
        feedback = Feedback(
            solution_id=request.solution_id,
            accepted=request.accepted,
            manager_rating=request.manager_rating,
            implementation_result=request.implementation_result,
            effectiveness_score=calculate_effectiveness(
                request.accepted,
                request.manager_rating,
                request.implementation_result
            ),
            context=request.context
        )
        
        # Salvar feedback no Supabase
        from .utils.supabase_client import save_feedback
        await save_feedback(feedback)
        
        # Carregar estado salvo (checkpoint)
        from langgraph.checkpoint.memory import MemorySaver
        checkpointer = MemorySaver()
        app_graph = compile_workflow(checkpointer=checkpointer)
        
        # TODO: Implementar load_checkpoint
        # state = load_checkpoint(request.execution_id)
        
        # Por enquanto, apenas salvar feedback
        # Futura implementação: continuar execução com estado carregado
        
        return FeedbackResponse(
            success=True,
            message="Feedback submitted successfully",
            continued=False  # Será True quando implementar continuação
        )
        
    except Exception as e:
        logger.error(f"[API] Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{execution_id}", response_model=StatusResponse)
async def get_status(execution_id: str):
    """
    Consulta status de uma execução.
    
    Retorna informações sobre o estado atual da análise.
    """
    try:
        # TODO: Implementar consulta ao checkpoint/database
        # Por enquanto, retorno mock
        
        return StatusResponse(
            execution_id=execution_id,
            stage="completed",
            total_conflicts=None,
            total_solutions=None,
            completed_at=None
        )
        
    except Exception as e:
        logger.error(f"[API] Error getting status: {str(e)}")
        raise HTTPException(status_code=404, detail="Execution not found")


@app.post("/simulate", response_model=SimulationResponse)
async def simulate_scenario(request: SimulationRequest):
    """
    Simula impacto de um cenário hipotético.
    
    Cenários disponíveis:
    - prioritize_project: Priorizar um projeto específico
    - add_resource: Adicionar novo recurso
    - delay_project: Postergar um projeto
    
    Exemplo:
        POST /simulate
        {
          "scenario_type": "add_resource",
          "baseline_conflicts": [...],
          "params": {
            "resource_role": "Engenheiro Civil",
            "availability": 0.8
          }
        }
    """
    try:
        from .agents.simulator import simulate_scenario_logic
        
        logger.info(f"[API] Simulating scenario: {request.scenario_type}")
        
        result = simulate_scenario_logic(
            scenario_type=request.scenario_type,
            baseline_conflicts=request.baseline_conflicts,
            params=request.params
        )
        
        return SimulationResponse(**result)
        
    except Exception as e:
        logger.error(f"[API] Error in simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_effectiveness(
    accepted: bool,
    rating: int,
    result: str
) -> float:
    """Calcula effectiveness score baseado em feedback"""
    if accepted and result == "success":
        return rating / 5.0
    elif accepted and result == "partial":
        return (rating / 5.0) * 0.7
    else:
        return 0.0


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Inicialização do serviço"""
    logger.info("[API] LangGraph Resource Manager starting up...")
    # Inicializar conexões, cache, etc.


@app.on_event("shutdown")
async def shutdown_event():
    """Encerramento do serviço"""
    logger.info("[API] LangGraph Resource Manager shutting down...")
    # Fechar conexões, cleanup, etc.


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Development only
        log_level="info"
    )
```

---

## 🧪 tests/test_workflow.py - Testes de Integração

```python
"""
Testes de integração do workflow completo.

Testa o fluxo end-to-end:
- Consolidação → Detecção → Geração → Rankeamento
"""
import pytest
from datetime import date
from uuid import uuid4

from src.workflow import compile_workflow
from src.models.state import (
    create_initial_state,
    Project,
    Resource,
    Assignment
)


@pytest.mark.asyncio
async def test_full_workflow():
    """
    Teste do workflow completo.
    
    Setup:
    - 2 projetos
    - 1 recurso
    - 2 assignments sobrepostos (conflito)
    
    Expectativa:
    - Detecta conflito
    - Gera soluções
    - Rankeia soluções
    """
    # Mock data
    projects = [
        Project(
            id="proj-1",
            name="Projeto Alpha",
            start_date=date(2025, 2, 1),
            end_date=date(2025, 3, 31),
            priority=1,
            status="active"
        ),
        Project(
            id="proj-2",
            name="Projeto Beta",
            start_date=date(2025, 2, 15),
            end_date=date(2025, 4, 30),
            priority=2,
            status="active"
        ),
    ]
    
    resources = [
        Resource(
            id="res-1",
            name="João Silva",
            email="joao@company.com",
            role="Engenheiro",
            max_capacity_hours_per_day=8.0
        )
    ]
    
    # Assignments sobrepostos: 15/02 a 28/02 = conflito
    assignments = [
        Assignment(
            id="asn-1",
            project_id="proj-1",
            resource_id="res-1",
            task_id="task-1",
            task_name="Fundação",
            start_date=date(2025, 2, 1),
            end_date=date(2025, 2, 28),
            allocated_units=1.0,
            total_work_hours=160.0  # 20 dias úteis * 8h = 160h
        ),
        Assignment(
            id="asn-2",
            project_id="proj-2",
            resource_id="res-1",
            task_id="task-2",
            task_name="Planejamento",
            start_date=date(2025, 2, 15),
            end_date=date(2025, 3, 15),
            allocated_units=1.0,
            total_work_hours=160.0  # 20 dias úteis * 8h = 160h
        ),
    ]
    
    # Criar estado inicial
    initial_state = create_initial_state(
        execution_id=str(uuid4()),
        project_ids=["proj-1", "proj-2"],
        start_date=date(2025, 2, 1),
        end_date=date(2025, 3, 31)
    )
    
    initial_state["projects"] = projects
    initial_state["resources"] = resources
    initial_state["assignments"] = assignments
    
    # Compilar workflow
    app = compile_workflow()
    
    # Executar
    final_state = await app.ainvoke(initial_state)
    
    # Assertions
    assert final_state["stage"] == "ranking_complete"
    
    # Deve ter detectado conflitos (15/02 a 28/02 = 10 dias úteis)
    assert final_state["total_conflicts"] > 0
    
    # Deve ter gerado soluções
    assert final_state["total_solutions"] > 0
    
    # Deve ter rankeado soluções
    assert len(final_state["ranked_solutions"]) > 0
    
    # Top solução deve ter score > 0
    top_solution = final_state["ranked_solutions"][0]
    assert top_solution.rank_score > 0
    
    print(f"✅ Workflow test passed!")
    print(f"   Conflicts: {final_state['total_conflicts']}")
    print(f"   Solutions: {final_state['total_solutions']}")
    print(f"   Top solution: {top_solution.strategy} (score: {top_solution.rank_score:.3f})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
```

---

## 📝 README.md

```markdown
# LangGraph Resource Manager

Sistema multi-agente para gestão de recursos de projetos de construção.

## 🚀 Quick Start

### 1. Instalação

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configuração

Criar arquivo `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Executar Testes

```bash
# Todos os testes
pytest

# Teste específico
pytest tests/test_workflow.py -v -s
```

### 4. Rodar API

```bash
# Development
uvicorn src.api:app --reload --port 8000

# Production
gunicorn src.api:app -w 4 -k uvicorn.workers.UvicornWorker
```

### 5. Usar API

```bash
# Iniciar análise
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "project_ids": ["proj-1", "proj-2"],
    "start_date": "2025-02-01",
    "end_date": "2025-02-28"
  }'

# Response:
# {
#   "success": true,
#   "execution_id": "550e8400...",
#   "total_conflicts": 47,
#   "total_solutions": 23,
#   "stage": "ranking_complete"
# }
```

## 📊 Arquitetura

```
FastAPI (REST API)
    ↓
LangGraph (Workflow Orchestration)
    ├─ Consolidator Agent
    ├─ Detector Agent
    ├─ Generator Agent (Claude)
    └─ Ranker Agent
    
Feedback Loop (Continuous Learning):
    Feedback → Pattern Analysis → Weight Adjustment → Re-rank
```

## 🧪 Testabilidade

Cada agente é uma função pura testável:

```python
def test_detector_agent():
    state = {...}
    result = detector_agent(state)
    assert result["total_conflicts"] == expected
```

## 📈 Observabilidade

LangSmith integration:

```python
from langsmith import trace

@trace
def detector_agent(state):
    # Automatically logs input, output, duration
    ...
```

## 🔄 Deploy

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### n8n Integration

n8n workflow simplificado:

```
Webhook → HTTP Request (POST /analyze) → Wait → Save Results
```

## 📚 Documentação

- API Docs: http://localhost:8000/docs
- LangGraph: https://langchain-ai.github.io/langgraph/
- Anthropic: https://docs.anthropic.com/
```

---

**Fim do Exemplo!** 🎉

Este exemplo mostra:
✅ Agentes modulares e testáveis
✅ Estado tipado com TypedDict
✅ Workflow declarativo com LangGraph
✅ API REST com FastAPI
✅ Testes unitários e de integração
✅ Logging e observabilidade
✅ Deploy pronto para produção
