import { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { FeedbackRequest } from '../services/api';

const Feedback = () => {
    const [formData, setFormData] = useState<FeedbackRequest>({
        execution_id: '',
        solution_id: '',
        accepted: true,
        manager_rating: 5,
        implementation_result: 'success',
        context: {},
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await apiService.submitFeedback(formData);
            setResult(response);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao enviar feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Enviar Feedback</h1>
                <p className="text-gray-400 mt-1">Avalie a efetividade das soluções implementadas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare size={24} className="text-primary-400" />
                        Formulário de Feedback
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Execution ID */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Execution ID</label>
                            <input
                                type="text"
                                value={formData.execution_id}
                                onChange={(e) => setFormData({ ...formData, execution_id: e.target.value })}
                                placeholder="550e8400-e29b-41d4-a716-446655440000"
                                className="input-field w-full"
                                required
                            />
                        </div>

                        {/* Solution ID */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Solution ID</label>
                            <input
                                type="text"
                                value={formData.solution_id}
                                onChange={(e) => setFormData({ ...formData, solution_id: e.target.value })}
                                placeholder="sol-001"
                                className="input-field w-full"
                                required
                            />
                        </div>

                        {/* Accepted */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Solução Aceita?</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, accepted: true })}
                                    className={`flex-1 py-3 rounded-lg transition-all ${formData.accepted
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                        : 'glass-hover'
                                        }`}
                                >
                                    ✓ Sim
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, accepted: false })}
                                    className={`flex-1 py-3 rounded-lg transition-all ${!formData.accepted
                                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                                        : 'glass-hover'
                                        }`}
                                >
                                    ✗ Não
                                </button>
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Avaliação (1-5)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, manager_rating: rating })}
                                        className={`flex-1 p-3 rounded-lg transition-all ${formData.manager_rating >= rating
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                            : 'glass-hover'
                                            }`}
                                    >
                                        <Star
                                            size={24}
                                            className={`mx-auto ${formData.manager_rating >= rating ? 'fill-current' : ''
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-gray-400 mt-2 text-center">
                                {formData.manager_rating} estrela{formData.manager_rating !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Implementation Result */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Resultado da Implementação</label>
                            <select
                                value={formData.implementation_result}
                                onChange={(e) => setFormData({ ...formData, implementation_result: e.target.value as any })}
                                className="input-field w-full"
                            >
                                <option value="success">Sucesso</option>
                                <option value="partial">Parcial</option>
                                <option value="failed">Falhou</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Enviar Feedback
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Result */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Resultado</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4 animate-slide-up">
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                <CheckCircle className="text-green-400" size={24} />
                                <div>
                                    <p className="font-semibold">Feedback Enviado!</p>
                                    <p className="text-sm text-gray-400">{result.message}</p>
                                </div>
                            </div>

                            <div className="glass p-4 rounded-lg">
                                <p className="text-sm text-gray-400">Status</p>
                                <p className="font-semibold mt-1">
                                    {result.continued ? 'Análise continuada' : 'Feedback registrado'}
                                </p>
                            </div>
                        </div>
                    )}

                    {!result && !error && (
                        <div className="text-center py-12 text-gray-500">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Preencha o formulário para enviar feedback</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feedback;
