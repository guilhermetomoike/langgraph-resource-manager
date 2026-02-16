import { AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react';

const ConflictDetection = () => {
    // Mock data - será substituído por dados reais da API
    const conflicts = [
        {
            id: 1,
            resource: 'João Silva',
            date: '2025-02-15',
            allocated: 16,
            capacity: 8,
            severity: 'CRITICAL',
            projects: 2,
        },
        {
            id: 2,
            resource: 'Maria Santos',
            date: '2025-02-20',
            allocated: 12,
            capacity: 8,
            severity: 'HIGH',
            projects: 2,
        },
        {
            id: 3,
            resource: 'Pedro Costa',
            date: '2025-02-18',
            allocated: 10,
            capacity: 8,
            severity: 'MEDIUM',
            projects: 1,
        },
    ];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'from-red-500 to-orange-500';
            case 'HIGH':
                return 'from-orange-500 to-yellow-500';
            case 'MEDIUM':
                return 'from-yellow-500 to-green-500';
            default:
                return 'from-blue-500 to-cyan-500';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors = {
            CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/50',
            HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            LOW: 'bg-green-500/20 text-green-400 border-green-500/50',
        };
        return colors[severity as keyof typeof colors] || colors.LOW;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Detecção de Conflitos</h1>
                <p className="text-gray-400 mt-1">Visualize e gerencie conflitos de alocação de recursos</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total de Conflitos</p>
                            <p className="text-3xl font-bold mt-1">{conflicts.length}</p>
                        </div>
                        <AlertTriangle className="text-orange-400" size={32} />
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Críticos</p>
                            <p className="text-3xl font-bold mt-1 text-red-400">
                                {conflicts.filter(c => c.severity === 'CRITICAL').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Recursos Afetados</p>
                            <p className="text-3xl font-bold mt-1">3</p>
                        </div>
                        <Users className="text-primary-400" size={32} />
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Sobrealocação Média</p>
                            <p className="text-3xl font-bold mt-1">62%</p>
                        </div>
                        <TrendingUp className="text-accent-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Conflicts List */}
            <div className="card">
                <h2 className="text-xl font-bold mb-6">Conflitos Detectados</h2>

                <div className="space-y-4">
                    {conflicts.map((conflict, index) => (
                        <div
                            key={conflict.id}
                            className="glass-hover p-6 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getSeverityColor(conflict.severity)} flex items-center justify-center`}>
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{conflict.resource}</h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                            <Calendar size={14} />
                                            {new Date(conflict.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>

                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge(conflict.severity)}`}>
                                    {conflict.severity}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="glass p-3 rounded-lg">
                                    <p className="text-xs text-gray-400">Horas Alocadas</p>
                                    <p className="text-xl font-bold text-orange-400">{conflict.allocated}h</p>
                                </div>
                                <div className="glass p-3 rounded-lg">
                                    <p className="text-xs text-gray-400">Capacidade</p>
                                    <p className="text-xl font-bold">{conflict.capacity}h</p>
                                </div>
                                <div className="glass p-3 rounded-lg">
                                    <p className="text-xs text-gray-400">Projetos Envolvidos</p>
                                    <p className="text-xl font-bold text-primary-400">{conflict.projects}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">Sobrealocação</span>
                                    <span className="font-semibold">
                                        {Math.round(((conflict.allocated - conflict.capacity) / conflict.capacity) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full bg-gradient-to-r ${getSeverityColor(conflict.severity)}`}
                                        style={{
                                            width: `${Math.min(((conflict.allocated - conflict.capacity) / conflict.capacity) * 100, 100)}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConflictDetection;
