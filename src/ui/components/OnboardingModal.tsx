// =====================================================================
// OnboardingModal — configuração inicial em 3 passos.
//
// Passo 1: Data de nascimento (Life Weeks)
// Passo 2: Horário de sono (sanidade de sessões)
// Passo 3: Confirmação
//
// Exibido uma única vez. Dismiss armazena onboardingDone = true.
// =====================================================================

import { useState } from 'react';
import { UserProfile } from '../../domain/types';

interface Props {
  onComplete: (profile: Omit<UserProfile, 'onboardingDone'>) => void;
}

type Step = 'birthdate' | 'sleep' | 'done';

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('birthdate');
  const [birthDate, setBirthDate] = useState('');
  const [sleepStart, setSleepStart] = useState(23);
  const [sleepEnd, setSleepEnd] = useState(7);

  function finish() {
    onComplete({
      birthDate: birthDate || undefined,
      sleepStartHour: sleepStart,
      sleepEndHour: sleepEnd,
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">

        {step === 'birthdate' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400 mb-4">
              1 de 2 · configuração rápida
            </div>
            <h2 className="font-serif text-2xl text-ink-100 mb-2 leading-snug">
              Quando você nasceu?
            </h2>
            <p className="text-sm text-ink-400 leading-relaxed mb-5">
              Usado apenas para calcular quantas semanas você já viveu na tela de
              Perspectiva. Opcional — você pode pular.
            </p>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={today}
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-ink-100 mb-5 focus:outline-none focus:border-ink-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep('sleep')}
                className="flex-1 py-2.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm text-ink-400 transition"
              >
                Pular
              </button>
              <button
                onClick={() => setStep('sleep')}
                className="flex-1 py-2.5 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 transition"
              >
                Próximo →
              </button>
            </div>
          </>
        )}

        {step === 'sleep' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.3em] text-ink-400 mb-4">
              2 de 2 · configuração rápida
            </div>
            <h2 className="font-serif text-2xl text-ink-100 mb-2 leading-snug">
              Horário típico de sono
            </h2>
            <p className="text-sm text-ink-400 leading-relaxed mb-5">
              Usado para detectar quando o cronômetro fica ligado durante a madrugada
              sem querer.
            </p>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs text-ink-400 mb-1.5 block">Dormir por volta de</label>
                <select
                  value={sleepStart}
                  onChange={e => setSleepStart(Number(e.target.value))}
                  className="w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm text-ink-100 focus:outline-none focus:border-ink-400"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-ink-400 mb-1.5 block">Acordar por volta de</label>
                <select
                  value={sleepEnd}
                  onChange={e => setSleepEnd(Number(e.target.value))}
                  className="w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm text-ink-100 focus:outline-none focus:border-ink-400"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('birthdate')}
                className="flex-1 py-2.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-sm text-ink-400 transition"
              >
                ← Voltar
              </button>
              <button
                onClick={() => setStep('done')}
                className="flex-1 py-2.5 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 transition"
              >
                Concluir
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <h2 className="font-serif text-2xl text-ink-100 mb-3 leading-snug">
              Tudo pronto.
            </h2>
            <p className="text-sm text-ink-400 leading-relaxed mb-6">
              Você pode alterar essas configurações a qualquer momento na seção de
              Perfil. Agora é só começar a registrar.
            </p>
            <button
              onClick={finish}
              className="w-full py-3 rounded-lg bg-gold text-ink-900 font-medium text-sm hover:brightness-110 transition"
            >
              Ir para o app →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
