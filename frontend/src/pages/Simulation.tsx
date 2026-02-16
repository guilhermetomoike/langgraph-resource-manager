import { useState } from 'react';
import { FlaskConical, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const Simulation = () => {
    const [scenarioType, setScenarioType] = useState<'prioritize_project' | 'add_resource' | 'delay_project'>('add_resource');
    const [result, setResult] = useState<any>(null);

    const scenarios = [
        {
            type: 'add_resource' as const,
            title: 'Adicionar Recurso',
            description: 'Simular adição de um novo recurso à equipe',
            icon: '👤',
            color: 'from-green-500 to-emerald-500',
        },
        {
            type: 'prioritize_project' as const,
            title: 'Priorizar Projeto',
            description: 'Simular priorização de um projeto específico',
            icon: '⭐',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            type: 'delay_project' as const,
            title: 'Postergar Projeto',
            description: 'Simular adiamento de um projeto',
            icon: '⏰',
            color: 'from-purple-500 to-pink-500',
        },
    ];

    // Mock simulation result
    const mockResult = {
        scenario_type: scenarioType,
        improvement_score: 0.65,
        recommendation: 'Adicionar um Engenheiro Civil com 80% de disponibilidade reduziria conflitos em 45%',
        simulated_metrics: {
            conflicts_before: 12,
            conflicts_after: 7,
            resources_affected: 3,
            projects_impacted: 2,
        },
        delta: {
            conflicts: -5,
            overallocation: -38,
            efficiency: +22,
        },
    };

    const handleSimulate = () => {
        // Simular chamada à API
        setTimeout(() => {
            setResult(mockResult);
        }, 1000);
    };

    const getDeltaIcon = (value: number) => {
        if (value > 0) return <TrendingUp className="text-green-400" size={20} />;
        if (value < 0) return <TrendingDown className="text-red-400" size={20} />;
        return <Minus className="text-gray-400" size={20} />;
    };

    const getDeltaColor = (value: number) => {
        if (value > 0) return 'text-green-400';
        if (value < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Simulação de Cenários</h1>
                <p className="text-gray-400 mt-1">Teste cenários hipotéticos e veja o impacto nas alocações</p>
            </div>

            {/* Scenario Selection */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Selecione um Cenário</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scenarios.map((scenario) => (
                        <button
                            key={scenario.type}
                            onClick={() => setScenarioType(scenario.type)}
                            className={`p-6 rounded-xl transition-all duration-300 text-left ${scenarioType === scenario.type
                                    ? `bg-gradient-to-br ${scenario.color} scale-105`
                                    : 'glass-hover'
                                }`}
                        >
                            <div className="text-4xl mb-3">{scenario.icon}</div>
                            <h3 className="font-semibold text-lg mb-2">{scenario.title}</h3>
                            <p className="text-sm text-gray-300">{scenario.description}</p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSimulate}
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                    <FlaskConical size={20} />
                    Executar Simulação
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-slide-up">
                    {/* Recommendation */}
                    <div className="card bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                                <FlaskConical size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Recomendação</h3>
                                <p className="text-gray-300">{result.recommendation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Comparison */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-6">Comparação de Métricas</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Conflitos (Antes)</p>
                                <p className="text-3xl font-bold text-orange-400">
                                    {result.simulated_metrics.conflicts_before}
                                </p>
                            </div>

                            <div className="glass p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Conflitos (Depois)</p>
                                <p className="text-3xl font-bold text-green-400">
                                    {result.simulated_metrics.conflicts_after}
                                </p>
                            </div>

                            <div className="glass p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Recursos Afetados</p>
                                <p className="text-3xl font-bold">
                                    {result.simulated_metrics.resources_affected}
                                </p>
                            </div>

                            <div className="glass p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-2">Projetos Impactados</p>
                                <p className="text-3xl font-bold">
                                    {result.simulated_metrics.projects_impacted}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Delta Analysis */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-6">Análise de Impacto</h2>

                        <div className="space-y-4">
                            {Object.entries(result.delta).map(([key, value]: [string, any]) => (
                                <div key={key} className="glass p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getDeltaIcon(value)}
                                            <span className="font-semibold capitalize">{key.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl font-bold ${getDeltaColor(value)}`}>
                                                {value > 0 ? '+' : ''}{value}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${value > 0
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                                                    }`}
                                                style={{ width: `${Math.abs(value)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Improvement Score */}
                    <div className="card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                        <div className="text-center">
                            <p className="text-sm text-gray-400 mb-2">Score de Melhoria</p>
                            <p className="text-6xl font-bold text-gradient mb-2">
                                {(result.improvement_score * 100).toFixed(0)}%
                            </p>
                            <p className="text-gray-300">
                                {result.improvement_score > 0.7 ? 'Excelente impacto' :
                                    result.improvement_score > 0.4 ? 'Impacto moderado' :
                                        'Impacto baixo'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Simulation;
