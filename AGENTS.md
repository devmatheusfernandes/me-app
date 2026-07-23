<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# GESTÃO PESSOAL INTEGRADA — Agent Instructions

> **Leia PRIMEIRO. Este é o índice mestre do projeto.** As regras detalhadas vivem nos arquivos de `rules/`, as skills em `skills/`. Este arquivo conecta tudo e resolve ambiguidades.
> Preferencialmente verifique 'rules' e as 'skills' apenas quando for necessário. O foco do sistema é a gestão financeira (rollover mensal), estoque doméstico e lista de compras inteligente.

---

## 🚫 O Que NUNCA Fazer (Anti-Patterns)

1. **NUNCA** use `"use client"` em `page.tsx` ou `layout.tsx`.
2. **NUNCA** acesse o Repository de um módulo a partir de outro módulo. Use o Service.
3. **NUNCA** retorne erros crus de banco (Supabase/PostgreSQL) para o cliente. Use Error Masking via `safe-action.ts` ou tratativas customizadas.
4. **NUNCA** escreva lógica de negócio (ex: cálculo de limite mensal, rollover, ou baixa de estoque) em Hooks, Components ou Actions. A lógica vive no Service.
5. **NUNCA** crie pastas globais como `/services` ou `/repositories`. Use Vertical Slicing em `/modules/` (ex: `/modules/inventory`, `/modules/finance`, `/modules/shopping`).
6. **NUNCA** busque dados no Client Component diretamente do banco.
7. **NUNCA** use `try/catch` em Components para capturar erros do Supabase Auth. Exiba erros via `toast.error()`, nunca com estado inline (`setLocalError`).
8. **NUNCA** faça chamadas `fetch("/api/...")` diretas do frontend para mutações de dados. Use Server Actions.
9. **NUNCA** gerencie estado de formulários complexos manualmente com `useState`. Use **React Hook Form** + **Zod** (com `@hookform/resolvers/zod`) para validação e consistência.

---

## 🏗️ Arquitetura: Thin Client, Fat Server

```text
Client = "Burro" → Renderiza UI (shadcn/ui) + captura intenções do usuário
Server = "Gordo" → Toda inteligência, Supabase RLS, cálculos de saldo/estoque

```

### O Padrão "Sanduíche" (Data Flow)

```text
1. Server (Read)    → page.tsx busca dados via Service (SSR).
2. Client (Interact) → page.tsx passa dados via props para _components/ (Client Components).
3. Server (Write)   → Client Component chama Server Action para mutações no banco.

```

### Exemplo Canônico Completo (Domínio de Compras/Mercado)

```text
app/(dashboard)/market/
├── page.tsx                    ← RSC: busca dados do mês, verifica sessão
└── _components/
    └── ShoppingItemCard.tsx    ← "use client": renderiza UI, chama Actions

modules/shopping/
├── shopping.schema.ts          ← Zod schemas para validação e tipagem
├── shopping.repository.ts      ← Queries puras (Supabase: supabase.from(...))
├── shopping.service.ts         ← Regras de negócio (ex: abater do limite, atualizar estoque)
├── shopping.actions.ts         ← Zod validation + safe-action wrapper
└── shopping.types.ts           ← Tipos exportados (inferidos do Zod)

```

#### page.tsx (RSC — NUNCA "use client")

```tsx
// app/(dashboard)/market/page.tsx
import { shoppingService } from "@/modules/shopping/shopping.service";
import { createClient } from "@/lib/supabase/server";
import { ShoppingItemCard } from "./_components/ShoppingItemCard";

export default async function MarketPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pega o mês alvo via query param ou assume o mês atual
  const targetMonth = searchParams.month || "2026-07";
  const items = await shoppingService.getItemsByMonth(user.id, targetMonth);

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <ShoppingItemCard key={item.id} initialData={item} />
      ))}
    </div>
  );
}
```

#### Client Component (\_components/ — "use client" aqui)

```tsx
// app/(dashboard)/market/_components/ShoppingItemCard.tsx
"use client";
import { markAsBoughtAction } from "@/modules/shopping/shopping.actions";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export function ShoppingItemCard({ initialData }) {
  const handleBought = async () => {
    const result = await markAsBoughtAction({ itemId: initialData.id });
    if (result?.success) {
      toast({ title: "Item comprado com sucesso!" });
    } else {
      toast({
        title: "Erro",
        description: result?.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm flex justify-between">
      <span>
        {initialData.name} - {initialData.qty}
        {initialData.unit}
      </span>
      <Button onClick={handleBought}>Marcar como Comprado</Button>
    </div>
  );
}
```

#### Server Action (Porteiro — thin, sem lógica)

```tsx
// modules/shopping/shopping.actions.ts
"use server";
import { protectedAction } from "@/lib/safe-action"; // Seu wrapper de segurança
import { z } from "zod";
import { shoppingService } from "./shopping.service";
import { revalidatePath } from "next/cache";

export const markAsBoughtAction = protectedAction
  .schema(z.object({ itemId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    await shoppingService.markItemAsBought(ctx.user.id, parsedInput.itemId);
    revalidatePath("/market");
    return { success: true };
  });
```

