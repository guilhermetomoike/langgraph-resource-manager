import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
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

export interface N8nWorkflowRequest {
    project_ids: string[];
    start_date: string;
    end_date: string;
    execution_id: string;
}

export interface N8nWorkflowResponse {
    success: boolean;
    execution_id: string;
    message: string;
    stage?: string;
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

    // Trigger n8n workflow (MS Project sync + LangGraph execution)
    triggerN8nWorkflow: async (data: N8nWorkflowRequest): Promise<N8nWorkflowResponse> => {
        if (!N8N_WEBHOOK_URL) {
            throw new Error('n8n webhook URL not configured. Please set VITE_N8N_WEBHOOK_URL in .env file.');
        }

        try {
            const response = await axios.post<N8nWorkflowResponse>(
                N8N_WEBHOOK_URL,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000, // 60 seconds for n8n workflow
                }
            );
            return response.data;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED') {
                throw new Error('Workflow execution timeout. Please try again.');
            }
            throw new Error(error.response?.data?.message || 'Failed to trigger n8n workflow');
        }
    },
};

export default api;
