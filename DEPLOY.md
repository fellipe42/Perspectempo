# Deploy — Perspectempo

Guia curto e direto para colocar o protótipo no ar em **perspectempo.com** via Vercel. Sem backend, sem auth, sem infra. Tudo é estático e local.

---

## 1. Pré-requisitos

- Conta na [Vercel](https://vercel.com) (Hobby grátis dá conta).
- Repositório no GitHub/GitLab (ou suba via `vercel` CLI).
- Domínio `perspectempo.com` registrado em algum registrar (Registro.br, Namecheap, etc.).

---

## 2. Build local (sanidade)

```bash
npm install
npm run build
npm run preview   # serve dist/ em localhost:4173
```

A pasta `dist/` é o que vai pro deploy.

---

## 3. Deploy na Vercel

### 3a. Via dashboard (mais simples)

1. New Project → importe o repositório.
2. Framework: **Vite** (auto-detectado).
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Deploy.

A `vercel.json` na raiz já define:
- SPA rewrite (rotas → `index.html`),
- cache imutável em `/assets/*`,
- `no-cache` em `sw.js` e `index.html` (atualização confiável).

### 3b. Via CLI

```bash
npm i -g vercel
vercel               # primeiro deploy (preview)
vercel --prod        # promove para produção
```

---

## 4. Domínio perspectempo.com

### 4.1. Adicionar na Vercel

Project → Settings → Domains → `Add` → digite `perspectempo.com` e `www.perspectempo.com`.

A Vercel mostrará os registros DNS necessários.

### 4.2. Configurar DNS no registrar

Apex (`perspectempo.com`):
- **Tipo A** → `76.76.21.21`
  *(ou ALIAS/ANAME apontando para `cname.vercel-dns.com` se o registrar suportar)*

WWW (`www.perspectempo.com`):
- **Tipo CNAME** → `cname.vercel-dns.com`

Propagação: alguns minutos a algumas horas. Cheque com:
```bash
dig perspectempo.com
dig www.perspectempo.com
```

### 4.3. Redirecionamento

Decida na Vercel qual é o **canônico** (recomendo apex `perspectempo.com`) — a outra entrada redireciona automaticamente.

HTTPS é provisionado automaticamente pela Vercel (Let's Encrypt) assim que o DNS resolve.

---

## 5. PWA — instalação no celular

Após o primeiro acesso em `https://perspectempo.com`:

- **iOS / Safari:** Compartilhar → "Adicionar à Tela de Início".
- **Android / Chrome:** menu → "Instalar app" (ou banner automático).

Cuidados:
- O Service Worker (`/sw.js`) é registrado apenas em produção (em dev é desregistrado para não atrapalhar HMR).
- Cache estratégia: `network-first` para HTML, `cache-first` para `/assets/*`, `stale-while-revalidate` para o resto. Atualizações chegam no próximo load.
- Para forçar atualização imediata: bump na constante `VERSION` em `public/sw.js`.

---

## 6. Backup dos dados (multi-dispositivo)

O Perspectempo guarda tudo em `localStorage`. Para mover entre celular ↔ desktop:

1. **Exportar** no aparelho de origem (botão no header) → baixa `perspectempo-AAAA-MM-DD.json`.
2. Mande para si mesmo (e-mail, AirDrop, Drive).
3. **Importar** no aparelho de destino (botão no header) → confirma e substitui dados locais.

Validação básica de schema é feita no import. Versão futura tratará merge — hoje é substituição.

---

## 7. Rollback

Cada deploy é imutável na Vercel. Project → Deployments → escolha um anterior → "Promote to Production".

---

## 8. Atualizações futuras

Para um deploy novo:

```bash
git push origin main           # trigger automático na Vercel
# ou
vercel --prod                  # via CLI
```

Se mudou cache headers ou Service Worker, **bump** `VERSION` em `public/sw.js` para invalidar caches dos PWAs já instalados.

---

## 9. Checklist pré-produção

- [ ] `npm run build` passa sem warnings críticos.
- [ ] `npx tsc --noEmit` silente.
- [ ] Ícones presentes em `public/icons/` (192, 512, 512-maskable, apple-touch-icon).
- [ ] `manifest.webmanifest` aponta para os ícones corretos.
- [ ] `index.html` tem `<link rel="manifest">` e meta `theme-color`.
- [ ] Testado em desktop (Chrome/Firefox/Safari) e mobile (iOS Safari + Android Chrome).
- [ ] Export → Import roda em ciclo completo.
