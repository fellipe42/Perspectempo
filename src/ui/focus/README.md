# Módulo Focus

Componentes da experiência de foco/cronômetro. **Auto-contidos** — podem ser extraídos desta pasta sem quebrar o resto do app.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `FocusRing.tsx` | Componente puro SVG. Recebe só números e cores. **Zero dependência de DOM além de SVG.** |
| `FocusBlock.tsx` | Composição do Ring com cronômetro central e controles — para a tela Hoje. |
| `FocusMode.tsx` | Overlay fullscreen silencioso. Usa o Ring em tamanho grande. |
| `useWakeLock.ts` | Hook para Wake Lock API com fallback silencioso quando não suportado. |
| `verbs.ts` | Mapa categoria → gerúndio em PT-BR. |

## Portabilidade para wearable / smartwatch

`FocusRing` foi desenhado como primitivo gráfico. Para adaptar em wearable:

1. **React Native (Apple Watch / WearOS via Expo):**
   - Substituir o SVG por `react-native-svg` (API é equivalente).
   - Remover `foreignObject` + conteúdo central — renderizar o cronômetro sobreposto via `View` absoluto no lugar.
   - Tudo mais (geometria, cálculo de frações, animação) é preservado.

2. **Always-on display:**
   - O `pulsing={false}` é o default quando não há sessão — adequado para AOD.
   - Para economia de bateria em telas OLED: passar `color="#ffffff"` e fundo preto puro. A geometria segue idêntica.
   - O anel interno (referência do dia) pode ser omitido passando `awakeMinutes={0}` — o hook do render já trata.

3. **Legibilidade à distância:**
   - Para smartwatch (ex. 200px real), testar com `size={180}`.
   - Reduzir `strokeWidth` não é necessário — as proporções já são relativas ao viewBox de 100×100.

## Wake Lock — trade-offs

- Só é ativado quando o **Modo Foco** está aberto (não na tela Hoje default).
- Libera automaticamente no unmount, no `close()`, ou quando a aba perde visibilidade.
- Browsers sem suporte (Safari iOS &lt; 16.4, alguns embeds): o hook retorna `supported: false` e o overlay continua funcional, apenas sem travar a tela.
- Impacto em bateria é restrito à duração da sessão de foco. Aceitável.

## Princípio de design

Este módulo é intencionalmente **visualmente reducionista** mesmo com toda informação presente:

- Uma cor dominante (a da categoria).
- Tipografia serif só no número grande (o momento).
- Nenhum ícone.
- Animação mínima (um pulso a cada 3s).

Se for tentado adicionar confetti, streaks ou sons de vitória: não é este módulo.
