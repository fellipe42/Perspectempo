# Supabase Setup

1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. No Supabase, habilite os providers `Email` e `Google`.
4. Execute o SQL de `supabase/migrations/20260423_auth_sync.sql`.
5. Cadastre `http://localhost:5173` e a URL de produção nas redirect URLs do projeto.

# Teste Local

1. Abra o app sem login e confirme que ele continua funcionando local/offline.
2. Crie conta por e-mail/senha ou entre com Google.
3. Se já existirem dados locais, escolha explicitamente entre subir o local ou manter a nuvem.
4. Faça alterações no plano/sessões, recarregue a aba e valide o status de sync.
5. Abra em outro dispositivo autenticado para recuperar o snapshot.
6. Fique offline, altere dados, volte online e use `sincronizar agora`.

# Limite Atual

O sync desta sprint usa um snapshot JSON por usuário com `last write wins`. Se dois dispositivos editarem ao mesmo tempo, a escrita mais recente sobrescreve a anterior.