#### Service (O Coração — toda a inteligência aqui)

```tsx
// modules/shopping/shopping.service.ts
import { shoppingRepository } from "./shopping.repository";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";

export const shoppingService = {
  async markItemAsBought(userId: string, itemId: string) {
    const item = await shoppingRepository.findById(itemId);
    if (!item) throw new Error("Item não encontrado");
    if (item.user_id !== userId) throw new Error("Sem permissão");

    // 1. Atualiza o status na lista de compras
    await shoppingRepository.updateStatus(itemId, "BOUGHT");

    // 2. Regra de Negócio: Se o item estiver linkado ao estoque da casa, atualiza a quantidade
    if (item.inventory_id) {
      await inventoryRepository.incrementQuantity(item.inventory_id, item.qty);
    }
  },
};
```

#### Repository (DB puro — sem lógica, apenas acessa o Supabase)

```tsx
// modules/shopping/shopping.repository.ts
import { createClient } from "@/lib/supabase/server";
import { ShoppingItem } from "./shopping.schema";

export const shoppingRepository = {
  async findById(id: string): Promise<ShoppingItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error("Erro ao buscar item no banco de dados");
    return data;
  },

  async updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("shopping_list").update({ status }).eq("id", id);
  },
};
```

---

## 📐 Regras Detalhadas (Referências)

As regras completas vivem em arquivos separados. **Leia-os quando for implementar:**

| Arquivo                         | Conteúdo                                                                       | Quando ler                |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------- |
| `.agents/rules/architecture.md` | Paradigma Thin/Fat, Bounded Contexts, Rollover Mensal                          | Sempre                    |
| `.agents/rules/structure.md`    | Padrão Sanduíche, regras de RSC, Client Components, Server Actions             | Sempre                    |
| `.agents/rules/primitives.md`   | O que cada camada FAZ e NÃO FAZ (Repository, Service, Action, Hook, Component) | Ao criar qualquer arquivo |

---

## 🛠️ Skills — Quando Usar Qual

Cada skill é um manual especializado. **Use a skill correspondente ao tipo de arquivo que está criando:**

| Quando o pedido envolve...   | Skill              | Arquivo                            |
| ---------------------------- | ------------------ | ---------------------------------- |
| Criar Zod Schemas e Tipagens | **Model & Schema** | `.agents/skills/model-writer.md`   |
| Lógica de abatimento/estoque | **Service Layer**  | `.agents/skills/service-writer.md` |
| Mutações e Formulários       | **Server Actions** | `.agents/skills/action-writer.md`  |
| Shadcn/ui e states de tela   | **UI Hooks**       | `.agents/skills/hook-writer.md`    |
| Integração Supabase Auth     | **Auth Rules**     | `.agents/skills/auth-writer.md`    |

---

## 📏 Convenções de Naming

```text
modules/[domain]/[domain].schema.ts      → Zod Schemas
modules/[domain]/[domain].repository.ts  → Queries puras (Supabase)
modules/[domain]/[domain].service.ts     → Lógica de negócio (Rollover, Saldo, Estoque)
modules/[domain]/[domain].actions.ts     → Server Actions (porteiro)
modules/[domain]/[domain].types.ts       → Tipos compartilhados (z.infer)

app/(dashboard)/[feature]/page.tsx       → RSC (NUNCA "use client")
app/(dashboard)/[feature]/_components/   → Client Components locais (React Hook Form, Shadcn)

components/ui/                           → Design System (Shadcn UI)
components/layout/                       → Header, Sidebar (Seletor de Mês)
lib/supabase/                            → Configuração e clientes do Supabase (Server/Client)
utils/                                   → Funções puras (formatação de moeda R$, datas)

```

---

## ⚡ Quick Reference: Camadas e Responsabilidades

```text
┌─────────────────────────────────────────────────────────────────┐
│ page.tsx (RSC)          → Busca dados, verifica sessão          │
│   └─ _components/*.tsx  → "use client", UI, Form, chama Actions │
│        └─ Action        → Valida Zod, pega user, chama Service  │
│            └─ Service   → Regras (Finanças/Estoque), orquestra  │
│                 └─ Repository → Queries puras do Supabase       │
└─────────────────────────────────────────────────────────────────┘

```

| Camada        | Conhece Next.js? | Conhece Banco? | Tem Lógica de Negócio? |
| ------------- | ---------------- | -------------- | ---------------------- |
| page.tsx      | ✅               | Via Service    | ❌                     |
| \_components/ | ✅               | ❌             | ❌                     |
| Action        | ✅ (revalidate)  | ❌             | ❌                     |
| Service       | ❌               | Via Repository | ✅                     |
| Repository    | ❌               | ✅ (Supabase)  | ❌                     |
| Hook          | ✅               | ❌             | ❌                     |
