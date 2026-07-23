Contexto do Projeto:
Atue como um Desenvolvedor Full-Stack Sênior e UI/UX Designer. O objetivo é criar um aplicativo web responsivo (mobile-first) para gestão pessoal integrada. O sistema deve focar fortemente na gestão mensal com transporte de saldos (rollover de orçamento), conectando Controle Financeiro, Estoque Doméstico e Lista de Compras Inteligente.

Stack Tecnológico:

Frontend: Next.js (App Router), React, Tailwind CSS.

UI/Componentes: Lucide React e shadcn/ui.

Backend/DB: Supabase (PostgreSQL e Auth).

Estrutura de Banco de Dados Sugerida (Supabase):

monthly_summaries: month_year (ex: 2026-07), total_income, total_fixed_expenses, market_limit, market_spent, rollover_balance (saldo transportado do mês anterior, positivo ou negativo).

transactions: id, type (income, expense), category, amount, date, reference_month.

fixed_expenses: id, name, expected_amount, due_day, reference_month, is_paid.

inventory: id, name, category, current_qty, min_qty, unit (kg, un).

shopping_list: id, name, qty, unit, estimated_price, total_price, category, market_name (Cooper, Veneza), target_month, status (pending, bought, postponed).

Telas e Funcionalidades Detalhadas (Features):

1. Navegação Global e Controle de Mês

Header fixo contendo um seletor de Mês/Ano (ex: Julho 2026). A alteração deste seletor deve mudar os dados de todas as telas do aplicativo simultaneamente.

2. Tela de Dashboard (Visão Mensal)

Card de Resumo Financeiro: Exibe Receitas Totais, Despesas Fixas Pagas/Pendentes e o Saldo Livre.

Card de Termômetro do Mercado: Mostra o Limite do Mês (ex: R$ 2.000,00), ajustado pelo "Rollover" do mês anterior. Se sobrou R$ 200 no mês passado, o limite atual é R$ 2.200,00. Se estourou R$ 100, o limite cai para R$ 1.900,00. Mostra uma barra de progresso com o valor já gasto.

Alerta de Fechamento: Um botão para "Fechar o Mês", que calcula o que sobrou ou faltou e injeta no mês seguinte.

3. Módulo Financeiro (Despesas e Metas)

Tabela de Contas: Lista de despesas fixas (Luz, Internet, Assinaturas). Inclui um checkbox grande e amigável para celular para marcar como "Pago".

Acompanhamento de Metas: Barras de progresso para objetivos de longo prazo (Reserva de Emergência, Troca de Carro), com botão rápido para adicionar aportes no mês vigente.

4. Módulo de Estoque (Inventário)

Gestão Rápida: Lista de produtos com botões [+ e -] grandes para atualizar a quantidade atual da despensa.

Gatilho Automático: Quando um item atinge a quantidade mínima, o sistema pergunta: "Adicionar à lista de compras deste mês ou do próximo?".

Compra Antecipada (Promoção): Botão em itens do estoque para registrar uma compra avulsa por motivo de promoção. Ele abate o valor do orçamento do mês atual e atualiza o estoque instantaneamente, sem precisar passar pela lista de compras padrão.

5. Módulo de Lista de Compras (Mercado)

Painel de Orçamento Dinâmico: No topo da tela, exibir o valor disponível para gastar no mercado no mês selecionado. Ao marcar um item como "comprado", esse valor diminui em tempo real.

Adição de Itens: Formulário com Nome, Mercado (Cooper, Veneza), Categoria (Doces, Carnes, Limpeza, etc), Quantidade e Valor. O app calcula o Total da linha automaticamente.

Ações Avançadas por Item (Deslizar para o lado ou Menu de 3 pontos):

"Adiar para o próximo mês": Muda o target_month do item. Ele some da lista atual e aparecerá automaticamente na lista do mês seguinte, aliviando o orçamento do mês atual.

"Comprado": Risca o item, atualiza o total gasto e aumenta a quantidade no Módulo de Estoque.

Regras de Design e Comportamento:

A interface deve usar o padrão Dark Mode/Light Mode. Tons de verde para saldo positivo/disponível, tons de vermelho para limite excedido.

Tabelas e listas devem ser otimizadas para toque (touch-friendly), evitando botões minúsculos.
