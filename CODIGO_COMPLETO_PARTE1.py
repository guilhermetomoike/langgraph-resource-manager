# 🚀 Exemplo Prático: Sistema de Agentes com LangGraph

## 📁 Estrutura do Projeto

```
langgraph-resource-manager/
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── consolidator.py      # Agente 1
│   │   ├── detector.py          # Agente 2
│   │   ├── generator.py         # Agente 3 (Claude)
│   │   ├── ranker.py            # Agente 4
│   │   └── learning.py          # Agentes 6, 7, 8
│   ├── models/
│   │   ├── __init__.py
│   │   └── state.py             # Estado tipado
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── dates.py
│   │   └── scoring.py
│   ├── workflow.py              # LangGraph workflow
│   └── api.py                   # FastAPI endpoints
├── tests/
│   ├── test_consolidator.py
│   ├── test_detector.py
│   └── test_ranker.py
├── requirements.txt
├── .env
└── README.md
```

---

## 📦 requirements.txt

```txt
fastapi==0.109.0
uvicorn==0.27.0
langgraph==0.0.43
langchain==0.1.6
langchain-anthropic==0.1.4
pydantic==2.5.3
httpx==0.26.0
python-dotenv==1.0.0
supabase==2.3.4
pytest==7.4.4
pytest-asyncio==0.23.3
```

---

## 🎯 models/state.py - Estado Tipado

```python
"""
Estado compartilhado entre todos os agentes.
TypedDict garante type safety e validação.
"""
from typing import TypedDict, List, Dict, Optional, Literal
from datetime import date, datetime
from pydantic import BaseModel, Field


# ============================================================================
# MODELS PYDANTIC (Validação forte)
# ============================================================================

class Project(BaseModel):
    """Modelo de projeto"""
    id: str
    name: str
    start_date: date
    end_date: date
    priority: Literal[1, 2, 3]
    status: Literal["active", "planning", "completed", "on-hold"]


class Resource(BaseModel):
    """Modelo de recurso"""
    id: str
    name: str
    email: str
    role: str
    max_capacity_hours_per_day: float = 8.0
    department: Optional[str] = None
    skill_tags: List[str] = []


class Assignment(BaseModel):
    """Modelo de atribuição"""
    id: str
    project_id: str
    resource_id: str
    task_id: str
    task_name: str
    start_date: date
    end_date: date
    allocated_units: float  # 0-1 (0.5 = 50%)
    total_work_hours: float
    is_on_critical_path: bool = False
    slack_days: int = 0


class ConsolidatedResource(BaseModel):
    """Recurso consolidado com todas suas atribuições"""
    id: str
    name: str
    email: str
    role: str
    capacity: float
    department: Optional[str] = None
    skills: List[str] = []
    assignments: List[Assignment] = []


class TaskInvolvement(BaseModel):
    """Tarefa envolvida em um conflito"""
    project_id: str
    task_id: str
    task_name: str
    hours: float


class Conflict(BaseModel):
    """Conflito de superalocação"""
    resource_id: str
    resource_name: str
    conflict_date: date
    allocated_hours: float
    capacity_hours: float
    overallocation_hours: float
    overallocation_percent: float
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    tasks_involved: List[TaskInvolvement]
    projects_count: int


class ImpactAnalysis(BaseModel):
    """Análise de impacto de uma solução"""
    affected_tasks: List[str]
    days_impact: int
    resources_needed: int


class Solution(BaseModel):
    """Solução gerada pela IA"""
    conflict_id: str
    strategy: Literal[
        "REDISTRIBUTE_WITH_SLACK",
        "MOVE_NONCRITICAL",
        "EXTEND_DURATION",
        "ADD_RESOURCE"
    ]
    description: str = Field(..., max_length=150)
    reasoning: str
    feasibility_score: float = Field(ge=0.0, le=1.0)
    complexity_score: float = Field(ge=0.0, le=1.0)
    preserves_deadline: bool
    impact_analysis: ImpactAnalysis


class RankedSolution(Solution):
    """Solução com score de ranking"""
    rank_score: float = Field(ge=0.0, le=1.0)
    weights: Dict[str, float]


class Weights(BaseModel):
    """Pesos para ranqueamento"""
    feasibility: float = 0.30
    impact: float = 0.25
    deadline: float = 0.25
    simplicity: float = 0.20


class Feedback(BaseModel):
    """Feedback sobre uma solução"""
    solution_id: str
    accepted: bool
    manager_rating: int = Field(ge=1, le=5)
    implementation_result: Literal["success", "partial", "failed"]
    effectiveness_score: float = Field(ge=0.0, le=1.0)
    context: Dict[str, any]


# ============================================================================
# AGENT STATE (Estado compartilhado no grafo)
# ============================================================================

class AgentState(TypedDict, total=False):
    """
    Estado compartilhado entre todos os agentes.
    
    Todos os agentes leem e modificam este estado.
    LangGraph garante sincronização automática.
    """
    # Identificação
    execution_id: str
    stage: str
    iterations: int
    
    # Input inicial
    project_ids: List[str]
    start_date: date
    end_date: date
    callback_url: Optional[str]
    
    # Dados carregados
    projects: List[Project]
    resources: List[Resource]
    assignments: List[Assignment]
    
    # Agente 1: Consolidador
    consolidated_resources: List[ConsolidatedResource]
    
    # Agente 2: Detector
    conflicts: List[Conflict]
    total_conflicts: int
    critical_conflicts: int
    
    # Agente 3: Gerador
    solutions: List[Solution]
    total_solutions: int
    
    # Agente 4: Ranker
    weights: Weights
    ranked_solutions: List[RankedSolution]
    
    # Agentes de Aprendizado
    feedback_history: List[Feedback]
    patterns: Dict[str, any]
    
    # Controle de fluxo
    should_continue: bool
    trigger_pattern_analysis: bool
    
    # Metadata
    timestamps: Dict[str, datetime]
    errors: List[str]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_initial_state(
    execution_id: str,
    project_ids: List[str],
    start_date: date,
    end_date: date,
    callback_url: Optional[str] = None
) -> AgentState:
    """Cria estado inicial para nova execução"""
    return AgentState(
        execution_id=execution_id,
        stage="initialization",
        iterations=0,
        project_ids=project_ids,
        start_date=start_date,
        end_date=end_date,
        callback_url=callback_url,
        consolidated_resources=[],
        conflicts=[],
        solutions=[],
        ranked_solutions=[],
        weights=Weights(),
        feedback_history=[],
        patterns={},
        should_continue=True,
        trigger_pattern_analysis=False,
        timestamps={},
        errors=[]
    )
```

