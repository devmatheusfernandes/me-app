import { createSafeActionClient } from 'next-safe-action';
import { createClient } from '@/lib/supabase/server';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error('Action error:', e);
    return e.message || 'Ocorreu um erro interno no servidor.';
  },
});

export const protectedAction = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Não autorizado. Por favor faça login novamente.');
  }

  return next({ ctx: { user, supabase } });
});
