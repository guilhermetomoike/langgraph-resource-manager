import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    AlertTriangle,
    Lightbulb,
    MessageSquare,
    FlaskConical,
    Menu,
    X,
    Cpu
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/orchestration', icon: Cpu, label: 'Orquestração' },
        { path: '/analyze', icon: Search, label: 'Analisar Recursos' },
        { path: '/conflicts', icon: AlertTriangle, label: 'Conflitos' },
        { path: '/solutions', icon: Lightbulb, label: 'Soluções' },
        { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
        { path: '/simulation', icon: FlaskConical, label: 'Simulação' },
    ];

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-lg"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 
          transition-all duration-300 z-40 shadow-xl
          ${isOpen ? 'w-64' : 'w-0'}
        `}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="text-gray-200" size={24} />
                        </div>
                        {isOpen && (
                            <div>
                                <h1 className="text-xl font-bold text-gray-100">PDP - Módulo</h1>
                                <p className="text-xs text-gray-400">Gestão de Recursos</p>
                            </div>
                        )}
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                    ${isActive
                                            ? 'bg-gray-700 text-white shadow-md'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        }

                  `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer */}
                {isOpen && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700/50">
                        <div className="text-xs text-gray-500">
                            <p>v1.0.0</p>
                            <p className="mt-1">© 2026 LangGraph</p>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