---

## 🔧 agents/consolidator.py - Agente 1

```python
"""
Agente 1: Consolidador de Recursos

Responsabilidade:
- Normalizar recursos duplicados (mesmo email)
- Agregar todas as atribuições por pessoa
- Limpar e validar dados
"""
from typing import Dict
from ..models.state import AgentState, ConsolidatedResource, Assignment
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def consolidator_agent(state: AgentState) -> AgentState:
    """
    Consolida recursos de múltiplos projetos.
    
    Algoritmo:
    1. Cria mapa por email normalizado
    2. Agrupa todas as atribuições do mesmo recurso
    3. Remove duplicatas
    """
    start_time = datetime.now()
    logger.info(
        f"[CONSOLIDATOR] Starting consolidation for execution {state['execution_id']}"
    )
    
    resources = state.get("resources", [])
    assignments = state.get("assignments", [])
    
    # Mapa: email → ConsolidatedResource
    resource_map: Dict[str, ConsolidatedResource] = {}
    
    # Primeiro, criar mapa de recursos únicos
    for resource in resources:
        email_key = resource.email.lower().strip()
        
        if email_key not in resource_map:
            resource_map[email_key] = ConsolidatedResource(
                id=resource.id,
                name=resource.name,
                email=email_key,
                role=resource.role,
                capacity=resource.max_capacity_hours_per_day,
                department=resource.department,
                skills=resource.skill_tags,
                assignments=[]
            )
    
    # Segundo, agregar assignments por recurso
    for assignment in assignments:
        # Encontrar recurso correspondente
        resource = next(
            (r for r in resources if r.id == assignment.resource_id),
            None
        )
        
        if not resource:
            logger.warning(
                f"Assignment {assignment.id} references unknown resource {assignment.resource_id}"
            )
            continue
        
        email_key = resource.email.lower().strip()
        
        if email_key in resource_map:
            resource_map[email_key].assignments.append(assignment)
    
    # Converter mapa para lista
    consolidated_resources = list(resource_map.values())
    
    # Estatísticas
    total_assignments = sum(
        len(r.assignments) for r in consolidated_resources
    )
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    logger.info(
        f"[CONSOLIDATOR] Consolidated {len(resources)} resources into "
        f"{len(consolidated_resources)} unique resources with "
        f"{total_assignments} assignments in {elapsed:.2f}s"
    )
    
    # Atualizar estado
    return {
        **state,
        "consolidated_resources": consolidated_resources,
        "stage": "consolidation_complete",
        "timestamps": {
            **state.get("timestamps", {}),
            "consolidation_complete": datetime.now()
        }
    }


# ============================================================================
# TESTES UNITÁRIOS
# ============================================================================

def test_consolidator_agent():
    """Teste do agente consolidador"""
    from ..models.state import Resource, Assignment, create_initial_state
    from datetime import date
    
    # Mock data
    resources = [
        Resource(
            id="res-1",
            name="João Silva",
            email="joao.silva@company.com",
            role="Engenheiro",
            max_capacity_hours_per_day=8.0
        ),
        Resource(
            id="res-2",
            name="João Silva",  # Duplicado!
            email="JOAO.SILVA@company.com",  # Mesmo email, case diferente
            role="Engenheiro",
            max_capacity_hours_per_day=8.0
        ),
    ]
    
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
            total_work_hours=160.0
        ),
        Assignment(
            id="asn-2",
            project_id="proj-2",
            resource_id="res-2",  # Mesmo recurso, ID diferente
            task_id="task-2",
            task_name="Estrutura",
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31),
            allocated_units=0.5,
            total_work_hours=80.0
        ),
    ]
    
    # Estado inicial
    state = create_initial_state(
        execution_id="test-001",
        project_ids=["proj-1", "proj-2"],
        start_date=date(2025, 2, 1),
        end_date=date(2025, 3, 31)
    )
    state["resources"] = resources
    state["assignments"] = assignments
    
    # Executar agente
    result = consolidator_agent(state)
    
    # Assertions
    assert len(result["consolidated_resources"]) == 1  # Consolidado em 1
    
    consolidated = result["consolidated_resources"][0]
    assert consolidated.email == "joao.silva@company.com"
    assert len(consolidated.assignments) == 2  # Ambos assignments
    assert result["stage"] == "consolidation_complete"
    
    print("✅ Teste do Consolidador passou!")


if __name__ == "__main__":
    test_consolidator_agent()
```

