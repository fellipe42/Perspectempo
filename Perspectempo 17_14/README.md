# Perspectempo — protótipo local

App de **perspectiva temporal e alocação consciente da vida**.
Você define quanto tempo tem acordado, distribui esse tempo entre categorias, registra no que está gastando, e o app mostra:

- Saldo por categoria (planejado × realizado)
- Excesso de uma categoria e **de quem** ele está roubando tempo
- Score de **enjoyment** e **future** do dia
- Classificação: **Ideal / Pleasure-heavy / Duty-heavy / Drift**
- Hábitos satisfeitos automaticamente quando uma categoria atinge tempo mínimo
- Visão semanal e projeção composta

Tudo offline. Tudo local. Nada sai do seu computador.

---

## Como rodar

Pré-requisito: **Node 18+**.

```bash
cd C:\Projetos\Perspectempo
npm install
npm run dev
```

O Vite vai abrir automaticamente em <http://localhost:5173>.

Build de produção (opcional):

```bash
npm run build
npm run preview
```

---

## Estrutura

```
src/
├── domain/   ← lógica pura, sem React, reaproveitável em mobile
├── data/     ← persistência (localStorage hoje, SQLite/MMKV amanhã)
├── state/    ← Zustand
└── ui/       ← React + Tailwind
```

A lógica de **scoring** e **time theft** está em funções puras testáveis.
Para portar pra mobile basta reusar `domain/` e trocar `data/storage.ts`
e a camada `ui/`.

---

## Como usar

1. **Abra o app.** Já vem com 10 categorias e 3 hábitos default.
2. **Edite o plano** (botão "Editar plano" na tela Hoje):
   - Ajuste suas horas acordado
   - Distribua os minutos entre as categorias
3. **Comece a rastrear:** clique numa categoria → o cronômetro inicia.
4. **Troque com 1 clique:** clicando em outra categoria, encerra a anterior e começa a nova.
5. **Encerre:** clique de novo na ativa, ou no botão "Encerrar" do cronômetro.
6. **Veja o Mapa do Dia** quando quiser uma leitura completa.
7. **Aba Perspectiva:** semana atual em blocos coloridos, distribuição agregada e projeção composta.

---

## Dados

- Tudo é salvo em `localStorage` sob a chave `perspectempo:v1:state`.
- Use o botão **Exportar** no header para baixar um JSON com todos os dados.
- Use **Resetar** se quiser começar do zero.
- Fechar e reabrir o navegador preserva tudo.

---

## O que testar nos primeiros 3 dias

### Dia 1 — calibração
- [ ] Ajuste horas acordado para o seu real (ex: 16h).
- [ ] Reduza/aumente categorias para algo que faça sentido pra você hoje.
- [ ] Use o app por **um bloco real de trabalho** (1–2h). Veja se trocar de atividade é fluido.
- [ ] Estoure propositalmente uma categoria de baixa prioridade. Confira o banner de excesso e leia o "roubando de X".
- [ ] Abra o **Mapa do Dia** ao final. A classificação faz sentido pra como você sentiu o dia?

### Dia 2 — fricção real
- [ ] Use o app o dia inteiro.
- [ ] Sempre que pegar o celular pra scrollar, registre como "Scroll/Distrações". É desconfortável? Bom — é o ponto.
- [ ] Tente atingir os 3 hábitos default (Treino 20m, Casa 20m, Estudo 30m).
- [ ] No fim do dia, anote (mentalmente) se a classificação bateu com sua percepção subjetiva. Se não bateu, anote o motivo — será input pra calibrar pesos.

### Dia 3 — perspectiva
- [ ] Abra a aba **Perspectiva**.
- [ ] Olhe os 3 dias coloridos. Que padrão você vê?
- [ ] Olhe a **projeção composta**: se mantiver este ritmo, quanto vai render em 6 meses?
- [ ] Olhe os **life weeks**. A semana em verde — você gostou de como ela foi?
- [ ] Decida: o app está te dando o tipo de espelho que você queria? O que falta?

### Sinais de que vale escalar
- Você se pega checando o saldo de categorias antes de decidir o que fazer.
- A classificação te incomoda quando é "Drift" — e isso muda comportamento.
- Você quer compartilhar prints com alguém.

### Sinais de que precisa pivotar
- Você esquece de rastrear depois do segundo dia.
- A classificação parece desconectada da sua experiência subjetiva.
- O excesso e o roubo não te ajudam a tomar decisões — só geram culpa.

---

## Roadmap pós-MVP

- **Fase 2:** Edição de categorias e hábitos pela UI (hoje só via JSON).
- **Fase 3:** Notificações de excedente, atalhos de teclado.
- **Fase 4:** Empacotar com **Tauri** para rodar como app desktop nativo.
- **Fase 5:** Reusar `domain/` em React Native / Expo para a versão mobile.

---

## Decisões e trade-offs

| Decisão | Razão |
|---|---|
| `localStorage` | Zero infra; troca trivial pelo `Storage` adapter quando precisar |
| Sem Tauri agora | Velocidade de iteração; wrap depois é direto |
| Sem testes formais | Domínio é puro; adicionar Vitest é trivial — foco agora é loop real |
| Sessão pertence ao dia em que começou | Simplificação MVP; sessões cruzando meia-noite serão raras enquanto valida |
| Categorias default fixas | UX rápida pra começar; edição visual fica pra Fase 2 |
