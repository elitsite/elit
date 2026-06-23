'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                router.push('/admin');
                router.refresh();
            } else {
                setError('Неверный пароль');
            }
        } catch {
            setError('Ошибка подключения');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 notranslate">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-zinc-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-[#D4AF37]" size={32} />
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-zinc-900">Админ-панель</h1>
                    <p className="text-zinc-500 mt-2 text-sm">Elite Bloemen</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            className="w-full p-4 pr-12 border border-zinc-200 rounded-xl focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition-colors"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full bg-[#1a1a1a] hover:bg-[#D4AF37] text-white hover:text-black py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                        Войти
                    </button>
                </form>

                <p className="text-center text-zinc-400 text-sm mt-6">
                    Введите пароль администратора
                </p>
            </div>
        </div>
    );
}