---

## 🚨 agents/detector.py - Agente 2

```python
"""
Agente 2: Detector de Conflitos

Responsabilidade:
- Calcular alocação diária de cada recurso
- Detectar superalocações (allocatedHours > capacity)
- Classificar severidade dos conflitos
"""
from typing import Dict, List
from datetime import date, timedelta, datetime
from ..models.state import AgentState, Conflict, TaskInvolvement
import logging

logger = logging.getLogger(__name__)


def get_business_days(start_date: date, end_date: date) -> int:
    """
    Calcula número de dias úteis entre duas datas.
    
    Considera: Segunda a Sexta (não conta fins de semana)
    """
    if start_date > end_date:
        return 0
    
    count = 0
    current = start_date
    
    while current <= end_date:
        # 0 = Segunda, 6 = Domingo
        if current.weekday() < 5:  # Segunda a Sexta
            count += 1
        current += timedelta(days=1)
    
    return count


def classify_severity(overallocation_percent: float) -> str:
    """
    Classifica severidade do conflito baseado no percentual.
    
    < 25% = LOW
    25-50% = MEDIUM
    50-100% = HIGH
    > 100% = CRITICAL
    """
    if overallocation_percent < 25:
        return "LOW"
    elif overallocation_percent < 50:
        return "MEDIUM"
    elif overallocation_percent < 100:
        return "HIGH"
    else:
        return "CRITICAL"


def detector_agent(state: AgentState) -> AgentState:
    """
    Detecta conflitos de superalocação.
    
    Algoritmo:
    1. Para cada recurso consolidado:
       a. Criar mapa de alocação diária
       b. Para cada assignment, distribuir horas pelos dias úteis
       c. Detectar dias onde total > capacidade
    2. Classificar severidade
    3. Ordenar por severidade e percentual
    """
    start_time = datetime.now()
    logger.info(
        f"[DETECTOR] Starting conflict detection for execution {state['execution_id']}"
    )
    
    consolidated_resources = state.get("consolidated_resources", [])
    conflicts: List[Conflict] = []
    
    for resource in consolidated_resources:
        # Mapa: date_string → { date, tasks[], totalHours }
        daily_allocation: Dict[str, Dict] = {}
        
        # Processar cada assignment
        for assignment in resource.assignments:
            business_days = get_business_days(
                assignment.start_date,
                assignment.end_date
            )
            
            if business_days == 0:
                logger.warning(
                    f"Assignment {assignment.id} has no business days"
                )
                continue
            
            # Horas por dia útil
            hours_per_day = assignment.total_work_hours / business_days
            
            # Distribuir pelas datas
            current_date = assignment.start_date
            while current_date <= assignment.end_date:
                # Pular fins de semana
                if current_date.weekday() < 5:
                    date_key = current_date.isoformat()
                    
                    # Inicializar dia se não existe
                    if date_key not in daily_allocation:
                        daily_allocation[date_key] = {
                            "date": current_date,
                            "tasks": [],
                            "total_hours": 0.0
                        }
                    
                    # Adicionar tarefa ao dia
                    day = daily_allocation[date_key]
                    day["tasks"].append(
                        TaskInvolvement(
                            project_id=assignment.project_id,
                            task_id=assignment.task_id,
                            task_name=assignment.task_name,
                            hours=hours_per_day
                        )
                    )
                    day["total_hours"] += hours_per_day
                
                current_date += timedelta(days=1)
        
        # Detectar conflitos
        for date_key, day in daily_allocation.items():
            if day["total_hours"] > resource.capacity:
                overallocation_hours = day["total_hours"] - resource.capacity
                overallocation_percent = (
                    overallocation_hours / resource.capacity
                ) * 100
                
                conflict = Conflict(
                    resource_id=resource.id,
                    resource_name=resource.name,
                    conflict_date=day["date"],
                    allocated_hours=round(day["total_hours"], 2),
                    capacity_hours=resource.capacity,
                    overallocation_hours=round(overallocation_hours, 2),
                    overallocation_percent=round(overallocation_percent, 1),
                    severity=classify_severity(overallocation_percent),
                    tasks_involved=day["tasks"],
                    projects_count=len(
                        set(task.project_id for task in day["tasks"])
                    )
                )
                
                conflicts.append(conflict)
    
    # Ordenar por severidade e percentual
    severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    conflicts.sort(
        key=lambda c: (
            -severity_order[c.severity],  # Maior severidade primeiro
            -c.overallocation_percent     # Maior percentual primeiro
        )
    )
    
    # Estatísticas
    critical_conflicts = sum(
        1 for c in conflicts if c.severity == "CRITICAL"
    )
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    logger.info(
        f"[DETECTOR] Detected {len(conflicts)} conflicts "
        f"({critical_conflicts} CRITICAL) in {elapsed:.2f}s"
    )
    
    # Atualizar estado
    return {
        **state,
        "conflicts": conflicts,
        "total_conflicts": len(conflicts),
        "critical_conflicts": critical_conflicts,
        "stage": "detection_complete",
        "timestamps": {
            **state.get("timestamps", {}),
            "detection_complete": datetime.now()
        }
    }


# ============================================================================
# TESTES UNITÁRIOS
# ============================================================================

def test_detector_agent():
    """Teste do agente detector"""
    from ..models.state import (
        ConsolidatedResource, Assignment, create_initial_state
    )
    from datetime import date
    
    # Mock: Recurso com 2 tarefas que se sobrepõem
    resource = ConsolidatedResource(
        id="res-1",
        name="João Silva",
        email="joao@company.com",
        role="Engenheiro",
        capacity=8.0,
        assignments=[
            Assignment(
                id="asn-1",
                project_id="proj-1",
                resource_id="res-1",
                task_id="task-1",
                task_name="Fundação",
                start_date=date(2025, 2, 10),  # 10 a 14 (5 dias úteis)
                end_date=date(2025, 2, 14),
                allocated_units=1.0,
                total_work_hours=40.0  # 8h/dia
            ),
            Assignment(
                id="asn-2",
                project_id="proj-2",
                resource_id="res-1",
                task_id="task-2",
                task_name="Estrutura",
                start_date=date(2025, 2, 12),  # 12 a 14 (3 dias úteis)
                end_date=date(2025, 2, 14),
                allocated_units=1.0,
                total_work_hours=24.0  # 8h/dia
            ),
        ]
    )
    
    state = create_initial_state(
        execution_id="test-002",
        project_ids=["proj-1", "proj-2"],
        start_date=date(2025, 2, 1),
        end_date=date(2025, 2, 28)
    )
    state["consolidated_resources"] = [resource]
    
    # Executar agente
    result = detector_agent(state)
    
    # Assertions
    # Dias 12, 13, 14 = conflito (8h + 8h = 16h > 8h capacity)
    assert result["total_conflicts"] == 3
    assert result["stage"] == "detection_complete"
    
    # Verificar conflito específico
    conflict = result["conflicts"][0]
    assert conflict.severity == "CRITICAL"  # 100% overallocation
    assert conflict.allocated_hours == 16.0
    assert conflict.overallocation_percent == 100.0
    assert len(conflict.tasks_involved) == 2
    
    print("✅ Teste do Detector passou!")


if __name__ == "__main__":
    test_detector_agent()
```

