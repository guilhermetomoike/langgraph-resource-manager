import { useState } from 'react';
import { Search, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisRequest } from '../services/api';

const AnalyzeResources = () => {
    const [formData, setFormData] = useState<AnalysisRequest>({
        project_ids: [''],
        start_date: '',
        end_date: '',
        callback_url: '',
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await apiService.analyzeResources({
                ...formData,
                project_ids: formData.project_ids.filter(id => id.trim() !== ''),
            });
            setResult(response);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao analisar recursos');
        } finally {
            setLoading(false);
        }
    };

    const addProjectId = () => {
        setFormData({
            ...formData,
            project_ids: [...formData.project_ids, ''],
        });
    };

    const updateProjectId = (index: number, value: string) => {
        const newIds = [...formData.project_ids];
        newIds[index] = value;
        setFormData({ ...formData, project_ids: newIds });
    };

    const removeProjectId = (index: number) => {
        const newIds = formData.project_ids.filter((_, i) => i !== index);
        setFormData({ ...formData, project_ids: newIds });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gradient">Analisar Recursos</h1>
                <p className="text-gray-400 mt-1">Inicie uma nova análise de recursos de projetos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Search size={24} className="text-primary-400" />
                        Configurar Análise
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Project IDs */}
                        <div>
                            <label className="block text-sm font-medium mb-2">IDs dos Projetos</label>
                            {formData.project_ids.map((id, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={id}
                                        onChange={(e) => updateProjectId(index, e.target.value)}
                                        placeholder={`Projeto ${index + 1}`}
                                        className="input-field flex-1"
                                        required
                                    />
                                    {formData.project_ids.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProjectId(index)}
                                            className="glass-hover px-4 py-2 rounded-lg text-red-400"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addProjectId}
                                className="btn-secondary w-full mt-2"
                            >
                                + Adicionar Projeto
                            </button>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Data Início</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="input-field w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Data Fim</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="input-field w-full"
                                    required
                                />
                            </div>
                        </div>

                        {/* Callback URL (optional) */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Callback URL (Opcional)</label>
                            <input
                                type="url"
                                value={formData.callback_url}
                                onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                                placeholder="https://seu-sistema.com/callback"
                                className="input-field w-full"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Search size={20} />
                                    Iniciar Análise
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Resultado</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4 animate-slide-up">
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                <CheckCircle className="text-green-400" size={24} />
                                <div>
                                    <p className="font-semibold">Análise Concluída!</p>
                                    <p className="text-sm text-gray-400">{result.message}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="glass p-4 rounded-lg">
                                    <p className="text-sm text-gray-400">Execution ID</p>
                                    <p className="font-mono text-sm mt-1">{result.execution_id}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass p-4 rounded-lg">
                                        <p className="text-sm text-gray-400">Conflitos</p>
                                        <p className="text-2xl font-bold text-orange-400">{result.total_conflicts}</p>
                                    </div>
                                    <div className="glass p-4 rounded-lg">
                                        <p className="text-sm text-gray-400">Soluções</p>
                                        <p className="text-2xl font-bold text-green-400">{result.total_solutions}</p>
                                    </div>
                                </div>

                                <div className="glass p-4 rounded-lg">
                                    <p className="text-sm text-gray-400">Status</p>
                                    <p className="font-semibold mt-1">{result.stage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!result && !error && (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Preencha o formulário e inicie uma análise</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzeResources;
