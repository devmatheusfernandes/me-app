'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInSchema, type SignInInput } from '@/modules/auth/auth.schema';
import { signInAction } from '@/modules/auth/auth.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInInput) => {
    const result = await signInAction(data);

    if (result?.data?.success) {
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
      router.refresh();
    } else {
      const errorMsg = result?.data?.error || result?.serverError || 'Falha ao realizar login';
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
          E-mail
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail size={18} className="text-slate-500" />
          </div>
          <input
            type="email"
            placeholder="voce@email.com"
            {...register('email')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        {errors.email && (
          <p className="text-xs font-medium text-rose-500 ml-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Senha
          </label>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500" />
          </div>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-rose-500 ml-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 mt-6 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Entrando...
          </>
        ) : (
          <>
            Entrar na conta <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="mt-8 text-center pt-2">
        <p className="text-slate-500 text-sm">
          Não tem uma conta?{' '}
          <Link href="/signup" className="text-blue-500 font-semibold hover:text-blue-400">
            Criar agora
          </Link>
        </p>
      </div>
    </form>
  );
}