---

## 🤖 agents/generator.py - Agente 3 (Claude)

```python
"""
Agente 3: Gerador de Soluções (Claude)

Responsabilidade:
- Preparar prompt estruturado para Claude
- Chamar API do Anthropic
- Parsear e validar respostas JSON
- Gerar 2-3 soluções por conflito
"""
from typing import List
import json
import re
from datetime import datetime
from anthropic import AsyncAnthropic
from ..models.state import AgentState, Solution, Conflict
import logging

logger = logging.getLogger(__name__)


def build_prompt(conflicts: List[Conflict], max_conflicts: int = 10) -> str:
    """
    Constrói prompt otimizado para Claude.
    
    Inclui:
    - Contexto do problema
    - Dados dos conflitos
    - Estratégias disponíveis
    - Formato de resposta esperado
    """
    top_conflicts = conflicts[:max_conflicts]
    
    prompt = f"""Você é um especialista em gestão de recursos de projetos de construção civil.

Sua tarefa é analisar conflitos de superalocação e gerar soluções práticas.

CONFLITOS DETECTADOS:
{json.dumps([c.dict() for c in top_conflicts], indent=2, default=str)}

Para CADA conflito, você deve gerar 2-3 SOLUÇÕES ALTERNATIVAS usando as seguintes estratégias:

1. **REDISTRIBUTE_WITH_SLACK**: Mover tarefas com folga disponível (slack_days > 0) para outros dias
   - Use quando: Tarefa tem folga E não está no caminho crítico
   - Impacto: Baixo (não afeta deadline)
   - Complexidade: Baixa

2. **MOVE_NONCRITICAL**: Postergar tarefas não-críticas
   - Use quando: Tarefa NÃO está no caminho crítico
   - Impacto: Médio (pode afetar outras tarefas)
   - Complexidade: Média

3. **EXTEND_DURATION**: Reduzir alocação diária (ex: 100% → 50%, dobrando duração)
   - Use quando: Deadline pode ser flexibilizado
   - Impacto: Alto (aumenta duração total)
   - Complexidade: Média

4. **ADD_RESOURCE**: Adicionar outro recurso para dividir carga
   - Use quando: Nenhuma das anteriores é viável
   - Impacto: Alto (requer contratação/realocação)
   - Complexidade: Alta

Para cada solução, forneça:

{{
  "conflict_id": "resource_id-conflict_date",
  "solutions": [
    {{
      "strategy": "REDISTRIBUTE_WITH_SLACK" | "MOVE_NONCRITICAL" | "EXTEND_DURATION" | "ADD_RESOURCE",
      "description": "Descrição clara da ação (max 150 caracteres)",
      "reasoning": "Por que essa é uma boa solução",
      "feasibility_score": 0.0-1.0,
      "complexity_score": 0.0-1.0,
      "preserves_deadline": true | false,
      "impact_analysis": {{
        "affected_tasks": ["task1", "task2"],
        "days_impact": 0,
        "resources_needed": 0
      }}
    }}
  ]
}}

CRITÉRIOS IMPORTANTES:
- Priorize soluções que preservam deadline
- Considere folga disponível nas tarefas
- Evite mover tarefas do caminho crítico
- Soluções devem ser específicas e acionáveis

RETORNE APENAS UM ARRAY JSON VÁLIDO.
NÃO use markdown code blocks.
NÃO adicione texto antes ou depois do JSON.
"""
    
    return prompt


async def generator_agent(state: AgentState) -> AgentState:
    """
    Gera soluções usando Claude Sonnet 4.
    
    Fluxo:
    1. Selecionar top 10 conflitos mais críticos
    2. Construir prompt estruturado
    3. Chamar API do Anthropic
    4. Parsear e validar JSON
    5. Flatten soluções (1 solução = 1 objeto)
    """
    start_time = datetime.now()
    logger.info(
        f"[GENERATOR] Starting solution generation for execution {state['execution_id']}"
    )
    
    conflicts = state.get("conflicts", [])
    
    if not conflicts:
        logger.warning("[GENERATOR] No conflicts to process")
        return {
            **state,
            "solutions": [],
            "total_solutions": 0,
            "stage": "generation_complete",
            "errors": [*state.get("errors", []), "No conflicts to generate solutions"]
        }
    
    # Preparar prompt
    prompt = build_prompt(conflicts, max_conflicts=10)
    
    # Chamar Claude
    client = AsyncAnthropic()
    
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            temperature=0.3,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Extrair texto da resposta
        response_text = response.content[0].text
        
        # Limpar markdown se houver
        cleaned = response_text.strip()
        cleaned = re.sub(r'```json\s*', '', cleaned)
        cleaned = re.sub(r'```\s*', '', cleaned)
        cleaned = cleaned.strip()
        
        # Parsear JSON
        parsed = json.loads(cleaned)
        
        # Validar estrutura
        if not isinstance(parsed, list):
            raise ValueError("Response is not a list")
        
        # Flatten: cada solução vira um objeto separado
        solutions: List[Solution] = []
        
        for conflict_response in parsed:
            conflict_id = conflict_response.get("conflict_id")
            
            for sol_data in conflict_response.get("solutions", []):
                solution = Solution(
                    conflict_id=conflict_id,
                    strategy=sol_data["strategy"],
                    description=sol_data["description"],
                    reasoning=sol_data["reasoning"],
                    feasibility_score=sol_data["feasibility_score"],
                    complexity_score=sol_data["complexity_score"],
                    preserves_deadline=sol_data["preserves_deadline"],
                    impact_analysis=sol_data["impact_analysis"]
                )
                solutions.append(solution)
        
        elapsed = (datetime.now() - start_time).total_seconds()
        
        logger.info(
            f"[GENERATOR] Generated {len(solutions)} solutions "
            f"for {len(parsed)} conflicts in {elapsed:.2f}s"
        )
        
        return {
            **state,
            "solutions": solutions,
            "total_solutions": len(solutions),
            "stage": "generation_complete",
            "timestamps": {
                **state.get("timestamps", {}),
                "generation_complete": datetime.now()
            }
        }
        
    except Exception as e:
        logger.error(f"[GENERATOR] Error: {str(e)}")
        
        return {
            **state,
            "solutions": [],
            "total_solutions": 0,
            "stage": "generation_failed",
            "errors": [*state.get("errors", []), f"Generation failed: {str(e)}"]
        }
