import { Bell, User, LayoutDashboard, Cpu, Search, AlertTriangle, Lightbulb, MessageSquare, FlaskConical } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const location = useLocation();



    return (
        <header className="top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between gap-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="text-gray-200" size={20} />
                        </div>
                        <span className="text-sm font-semibold text-gray-100 hidden sm:block">Resource Manager</span>
                    </Link>



                    {/* Ações do Usuário */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="hover:bg-gray-800 p-2 rounded-lg relative transition-colors duration-200">
                            <Bell size={18} className="text-gray-300" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        </button>

                        <button className="hover:bg-gray-800 p-2 rounded-lg transition-colors duration-200">
                            <User size={18} className="text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
