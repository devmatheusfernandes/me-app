'use server';

import { protectedAction } from '@/lib/safe-action';
import { z } from 'zod';
import { financeService } from './finance.service';
import { financeRepository } from './finance.repository';
import {
  AddExpenseSchema,
  EditExpenseSchema,
  ToggleExpensePaidSchema,
  AddIncomeSchema,
  EditIncomeSchema,
  DeleteTransactionSchema,
  AddGoalSchema,
  EditGoalSchema,
  DeleteGoalSchema,
  GoalContributionSchema,
  AllocateIncomeToGoalSchema,
} from './finance.schema';
import { revalidatePath } from 'next/cache';

export const closeMonthAction = protectedAction
  .schema(z.object({ monthYear: z.string().regex(/^\d{4}-\d{2}$/) }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await financeService.closeMonth(ctx.user.id, parsedInput.monthYear);
    revalidatePath('/dashboard');
    revalidatePath('/financial');
    return { success: true, ...result };
  });

export const addFixedExpenseAction = protectedAction
  .schema(AddExpenseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await financeRepository.addFixedExpense({
      ...parsedInput,
      user_id: ctx.user.id,
    });
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  });

export const editFixedExpenseAction = protectedAction
  .schema(EditExpenseSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    await financeRepository.updateFixedExpense(id, data);
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const toggleExpensePaidAction = protectedAction
  .schema(ToggleExpensePaidSchema)
  .action(async ({ parsedInput }) => {
    await financeRepository.toggleExpensePaid(
      parsedInput.id,
      parsedInput.is_paid,
      parsedInput.paid_amount
    );
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const deleteExpenseAction = protectedAction
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await financeRepository.deleteFixedExpense(parsedInput.id);
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const addIncomeAction = protectedAction
  .schema(AddIncomeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await financeRepository.addTransaction({
      ...parsedInput,
      user_id: ctx.user.id,
      type: 'income',
    });
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  });

export const editIncomeAction = protectedAction
  .schema(EditIncomeSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    await financeRepository.updateTransaction(id, {
      ...data,
      type: 'income',
    });
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const deleteTransactionAction = protectedAction
  .schema(DeleteTransactionSchema)
  .action(async ({ parsedInput }) => {
    await financeRepository.deleteTransaction(parsedInput.id);
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const addGoalAction = protectedAction
  .schema(AddGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const created = await financeRepository.addGoal({
      ...parsedInput,
      user_id: ctx.user.id,
    });
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  });

export const editGoalAction = protectedAction
  .schema(EditGoalSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    await financeRepository.updateGoal(id, data);
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const deleteGoalAction = protectedAction
  .schema(DeleteGoalSchema)
  .action(async ({ parsedInput }) => {
    await financeRepository.deleteGoal(parsedInput.id);
    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const addGoalContributionAction = protectedAction
  .schema(GoalContributionSchema)
  .action(async ({ parsedInput }) => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: goal } = await supabase
      .from('goals')
      .select('current_amount')
      .eq('id', parsedInput.goal_id)
      .single();

    if (goal) {
      const updatedAmount = Number(goal.current_amount || 0) + parsedInput.amount;
      await financeRepository.updateGoalAmount(parsedInput.goal_id, updatedAmount);
    }

    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { success: true };
  });

export const allocateIncomeToGoalAction = protectedAction
  .schema(AllocateIncomeToGoalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const res = await financeService.allocateIncomeToGoal(ctx.user.id, {
      goal_id: parsedInput.goal_id,
      income_name: parsedInput.income_name,
      amount: parsedInput.amount,
      reference_month: parsedInput.reference_month,
    });

    revalidatePath('/financial');
    revalidatePath('/dashboard');
    return { ...res };
  });
