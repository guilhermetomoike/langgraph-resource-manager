import { useState } from 'react';
import {
    Activity,
    Cpu,
    Zap,
    CheckCircle2,
    AlertCircle,
    Clock,
    Play,
    Pause,
    Square,
    RefreshCw
} from 'lucide-react';

interface Agent {
    id: number;
    name: string;
    description: string;
    status: 'idle' | 'running' | 'success' | 'error' | 'paused';
    lastExecution?: string;
    avgTime?: number;
    successRate?: number;
}

const Orchestration = () => {
    const [agents, setAgents] = useState<Agent[]>([
        {
            id: 1,
            name: 'Consolidador',
            description: 'Normaliza recursos duplicados',
            status: 'idle',
            lastExecution: '2 min atrás',
            avgTime: 1.2,
            successRate: 100,
        },
        {
            id: 2,
            name: 'Detector',
            description: 'Identifica conflitos de alocação',
            status: 'running',
            lastExecution: 'Agora',
            avgTime: 2.5,
            successRate: 98,
        },
        {
            id: 3,
            name: 'Gerador (Claude)',
            description: 'Gera soluções com IA',
            status: 'idle',
            lastExecution: '5 min atrás',
            avgTime: 8.3,
            successRate: 95,
        },
        {
            id: 4,
            name: 'Rankeador',
            description: 'Ordena soluções por viabilidade',
            status: 'success',
            lastExecution: '1 min atrás',
            avgTime: 0.8,
            successRate: 100,
        },
        {
            id: 6,
            name: 'Feedback Collector',
            description: 'Registra aceitação/rejeição',
            status: 'idle',
            avgTime: 0.5,
            successRate: 100,
        },
        {
            id: 7,
            name: 'Pattern Analyzer',
            description: 'Identifica preferências',
            status: 'idle',
            avgTime: 3.2,
            successRate: 97,
        },
        {
            id: 8,
            name: 'Weight Adjuster',
            description: 'Ajusta pesos automaticamente',
            status: 'idle',
            avgTime: 1.5,
            successRate: 99,
        },
    ]);

    const [systemMetrics, setSystemMetrics] = useState({
        activeExecutions: 1,
        agentsOnline: 7,
        totalAgents: 7,
        successRate: 97.5,
        avgResponseTime: 2.8,
        executionsToday: 24,
    });

    const getStatusColor = (status: Agent['status']) => {
        switch (status) {
            case 'running':
                return 'from-green-500 to-emerald-500';
            case 'success':
                return 'from-blue-500 to-cyan-500';
            case 'error':
                return 'from-red-500 to-orange-500';
            case 'paused':
                return 'from-yellow-500 to-orange-500';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getStatusIcon = (status: Agent['status']) => {
        switch (status) {
            case 'running':
                return <Activity className="animate-pulse" size={20} />;
            case 'success':
                return <CheckCircle2 size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'paused':
                return <Pause size={20} />;
            default:
                return <Clock size={20} />;
        }
    };

    const getStatusBadge = (status: Agent['status']) => {
        const badges = {
            running: 'bg-green-500/20 text-green-400 border-green-500/50',
            success: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
            error: 'bg-red-500/20 text-red-400 border-red-500/50',
            paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            idle: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
        };
        return badges[status];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Orquestração de Agentes</h1>
                    <p className="text-gray-400 mt-1">Centro de comando e monitoramento do sistema</p>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3">
                    <button className="btn-primary flex items-center gap-2">
                        <Play size={20} />
                        Iniciar
                    </button>
                    <button className="btn-secondary flex items-center gap-2">
                        <Pause size={20} />
                        Pausar
                    </button>
                    <button className="glass-hover px-4 py-2 rounded-lg flex items-center gap-2 text-red-400">
                        <Square size={20} />
                        Parar
                    </button>
                </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Execuções Ativas</p>
                            <p className="text-3xl font-bold mt-1">{systemMetrics.activeExecutions}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <Activity className="animate-pulse" size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Agentes Online</p>
                            <p className="text-3xl font-bold mt-1">
                                {systemMetrics.agentsOnline}/{systemMetrics.totalAgents}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Cpu size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                            <p className="text-3xl font-bold mt-1">{systemMetrics.successRate}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Tempo Médio</p>
                            <p className="text-3xl font-bold mt-1">{systemMetrics.avgResponseTime}s</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflow Visualization */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Fluxo de Trabalho</h2>
                    <button className="glass-hover px-4 py-2 rounded-lg flex items-center gap-2">
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>

                <div className="flex items-center justify-center gap-4 py-8 overflow-x-auto">
                    {[1, 2, 3, 4].map((step, index) => {
                        const agent = agents.find(a => a.id === step);
                        return (
                            <div key={step} className="flex items-center gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getStatusColor(agent?.status || 'idle')} flex items-center justify-center transition-all duration-300 ${agent?.status === 'running' ? 'scale-110 shadow-2xl' : ''
                                            }`}
                                    >
                                        <span className="text-2xl font-bold">{step}</span>
                                    </div>
                                    <p className="text-sm mt-2 text-center max-w-[100px]">{agent?.name}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full mt-1 border ${getStatusBadge(agent?.status || 'idle')}`}>
                                        {agent?.status}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className="flex items-center">
                                        <div className="w-12 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded"></div>
                                        <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-accent-500"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Agent Status Cards */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Status dos Agentes</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent, index) => (
                        <div
                            key={agent.id}
                            className="glass-hover p-4 animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getStatusColor(agent.status)} flex items-center justify-center`}>
                                        {getStatusIcon(agent.status)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{agent.name}</h3>
                                        <p className="text-xs text-gray-400">{agent.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {agent.lastExecution && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Última execução:</span>
                                        <span>{agent.lastExecution}</span>
                                    </div>
                                )}
                                {agent.avgTime && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Tempo médio:</span>
                                        <span>{agent.avgTime}s</span>
                                    </div>
                                )}
                                {agent.successRate !== undefined && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Taxa de sucesso:</span>
                                        <span className="text-green-400">{agent.successRate}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full bg-gradient-to-r ${getStatusColor(agent.status)}`}
                                        style={{ width: `${agent.successRate || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Execution Timeline */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Timeline de Execuções</h2>

                <div className="space-y-3">
                    {[
                        { time: '14:32', event: 'Análise iniciada', status: 'success', execution: 'exec-001' },
                        { time: '14:33', event: 'Consolidação completa', status: 'success', execution: 'exec-001' },
                        { time: '14:34', event: 'Conflitos detectados: 12', status: 'running', execution: 'exec-001' },
                        { time: '14:35', event: 'Gerando soluções...', status: 'running', execution: 'exec-001' },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 glass p-4 rounded-lg animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="text-sm text-gray-400 w-16">{item.time}</div>
                            <div className={`w-3 h-3 rounded-full ${item.status === 'success' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                                }`}></div>
                            <div className="flex-1">
                                <p className="font-medium">{item.event}</p>
                                <p className="text-xs text-gray-400">Execution ID: {item.execution}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Orchestration;
