import { Lightbulb, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const Solutions = () => {
    // Mock data - será substituído por dados reais da API
    const solutions = [
        {
            id: 1,
            strategy: 'REDISTRIBUTE_WITH_SLACK',
            description: 'Redistribuir tarefas com folga para outros dias',
            reasoning: 'Tarefa possui 3 dias de folga e não está no caminho crítico',
            feasibility: 0.92,
            complexity: 0.25,
            preservesDeadline: true,
            rankScore: 0.89,
        },
        {
            id: 2,
            strategy: 'MOVE_NONCRITICAL',
            description: 'Postergar tarefas não-críticas',
            reasoning: 'Tarefa não está no caminho crítico e pode ser adiada',
            feasibility: 0.78,
            complexity: 0.45,
            preservesDeadline: true,
            rankScore: 0.72,
        },
        {
            id: 3,
            strategy: 'EXTEND_DURATION',
            description: 'Reduzir alocação diária de 100% para 50%',
            reasoning: 'Permite distribuir carga ao longo de mais dias',
            feasibility: 0.65,
            complexity: 0.60,
            preservesDeadline: false,
            rankScore: 0.58,
        },
    ];

    const getStrategyIcon = (strategy: string) => {
        switch (strategy) {
            case 'REDISTRIBUTE_WITH_SLACK':
                return <TrendingUp className="text-green-400" size={24} />;
            case 'MOVE_NONCRITICAL':
                return <Clock className="text-blue-400" size={24} />;
            case 'EXTEND_DURATION':
                return <ArrowRight className="text-purple-400" size={24} />;
            default:
                return <Lightbulb className="text-yellow-400" size={24} />;
        }
    };

    const getStrategyColor = (strategy: string) => {
        switch (strategy) {
            case 'REDISTRIBUTE_WITH_SLACK':
                return 'from-green-500 to-emerald-500';
            case 'MOVE_NONCRITICAL':
                return 'from-blue-500 to-cyan-500';
            case 'EXTEND_DURATION':
                return 'from-purple-500 to-pink-500';
            default:
                return 'from-yellow-500 to-orange-500';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Soluções Geradas</h1>
                <p className="text-gray-400 mt-1">Soluções ranqueadas por viabilidade e impacto</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total de Soluções</p>
                            <p className="text-3xl font-bold mt-1">{solutions.length}</p>
                        </div>
                        <Lightbulb className="text-yellow-400" size={32} />
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Preservam Deadline</p>
                            <p className="text-3xl font-bold mt-1 text-green-400">
                                {solutions.filter(s => s.preservesDeadline).length}
                            </p>
                        </div>
                        <CheckCircle className="text-green-400" size={32} />
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Score Médio</p>
                            <p className="text-3xl font-bold mt-1">
                                {(solutions.reduce((acc, s) => acc + s.rankScore, 0) / solutions.length).toFixed(2)}
                            </p>
                        </div>
                        <TrendingUp className="text-primary-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Solutions List */}
            <div className="space-y-4">
                {solutions.map((solution, index) => (
                    <div
                        key={solution.id}
                        className="card hover:scale-[1.02] transition-transform duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start gap-4">
                            {/* Rank Badge */}
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getStrategyColor(solution.strategy)} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-2xl font-bold">#{index + 1}</span>
                            </div>

                            <div className="flex-1">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStrategyIcon(solution.strategy)}
                                            <h3 className="text-lg font-semibold">{solution.strategy.replace(/_/g, ' ')}</h3>
                                        </div>
                                        <p className="text-gray-300">{solution.description}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Score</p>
                                        <p className="text-2xl font-bold text-gradient">{(solution.rankScore * 100).toFixed(0)}%</p>
                                    </div>
                                </div>

                                {/* Reasoning */}
                                <div className="glass p-3 rounded-lg mb-4">
                                    <p className="text-sm text-gray-300">
                                        <span className="text-primary-400 font-semibold">Justificativa:</span> {solution.reasoning}
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="glass p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Viabilidade</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                                                    style={{ width: `${solution.feasibility * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold">{(solution.feasibility * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <div className="glass p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Complexidade</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                                    style={{ width: `${solution.complexity * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold">{(solution.complexity * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <div className="glass p-3 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Deadline</p>
                                        <div className="flex items-center gap-2">
                                            {solution.preservesDeadline ? (
                                                <>
                                                    <CheckCircle className="text-green-400" size={16} />
                                                    <span className="text-sm font-semibold text-green-400">Preservado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="text-orange-400" size={16} />
                                                    <span className="text-sm font-semibold text-orange-400">Afetado</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-4">
                                    <button className="btn-primary flex-1">
                                        Implementar Solução
                                    </button>
                                    <button className="btn-secondary">
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Solutions;
