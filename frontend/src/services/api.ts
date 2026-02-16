import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interfaces
export interface AnalysisRequest {
    project_ids: string[];
    start_date: string;
    end_date: string;
    callback_url?: string;
}

export interface AnalysisResponse {
    message: string;
    execution_id: string;
    stage: string;
    total_conflicts: number;
    total_solutions: number;
}

export interface FeedbackRequest {
    execution_id: string;
    solution_id: string;
    accepted: boolean;
    manager_rating: number;
    implementation_result: 'success' | 'partial' | 'failed';
    context?: Record<string, any>;
}

export interface FeedbackResponse {
    message: string;
    continued: boolean;
}

export interface StatusResponse {
    execution_id: string;
    stage: string;
    conflicts: any[];
    solutions: any[];
    feedback_history: any[];
}

export interface SimulationRequest {
    scenario_type: 'add_resource' | 'prioritize_project' | 'delay_project';
    scenario_params: Record<string, any>;
    current_state: {
        resources: any[];
        allocations: any[];
    };
}

export interface SimulationResponse {
    scenario_type: string;
    improvement_score: number;
    recommendation: string;
    simulated_metrics: {
        conflicts_before: number;
        conflicts_after: number;
        resources_affected: number;
        projects_impacted: number;
    };
}

// API Methods
export const apiService = {
    // Health check
    healthCheck: async () => {
        const response = await api.get('/');
        return response.data;
    },

    // Analyze resources
    analyzeResources: async (data: AnalysisRequest): Promise<AnalysisResponse> => {
        const response = await api.post<AnalysisResponse>('/analyze', data);
        return response.data;
    },

    // Submit feedback
    submitFeedback: async (data: FeedbackRequest): Promise<FeedbackResponse> => {
        const response = await api.post<FeedbackResponse>('/feedback', data);
        return response.data;
    },

    // Get execution status
    getStatus: async (executionId: string): Promise<StatusResponse> => {
        const response = await api.get<StatusResponse>(`/status/${executionId}`);
        return response.data;
    },

    // Simulate scenario
    simulateScenario: async (data: SimulationRequest): Promise<SimulationResponse> => {
        const response = await api.post<SimulationResponse>('/simulate', data);
        return response.data;
    },
};

export default api;