```

---

## 📊 agents/ranker.py - Agente 4

```python
"""
Agente 4: Rankeador de Soluções

Responsabilidade:
- Calcular score ponderado para cada solução
- Ordenar soluções por score (maior primeiro)
- Aplicar pesos aprendidos (ou padrão)
"""
from typing import List, Dict
from datetime import datetime
from ..models.state import AgentState, RankedSolution, Solution, Weights
import logging

logger = logging.getLogger(__name__)


def calculate_rank_score(
    solution: Solution,
    weights: Weights
) -> float:
    """
    Calcula score final ponderado.
    
    Fórmula:
    rank_score = 
        feasibility_score * weight_feasibility +
        (1 - complexity_score) * weight_impact +
        deadline_score * weight_deadline +
        (1 - complexity_score) * weight_simplicity
    """
    # Score de viabilidade (direto do Claude)
    feasibility_score = solution.feasibility_score
    
    # Score de impacto (inverso da complexidade)
    impact_score = 1.0 - solution.complexity_score
    
    # Score de deadline (binário: 1.0 ou 0.3)
    deadline_score = 1.0 if solution.preserves_deadline else 0.3
    
    # Score de simplicidade (inverso da complexidade)
    simplicity_score = 1.0 - solution.complexity_score
    
    # Score final ponderado
    rank_score = (
        feasibility_score * weights.feasibility +
        impact_score * weights.impact +
        deadline_score * weights.deadline +
        simplicity_score * weights.simplicity
    )
    
    return round(rank_score, 3)


