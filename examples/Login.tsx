import React from 'react';
import { AppLayout } from './AppLayout';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

export function Login() {
  return (
    <AppLayout activeTab="none">
      <div className="flex flex-col min-h-[100dvh] relative">
        {/* Background decorations */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col justify-center px-6 py-12 z-10">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 mb-6">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-2">GestãoPro</h1>
            <p className="text-slate-400 text-sm font-medium">Controle financeiro e do lar</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="voce@email.com" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Senha</label>
                  <a href="#" className="text-xs font-medium text-blue-500 hover:text-blue-400">Esqueceu?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 mt-6 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
                Entrar na conta
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-3 text-slate-500 font-medium">Ou continue com</span>
                </div>
              </div>

              <button className="w-full mt-6 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl py-3.5 flex items-center justify-center gap-3 transition-colors active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Entrar com Google
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Não tem uma conta? <a href="#" className="text-blue-500 font-semibold hover:text-blue-400">Criar agora</a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}