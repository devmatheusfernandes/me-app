'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpSchema, type SignUpInput } from '@/modules/auth/auth.schema';
import { signUpAction } from '@/modules/auth/auth.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    const result = await signUpAction(data);

    if (result?.data?.success) {
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      router.push('/login');
    } else {
      const errorMsg = result?.data?.error || result?.serverError || 'Falha ao criar conta';
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
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
          Senha
        </label>
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

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
          Confirmar Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500" />
          </div>
          <input
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-rose-500 ml-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 mt-6 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Criando conta...
          </>
        ) : (
          <>
            Criar minha conta <UserPlus size={18} />
          </>
        )}
      </button>

      <div className="mt-8 text-center pt-2">
        <p className="text-slate-500 text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-blue-500 font-semibold hover:text-blue-400">
            Fazer login
          </Link>
        </p>
      </div>
    </form>
  );
}