def ranker_agent(state: AgentState) -> AgentState:
    """
    Rankeia soluções aplicando pesos.
    
    Fluxo:
    1. Carregar pesos (aprendidos ou padrão)
    2. Para cada solução, calcular rank_score
    3. Ordenar por score (maior primeiro)
    4. Logar top 3
    """
    start_time = datetime.now()
    logger.info(
        f"[RANKER] Starting ranking for execution {state['execution_id']}"
    )
    
    solutions = state.get("solutions", [])
    
    if not solutions:
        logger.warning("[RANKER] No solutions to rank")
        return {
            **state,
            "ranked_solutions": [],
            "stage": "ranking_complete"
        }
    
    # Carregar pesos (podem ter sido ajustados pelo Agente 8)
    weights = state.get("weights", Weights())
    
    logger.info(
        f"[RANKER] Using weights: feasibility={weights.feasibility}, "
        f"impact={weights.impact}, deadline={weights.deadline}, "
        f"simplicity={weights.simplicity}"
    )
    
    # Calcular score para cada solução
    ranked_solutions: List[RankedSolution] = []
    
    for solution in solutions:
        rank_score = calculate_rank_score(solution, weights)
        
        ranked_solution = RankedSolution(
            **solution.dict(),
            rank_score=rank_score,
            weights=weights.dict()
        )
        
        ranked_solutions.append(ranked_solution)
    
    # Ordenar por score (maior primeiro)
    ranked_solutions.sort(key=lambda s: s.rank_score, reverse=True)
    
    # Logar top 3
    logger.info("[RANKER] Top 3 solutions:")
    for i, sol in enumerate(ranked_solutions[:3], 1):
        logger.info(
            f"  {i}. {sol.strategy} - Score: {sol.rank_score:.3f} - "
            f"{sol.description[:50]}..."
        )
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    logger.info(
        f"[RANKER] Ranked {len(ranked_solutions)} solutions in {elapsed:.2f}s"
    )
    
    return {
        **state,
        "ranked_solutions": ranked_solutions,
        "stage": "ranking_complete",
        "timestamps": {
            **state.get("timestamps", {}),
            "ranking_complete": datetime.now()
        }
    }


