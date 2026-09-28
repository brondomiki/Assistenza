import { useState } from 'react';

export default function SetupGuide() {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🛠️</span>
          <h1 className="text-3xl font-bold text-gray-800">Configurazione Iniziale</h1>
          <p className="text-gray-500 mt-2">Segui questi passi per configurare CareScheduler</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600">Passo {step} di {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🗄️</span>
                <h2 className="text-2xl font-bold text-gray-800">1. Crea il progetto Supabase</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium mb-2">📌 Cos'è Supabase?</p>
                  <p className="text-blue-700 text-sm">
                    Supabase è un servizio gratuito che ti fornisce un database, autenticazione utenti e notifiche in tempo reale. È come avere un server backend già pronto.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Istruzioni:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <div>
                        <p className="text-gray-700">Vai su <a href="https://supabase.com" target="_blank" className="text-indigo-600 underline font-medium">supabase.com</a> e crea un account</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <div>
                        <p className="text-gray-700">Clicca <strong>"New Project"</strong></p>
                        <p className="text-sm text-gray-500 mt-1">Dai un nome al progetto (es: CareScheduler)</p>
                        <p className="text-sm text-gray-500">Scegli una password per il database (ANNOTATELA!)</p>
                        <p className="text-sm text-gray-500">Region: West EU (Irlanda)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <div>
                        <p className="text-gray-700">Attendi 1-2 minuti che il progetto sia pronto</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🔑</span>
                <h2 className="text-2xl font-bold text-gray-800">2. Copia le chiavi Supabase</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">⚠️ Importante</p>
                  <p className="text-yellow-700 text-sm">
                    Le chiavi sono come password. Non condividerle mai pubblicamente!
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Dove trovare le chiavi:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <div>
                        <p className="text-gray-700">Nel dashboard Supabase, clicca su <strong>⚙️ Settings</strong> (in basso a sinistra)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <div>
                        <p className="text-gray-700">Clicca su <strong>"API"</strong></p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <div>
                        <p className="text-gray-700">Copia questi due valori:</p>
                        <div className="mt-2 bg-gray-900 rounded-lg p-4 font-mono text-sm">
                          <p className="text-green-400"># Project URL (sarà VITE_SUPABASE_URL)</p>
                          <p className="text-white">https://xxxxxxxxxxxx.supabase.co</p>
                          <p className="text-green-400 mt-3"># anon public key (sarà VITE_SUPABASE_ANON_KEY)</p>
                          <p className="text-white">eyJhbGciOiJIUzI1NiIs...</p>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Suggerimento:</strong> Apri un file di testo (Blocco Note) e incolla lì le chiavi per non perderle.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">📝</span>
                <h2 className="text-2xl font-bold text-gray-800">3. Crea il file .env.local</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">📌 Cos'è il file .env.local?</p>
                  <p className="text-green-700 text-sm">
                    È un file di configurazione che dice all'app dove trovare il database e le chiavi. Viene letto automaticamente quando avvii l'app.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Come crearlo:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <div>
                        <p className="text-gray-700">Nella cartella del progetto, crea un nuovo file chiamato <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">.env.local</code></p>
                        <p className="text-sm text-gray-500 mt-1">⚠️ Il nome inizia con un punto! Su Windows potresti dover usare il terminale:</p>
                        <code className="block bg-gray-900 text-green-400 p-2 rounded mt-1 text-sm">echo. &gt; .env.local</code>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <div>
                        <p className="text-gray-700">Apri il file e incolla questo contenuto (sostituendo i valori):</p>
                        <div className="mt-2 bg-gray-900 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                          <pre className="text-gray-300">{`# Supabase
VITE_SUPABASE_URL=https=TUO-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...LA_TUA_CHIAVE...

# Email (opzionale per iniziare)
RESEND_API_KEY=re_LA_TUA_CHIAVE_RESEND
FROM_EMAIL=tua-email@esempio.it
APP_URL=http://localhost:5173`}</pre>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <div>
                        <p className="text-gray-700">Salva il file</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium mb-2">🚫 Attenzione</p>
                  <p className="text-red-700 text-sm">
                    Il file .env.local NON deve essere caricato su GitHub! È già escluso automaticamente dal .gitignore.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🗃️</span>
                <h2 className="text-2xl font-bold text-gray-800">4. Crea le tabelle del database</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium mb-2">📌 Cosa sono le tabelle?</p>
                  <p className="text-blue-700 text-sm">
                    Le tabelle sono come fogli Excel nel database. Servono per salvare utenti, disponibilità, notifiche, ecc.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Come creare le tabelle:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <div>
                        <p className="text-gray-700">Nel dashboard Supabase, clicca su <strong>"SQL Editor"</strong> nel menu a sinistra</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <div>
                        <p className="text-gray-700">Clicca <strong>"New query"</strong></p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <div>
                        <p className="text-gray-700">Apri il file <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">src/lib/database-schema.sql</code> nel tuo editor di codice</p>
                        <p className="text-sm text-gray-500 mt-1">Copia TUTTO il contenuto (Ctrl+A, poi Ctrl+C)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
                      <div>
                        <p className="text-gray-700">Incolla nel SQL Editor di Supabase (Ctrl+V)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">5</span>
                      <div>
                        <p className="text-gray-700">Clicca <strong>"Run"</strong> (o premi Ctrl+Enter)</p>
                        <p className="text-sm text-green-600 mt-1">✅ Dovresti vedere "Success. No rows returned"</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Verifica:</strong> Vai su "Table Editor" nel menu di Supabase. Dovresti vedere 4 tabelle:
                    <code className="block mt-2 text-xs">profiles, caregiver_availability, family_availability, notifications</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">🚀</span>
                <h2 className="text-2xl font-bold text-gray-800">5. Avvia l'app e diventa Superuser</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">🎉 Ultimo passo!</p>
                  <p className="text-green-700 text-sm">
                    Ora sei pronto per avviare l'applicazione e configurare il tuo account come amministratore.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Avvia l'app:</h3>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <p className="text-gray-400"># Nel terminale, nella cartella del progetto:</p>
                    <p className="text-green-400">npm install</p>
                    <p className="text-green-400">npm run dev</p>
                    <p className="text-gray-400 mt-2"># Apri il browser su:</p>
                    <p className="text-blue-400">http://localhost:5173</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Diventa Superuser:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                      <div>
                        <p className="text-gray-700">Nell{"'"}app, clicca <strong>"Registrati"</strong> e crea il tuo account</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                      <div>
                        <p className="text-gray-700">Conferma l'email (clicca il link che ti arriva)</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                      <div>
                        <p className="text-gray-700">Vai su Supabase &gt; SQL Editor ed esegui:</p>
                        <div className="mt-2 bg-gray-900 rounded-lg p-3 font-mono text-xs">
                          <pre className="text-green-400">{`UPDATE profiles 
SET role = 'superuser' 
WHERE email = 'tua-email@esempio.it';`}</pre>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</span>
                      <div>
                        <p className="text-gray-700">Ricarica l'app → ora vedrai il pulsante <strong>⚙️ Admin</strong></p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                  <p className="text-indigo-800 font-medium mb-2">🎊 Fatto!</p>
                  <p className="text-indigo-700 text-sm">
                    Ora puoi:
                  </p>
                  <ul className="text-indigo-700 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Gestire la disponibilità come badante o familiare</li>
                    <li>Vedere le notifiche in tempo reale</li>
                    <li>Gestire gli utenti dal pannello Admin</li>
                    <li>Deployare su Vercel quando sei pronto</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Indietro
            </button>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Avanti →
              </button>
            ) : (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                ✅ Completato!
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-3">🔗 Link utili</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="https://supabase.com/dashboard" target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span>🗄️</span>
              <span className="text-sm text-gray-700">Dashboard Supabase</span>
            </a>
            <a href="https://resend.com" target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span>📧</span>
              <span className="text-sm text-gray-700">Resend (Email)</span>
            </a>
            <a href="https://vercel.com" target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span>🌐</span>
              <span className="text-sm text-gray-700">Vercel (Deploy)</span>
            </a>
            <a href="https://supabase.com/docs" target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span>📚</span>
              <span className="text-sm text-gray-700">Documentazione Supabase</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
