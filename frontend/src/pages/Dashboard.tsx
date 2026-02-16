import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../services/api';

const Dashboard = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkApiHealth();
    }, []);

    const checkApiHealth = async () => {
        try {
            await apiService.healthCheck();
            setIsOnline(true);
        } catch (error) {
            setIsOnline(false);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            title: 'Análises Realizadas',
            value: '0',
            icon: Activity,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Conflitos Detectados',
            value: '0',
            icon: AlertTriangle,
            color: 'from-orange-500 to-red-500',
        },
        {
            title: 'Soluções Geradas',
            value: '0',
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500',
        },
        {
            title: 'Tempo Médio',
            value: '0s',
            icon: Clock,
            color: 'from-purple-500 to-pink-500',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Visão geral do sistema de gestão de recursos</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-sm text-gray-400">
                        {loading ? 'Verificando...' : isOnline ? 'API Online' : 'API Offline'}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="card hover:scale-105 transition-transform duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <Icon size={28} className="text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/analyze"
                        className="glass-hover p-6 text-center group cursor-pointer"
                    >
                        <Activity className="mx-auto mb-3 text-primary-400 group-hover:scale-110 transition-transform" size={32} />
                        <h3 className="font-semibold mb-1">Nova Análise</h3>
                        <p className="text-sm text-gray-400">Iniciar análise de recursos</p>
                    </a>

                    <a
                        href="/conflicts"
                        className="glass-hover p-6 text-center group cursor-pointer"
                    >
                        <AlertTriangle className="mx-auto mb-3 text-orange-400 group-hover:scale-110 transition-transform" size={32} />
                        <h3 className="font-semibold mb-1">Ver Conflitos</h3>
                        <p className="text-sm text-gray-400">Visualizar conflitos detectados</p>
                    </a>

                    <a
                        href="/simulation"
                        className="glass-hover p-6 text-center group cursor-pointer"
                    >
                        <CheckCircle className="mx-auto mb-3 text-green-400 group-hover:scale-110 transition-transform" size={32} />
                        <h3 className="font-semibold mb-1">Simular Cenário</h3>
                        <p className="text-sm text-gray-400">Testar cenários hipotéticos</p>
                    </a>
                </div>
            </div>

            {/* System Info */}
            <div className="card">
                <h2 className="text-xl font-bold mb-4">Informações do Sistema</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 glass rounded-lg">
                        <span className="text-gray-400">Backend API</span>
                        <span className="font-mono text-sm">http://127.0.0.1:8000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass rounded-lg">
                        <span className="text-gray-400">Versão</span>
                        <span className="font-mono text-sm">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass rounded-lg">
                        <span className="text-gray-400">Framework</span>
                        <span className="font-mono text-sm">LangGraph + FastAPI</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