# ============================================================================
# TESTES UNITÁRIOS
# ============================================================================

def test_ranker_agent():
    """Teste do agente rankeador"""
    from ..models.state import Solution, ImpactAnalysis, create_initial_state, Weights
    from datetime import date
    
    solutions = [
        Solution(
            conflict_id="conf-1",
            strategy="REDISTRIBUTE_WITH_SLACK",
            description="Mover tarefa X para dia Y",
            reasoning="Tem folga disponível",
            feasibility_score=0.9,
            complexity_score=0.2,
            preserves_deadline=True,
            impact_analysis=ImpactAnalysis(
                affected_tasks=["T001"],
                days_impact=0,
                resources_needed=0
            )
        ),
        Solution(
            conflict_id="conf-1",
            strategy="ADD_RESOURCE",
            description="Contratar novo engenheiro",
            reasoning="Única solução viável",
            feasibility_score=0.4,
            complexity_score=0.9,
            preserves_deadline=True,
            impact_analysis=ImpactAnalysis(
                affected_tasks=[],
                days_impact=0,
                resources_needed=1
            )
        ),
    ]
    
    state = create_initial_state(
        execution_id="test-003",
        project_ids=["proj-1"],
        start_date=date(2025, 2, 1),
        end_date=date(2025, 2, 28)
    )
    state["solutions"] = solutions
    state["weights"] = Weights()  # Pesos padrão
    
    # Executar agente
    result = ranker_agent(state)
    
    # Assertions
    assert len(result["ranked_solutions"]) == 2
    
    # REDISTRIBUTE deve ter score maior (mais viável e simples)
    assert result["ranked_solutions"][0].strategy == "REDISTRIBUTE_WITH_SLACK"
    assert result["ranked_solutions"][0].rank_score > 0.7
    
    # ADD_RESOURCE deve ter score menor (complexo e menos viável)
    assert result["ranked_solutions"][1].strategy == "ADD_RESOURCE"
    assert result["ranked_solutions"][1].rank_score < 0.5
    
    print("✅ Teste do Ranker passou!")


if __name__ == "__main__":
    test_ranker_agent()
```

---

Continuo na próxima mensagem com o workflow LangGraph e API FastAPI...
