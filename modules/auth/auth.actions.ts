'use server';

import { actionClient } from '@/lib/safe-action';
import { createClient } from '@/lib/supabase/server';
import { SignInSchema, SignUpSchema } from './auth.schema';
import { redirect } from 'next/navigation';

export const signInAction = actionClient
  .schema(SignInSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (error) {
      return { success: false, error: 'E-mail ou senha incorretos' };
    }

    return { success: true };
  });

export const signUpAction = actionClient
  .schema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (error) {
      return { success: false, error: error.message || 'Erro ao criar conta' };
    }

    return { success: true };
  });

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
};
