"""
Estado compartilhado entre todos os agentes.
TypedDict garante type safety e validação.
"""
from typing import TypedDict, List, Dict, Optional, Literal
from datetime import date, datetime
from pydantic import BaseModel, Field


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
    allocated_units: float
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


class AgentState(TypedDict, total=False):
    """Estado compartilhado entre todos os agentes"""
    execution_id: str
    stage: str
    iterations: int
    project_ids: List[str]
    start_date: date
    end_date: date
    callback_url: Optional[str]
    projects: List[Project]
    resources: List[Resource]
    assignments: List[Assignment]
    consolidated_resources: List[ConsolidatedResource]
    conflicts: List[Conflict]
    total_conflicts: int
    critical_conflicts: int
    solutions: List[Solution]
    total_solutions: int
    weights: Weights
    ranked_solutions: List[RankedSolution]
    feedback_history: List[Feedback]
    patterns: Dict[str, any]
    should_continue: bool
    trigger_pattern_analysis: bool
    timestamps: Dict[str, datetime]
    errors: List[str]


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
