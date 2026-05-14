import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Code2, ArrowRight, ChevronLeft, ChevronRight, Zap, GitMerge,
  Send, RotateCcw, Loader2, CheckCircle, AlertCircle, Network,
  Filter, Scissors, MessageSquare,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── OpenAI fetch helper ──────────────────────────────────────────────────────
async function askAI(prompt, systemRole) {
  const key = import.meta.env.VITE_OPENAI_API_KEY;

  // Demo / offline fallback
  if (!key || key === 'your_openai_api_key_here' || key.length < 20) {
    await sleep(1300);
    if (systemRole.includes('Coder')) {
      return "```typescript\nfunction routeToAgent(input: string): Agent {\n  const CODE_SIGNALS = /code|build|write|hook|component/i;\n  return CODE_SIGNALS.test(input)\n    ? agents.coder\n    : agents.architect;\n}\n```\nRuflo dispatcher používá regex pro rozpoznání záměru — routing s nulovou extra latencí.";
    }
    return "**Plán architektury:**\n\n1. **Gateway** — Normalizuje vstup, extrahuje záměr\n2. **Dispatcher** — Routuje k správnému specialistovi\n3. **Context Bus** — Ořezaný stav předávaný při hand-off\n4. **Validátory** — Ověření výstupu před odpovědí\n\nOddělenými agenty dosáhneme horizontálního škálování."; 
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemRole },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content ?? 'No response received.';
}

// ─── Dispatch logic ───────────────────────────────────────────────────────────
const CODE_KEYWORDS = [
  'code', 'implement', 'function', 'build', 'write',
  'hook', 'component', 'class', 'script', 'snippet',
];

const dispatchAgent = (text) =>
  CODE_KEYWORDS.some((k) => text.toLowerCase().includes(k)) ? 'coder' : 'architect';

// ─── Agent config ─────────────────────────────────────────────────────────────
const AGENTS = {
  architect: {
    label: 'Architect',
    Icon: Brain,
    tagline: 'Návrh a plánování architektury',
    system:
      'You are the Architect Agent in Ruflo, a multi-agent AI system. You design systems clearly, concisely, and with strategic insight. Keep responses under 120 words. Use markdown bold for key terms. Always respond in Czech.',
    textCls: 'text-violet-400',
    borderCls: 'border-violet-500/40',
    bgCls: 'bg-violet-500/10',
    activeBorderCls: 'border-violet-500',
    activeBgCls: 'bg-violet-500/20',
    dotCls: 'bg-violet-400',
  },
  coder: {
    label: 'Coder',
    Icon: Code2,
    tagline: 'Implementace kódu',
    system:
      'You are the Coder Agent in Ruflo, a multi-agent AI system. You provide clean, runnable code with brief explanations. Keep responses under 120 words. Use TypeScript when possible. Always respond in Czech.',
    textCls: 'text-blue-400',
    borderCls: 'border-blue-500/40',
    bgCls: 'bg-blue-500/10',
    activeBorderCls: 'border-blue-500',
    activeBgCls: 'bg-blue-500/20',
    dotCls: 'bg-blue-400',
  },
};

// ─── Simple Markdown renderer ─────────────────────────────────────────────────
function SimpleMarkdown({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2.5">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre
              key={i}
              className="bg-black/50 rounded-lg px-4 py-3 text-green-300 text-xs overflow-x-auto border border-gray-700/60 leading-relaxed"
            >
              {code}
            </pre>
          );
        }
        const segments = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {segments.map((seg, j) =>
              seg.startsWith('**') && seg.endsWith('**') ? (
                <strong key={j} className="text-white font-semibold">
                  {seg.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{seg}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ═════════════════════════════════════════════════════════════════════════════
function TitleSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center overflow-hidden select-none">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-violet-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 mb-10">
          <Zap className="w-3 h-3 text-violet-400" />
          <span className="text-[11px] font-mono tracking-[0.2em] text-violet-300 uppercase">
            AI Ketch-up 6 · 2026
          </span>
        </div>

        {/* Main title */}
        <h1 className="text-[96px] font-black text-white tracking-tighter leading-none mb-3">
          Ruflo
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent mx-auto mb-6" />
        <p className="text-[32px] font-extralight text-gray-300 tracking-wide mb-14">
          Éra multi-agentů
        </p>

        {/* Agent trio */}
        <div className="flex items-center justify-center gap-4 mb-14">
          {[
            { Icon: Brain,     label: 'Architect',  cls: 'border-violet-500/30 bg-violet-500/10 text-violet-400' },
            { Icon: GitMerge,  label: 'Dispatcher', cls: 'border-gray-600/30 bg-gray-700/15 text-gray-400' },
            { Icon: Code2,     label: 'Coder',      cls: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
          ].map(({ Icon, label, cls }, i, arr) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3.5 rounded-xl border ${cls}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-gray-500">{label}</span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-700 mb-5" />
              )}
            </div>
          ))}
        </div>

        <p className="text-xs font-mono text-gray-600 tracking-[0.25em]">
          SWARM · OŘEZÁNÍ KONTEXTU · ORCHESTRACE
        </p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-7 flex items-center gap-2 text-gray-600 text-xs font-mono">
        Stiskni
        <kbd className="px-1.5 py-0.5 border border-gray-700/80 rounded text-gray-500 text-[10px]">
          →
        </kbd>
        pro začátek
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Problem
// ═════════════════════════════════════════════════════════════════════════════
function ProblemSlide() {
  return (
    <div className="flex flex-col h-full px-16 py-12">
      {/* Header */}
      <div className="mb-9">
        <span className="text-[11px] font-mono text-violet-400 tracking-widest uppercase">
          Slide 01 — Problém
        </span>
        <h2 className="text-[42px] font-bold text-white mt-1 leading-tight">
          1×1 Chat vs. Swarm
        </h2>
        <p className="text-gray-400 mt-1.5">Proč jeden chat nestačí.</p>
      </div>

      <div className="flex gap-7 flex-1 items-stretch">
        {/* LEFT — Classic 1×1 */}
        <div className="flex-1 border border-gray-700/60 rounded-2xl p-7 bg-gray-900/30 flex flex-col">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <MessageSquare className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Klasický 1×1 chat</p>
              <p className="text-gray-500 text-xs">Jeden model, jedno nekonečné vlákno</p>
            </div>
          </div>

          {/* Linear chain */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0">
            {[
              { label: 'Request',               warn: false },
              { label: 'Narůstající kontext', warn: false },
              { label: '⚠ Limit tokenů',      warn: true  },
              { label: 'Jediná odpověď',      warn: false },
            ].map(({ label, warn }, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`px-6 py-2.5 rounded-xl border text-sm font-medium w-52 text-center transition-colors
                    ${warn
                      ? 'border-red-500/50 bg-red-500/10 text-red-300'
                      : 'border-gray-700/60 bg-gray-800/60 text-gray-300'
                    }`}
                >
                  {label}
                </div>
                {i < 3 && <div className="w-px h-6 bg-gray-700/60" />}
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2">
            {[
              'Žádná specializace na typ úkolu',
              'Nafouklý kontext snižuje kvalitu',
              'Limity tokenů blokují průběh',
              'Jeden bod selhání',
            ].map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-1 h-1 rounded-full bg-red-500/70 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider arrow */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <div className="w-px flex-1 bg-gray-800" />
          <div className="p-2 rounded-full border border-violet-500/30 bg-violet-500/10">
            <ArrowRight className="w-4 h-4 text-violet-400" />
          </div>
          <div className="w-px flex-1 bg-gray-800" />
        </div>

        {/* RIGHT — Swarm */}
        <div className="flex-1 border border-violet-500/30 rounded-2xl p-7 bg-violet-500/5 flex flex-col">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Network className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Ruflo Swarm</p>
              <p className="text-gray-500 text-xs">Orchestrovaní specializovaní agenti</p>
            </div>
          </div>

          {/* Hub-and-spoke diagram */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-60 h-52">
              {/* SVG connecting lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                <line x1="50%" y1="50%" x2="50%" y2="13%"  stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" strokeDasharray="5 3" />
                <line x1="50%" y1="50%" x2="50%" y2="87%"  stroke="rgba(59,130,246,0.35)"  strokeWidth="1.5" strokeDasharray="5 3" />
                <line x1="50%" y1="50%" x2="91%" y2="50%"  stroke="rgba(34,197,94,0.35)"   strokeWidth="1.5" strokeDasharray="5 3" />
              </svg>

              {/* Center: Dispatcher */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="p-3.5 rounded-xl border border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20 glow-pulse">
                  <GitMerge className="w-5 h-5 text-violet-300" />
                </div>
              </div>

              {/* Spoke: Architect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
                <div className="p-2 rounded-lg border border-violet-500/40 bg-violet-500/10">
                  <Brain className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-[10px] font-mono text-gray-500">Architect</span>
              </div>

              {/* Spoke: Coder */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
                <div className="p-2 rounded-lg border border-blue-500/40 bg-blue-500/10">
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[10px] font-mono text-gray-500">Coder</span>
              </div>

              {/* Spoke: Pruner */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10">
                <div className="p-2 rounded-lg border border-green-500/40 bg-green-500/10">
                  <Filter className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-[10px] font-mono text-gray-500">Pruner</span>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {[
              'Specializovaní agenti podle úkolu',
              'Ořezaný kontext — žádné nafukování',
              'Agenti pracují paralelně',
              'Horizontálně škálovatelné',
            ].map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Interactive Demo
// ═════════════════════════════════════════════════════════════════════════════
// Hand-off log line
function LogLine({ done, text }) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-500 ${done ? 'opacity-100' : 'opacity-25'}`}>
      <span className={`w-1 h-1 rounded-full shrink-0 ${done ? 'bg-green-400' : 'bg-gray-600'}`} />
      <span className={`text-[11px] font-mono ${done ? 'text-gray-300' : 'text-gray-600'}`}>{text}</span>
    </div>
  );
}

function DemoSlide() {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | analyzing | transferring | responding | done | error
  const [agent, setAgent] = useState(null);   // 'architect' | 'coder'
  const [statusMsg, setStatusMsg] = useState('');
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const busy     = ['analyzing', 'transferring', 'responding'].includes(phase);
  const finished = phase === 'done' || phase === 'error';

  async function run() {
    if (!input.trim() || busy) return;

    setPhase('analyzing');
    setResponse('');
    setAgent(null);
    setErrorMsg('');
    setStatusMsg('Analyzuju záměr…');

    await sleep(700);

    const chosen = dispatchAgent(input);
    setAgent(chosen);
    setPhase('transferring');
    setStatusMsg(`Předávám ${AGENTS[chosen].label} agentovi…`);

    await sleep(2000);

    setPhase('responding');
    setStatusMsg(`${AGENTS[chosen].label} agent odpovídá…`);

    try {
      const text = await askAI(input, AGENTS[chosen].system);
      setResponse(text);
      setPhase('done');
      setStatusMsg('');
    } catch (e) {
      setErrorMsg(e.message);
      setPhase('error');
      setStatusMsg('');
    }
  }

  function reset() {
    setInput('');
    setPhase('idle');
    setAgent(null);
    setResponse('');
    setStatusMsg('');
    setErrorMsg('');
  }

  const A = agent ? AGENTS[agent] : null;

  return (
    <div className="flex flex-col h-full px-14 py-10">
      {/* Header */}
      <div className="mb-7 shrink-0">
        <span className="text-[11px] font-mono text-violet-400 tracking-widest uppercase">
          Slide 02 — Interaktivní demo
        </span>
        <h2 className="text-[42px] font-bold text-white mt-1 leading-tight">
          Roj v akci
        </h2>
        <p className="text-gray-400 mt-1.5">
          Zeptej se na cokoliv — Dispatcher rozhodne, kdo odpoví.
        </p>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* ── Main column ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Agent cards */}
          <div className="flex gap-4 shrink-0">
            {Object.entries(AGENTS).map(([key, cfg]) => {
              const active = agent === key;
              return (
                <div
                  key={key}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all duration-500
                    ${active
                      ? `${cfg.activeBorderCls} ${cfg.activeBgCls} shadow-lg`
                      : `${cfg.borderCls} ${cfg.bgCls}`
                    }`}
                >
                  <div className={`p-2 rounded-lg ${active ? 'bg-white/10' : 'bg-white/5'} transition-colors duration-500`}>
                    <cfg.Icon className={`w-5 h-5 ${cfg.textCls} transition-colors duration-500`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{cfg.label} Agent</p>
                    <p className="text-gray-500 text-xs">{cfg.tagline}</p>
                  </div>
                  {active && phase === 'transferring' && (
                    <Loader2 className={`w-4 h-4 ${cfg.textCls} animate-spin shrink-0`} />
                  )}
                  {active && phase === 'done' && (
                    <CheckCircle className={`w-4 h-4 ${cfg.textCls} shrink-0`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Input row */}
          <div className="flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  finished ? reset() : run();
                }
              }}
              disabled={busy || finished}
              placeholder='Try: "Design a caching strategy" or "Write a debounce hook"'
              className="flex-1 bg-gray-900/80 border border-gray-700/80 rounded-xl px-4 py-3
                text-sm text-white placeholder-gray-600
                focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/60
                disabled:opacity-50 transition-all"
            />
            <button
              onClick={finished ? reset : run}
              disabled={busy || (!input.trim() && !finished)}
              className={`px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shrink-0 transition-all
                ${finished
                  ? 'bg-gray-700/60 hover:bg-gray-700 text-gray-300 border border-gray-600'
                  : 'bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
            >
              {busy
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : finished
                  ? <><RotateCcw className="w-4 h-4" /> Reset</>
                  : <><Send className="w-4 h-4" /> Odeslat</>
              }
            </button>
          </div>

          {/* Status pill */}
          {statusMsg && (
            <div
              className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm
                ${phase === 'transferring'
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400'
                }`}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              {statusMsg}
            </div>
          )}

          {/* Response box */}
          {(response || errorMsg) && (
            <div
              className={`flex-1 min-h-0 overflow-y-auto custom-scroll rounded-xl border p-5 transition-all
                ${errorMsg
                  ? 'border-red-500/30 bg-red-500/5'
                  : A
                    ? `${A.activeBorderCls} ${A.activeBgCls}`
                    : 'border-gray-700 bg-gray-900/50'
                }`}
            >
              {errorMsg ? (
                <div className="flex items-start gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              ) : (
                <>
                  <div className={`flex items-center gap-2 mb-4 text-[11px] font-mono ${A?.textCls} uppercase tracking-widest`}>
                    {A && <A.Icon className="w-3.5 h-3.5" />}
                    {A?.label} · odpověď
                  </div>
                  <SimpleMarkdown text={response} />
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="w-56 shrink-0 flex flex-col gap-4">
          {/* Dispatch logic */}
          <div className="border border-gray-700/60 rounded-xl p-4 bg-gray-900/40">
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mb-3">
              Logika dispatcheru
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="text-gray-600">pokud vstup obsahuje:</div>
              <div className="flex flex-wrap gap-1">
                {CODE_KEYWORDS.map((k) => (
                  <span
                    key={k}
                    className={`px-1.5 py-0.5 rounded border text-[10px] transition-all duration-300
                      ${agent === 'coder' && input.toLowerCase().includes(k)
                        ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                        : 'border-gray-700 bg-gray-800/60 text-gray-600'
                      }`}
                  >
                    {k}
                  </span>
                ))}
              </div>
              <div className={`transition-colors duration-300 ${agent === 'coder' ? 'text-blue-400' : 'text-gray-700'}`}>
                → Coder agent
              </div>
              <div className={`transition-colors duration-300 ${agent === 'architect' ? 'text-violet-400' : 'text-gray-700'}`}>
                jinak → Architect agent
              </div>
            </div>
          </div>

          {/* Hand-off log */}
          <div className="flex-1 border border-gray-700/60 rounded-xl p-4 bg-gray-900/40">
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mb-3">
              Log předání
            </p>
            <div className="space-y-2.5">
              {phase === 'idle' ? (
                <p className="text-[11px] font-mono text-gray-700">Čekám na vstup…</p>
              ) : (
                <>
                  <LogLine done text="Záměr rozpoznán" />
                  <LogLine
                    done={agent !== null}
                    text={agent ? `→ ${AGENTS[agent].label} vybrán` : 'Vybírám agenta…'}
                  />
                  <LogLine
                    done={['responding', 'done', 'error'].includes(phase)}
                    text="Kontext ořezán"
                  />
                  <LogLine
                    done={phase === 'done' || phase === 'error'}
                    text="Odpověď přijata"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Context Pruning
// ═════════════════════════════════════════════════════════════════════════════
const RAW_CONTEXT = [
  { role: 'user', preview: "Jaké je počasí v New Yorku?",                 tokens: 9    },
  { role: 'ai',   preview: "Nemám přístup k aktuálním datům…",            tokens: 28   },
  { role: 'user', preview: "Pomož mi naplánovat React aplikaci.",         tokens: 11   },
  { role: 'ai',   preview: "Jasně! Řekni mi svoje požadavky…",            tokens: 19   },
  { role: 'user', preview: "Vlastně — navrhni multi-agentní systém.",     tokens: 14   },
  { role: 'ai',   preview: "Pro multi-agentní architekturu zvaž…",        tokens: 312  },
  { role: 'user', preview: "[Vložen 800-řádkový kód]",                    tokens: 1840 },
  { role: 'ai',   preview: "Na základě tvého kódu jsou hlavní problémy…", tokens: 547  },
];

const CLEAN_CONTEXT_FIELDS = [
  { key: 'task',         value: '"Navrhni multi-agentní systém"',         isArray: false },
  { key: 'constraints',  value: ['TypeScript', 'React', 'Nízká latence'], isArray: true  },
  { key: 'lastDecision', value: '"Použij event-driven dispatch"',         isArray: false },
  { key: 'nextAgent',    value: '"Architect"',                            isArray: false },
];

const TOTAL_RAW = RAW_CONTEXT.reduce((s, i) => s + i.tokens, 0);

function ContextPruningSlide() {
  const [phase, setPhase] = useState(0); // 0=idle | 1=pruning | 2=done

  function handleButton() {
    if (phase === 2) { setPhase(0); return; }
    if (phase !== 0) return;
    setPhase(1);
    setTimeout(() => setPhase(2), 2300);
  }

  return (
    <div className="flex flex-col h-full px-14 py-10">
      {/* Header */}
      <div className="mb-8 shrink-0">
        <span className="text-[11px] font-mono text-violet-400 tracking-widest uppercase">
          Slide 03 — Architektura
        </span>
        <h2 className="text-[42px] font-bold text-white mt-1 leading-tight">
          Context Pruning
        </h2>
        <p className="text-gray-400 mt-1.5">
          Jak Ruflo zabraňuje nafukování tokenů při každém předání.
        </p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── Raw context ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
              Surový kontext
            </span>
            <span
              className={`text-[11px] font-mono transition-all duration-700
                ${phase === 2 ? 'text-gray-700 line-through' : 'text-red-400'}`}
            >
              ~{TOTAL_RAW.toLocaleString()} tokens
            </span>
          </div>
          <div className="flex-1 overflow-hidden space-y-1.5">
            {RAW_CONTEXT.map((item, i) => (
              <div
                key={i}
                style={{
                  transitionDelay: phase === 1 ? `${i * 75}ms` : '0ms',
                  transition: 'opacity 0.45s ease, transform 0.45s ease',
                  opacity: phase >= 1 ? 0 : 1,
                  transform: phase >= 1 ? 'translateX(-18px) scaleX(0.92)' : 'none',
                }}
                className={`px-3.5 py-2.5 rounded-lg border text-xs
                  ${item.role === 'user'
                    ? 'border-gray-700/60 bg-gray-800/50 text-gray-300'
                    : 'border-gray-700/40 bg-gray-800/30 text-gray-400'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600">
                    {item.role}
                  </span>
                  <span className={`font-mono text-[9px] ${item.tokens > 100 ? 'text-red-400/70' : 'text-gray-600'}`}>
                    {item.tokens}t
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px]">{item.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pruner column ─────────────────────────────────── */}
        <div className="w-28 shrink-0 flex flex-col items-center justify-center gap-5">
          <div
            className={`p-3.5 rounded-xl border transition-all duration-500
              ${phase === 1
                ? 'border-amber-500 bg-amber-500/20 shadow-amber-500/25 shadow-lg animate-pulse'
                : phase === 2
                  ? 'border-green-500 bg-green-500/15'
                  : 'border-gray-700 bg-gray-800/50'
              }`}
          >
            <Scissors
              className={`w-6 h-6 transition-colors duration-500
                ${phase === 1 ? 'text-amber-400' : phase === 2 ? 'text-green-400' : 'text-gray-500'}`}
            />
          </div>
          <span
            className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-500
              ${phase === 1 ? 'text-amber-400' : phase === 2 ? 'text-green-400' : 'text-gray-600'}`}
          >
            {phase === 1 ? 'Ořezávám…' : phase === 2 ? 'Hotovo ✓' : 'Pruner'}
          </span>
          <div className="w-px h-10 bg-gray-800" />
          <button
            onClick={handleButton}
            disabled={phase === 1}
            className={`w-full py-2 px-2 rounded-lg text-[10px] font-mono uppercase tracking-wider border transition-all
              ${phase === 2
                ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : phase === 1
                  ? 'border-amber-500/30 text-amber-500/50 cursor-wait'
                  : 'border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 cursor-pointer'
              }`}
          >
            {phase === 2 ? 'Reset' : phase === 1 ? '…' : 'Spustit'}
          </button>
        </div>

        {/* ── Clean context ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
              Ořezaný kontext
            </span>
            <span
              className={`text-[11px] font-mono transition-all duration-700
                ${phase === 2 ? 'text-green-400' : 'text-gray-700'}`}
            >
              ~48 tokens
            </span>
          </div>

          <div
            className={`flex-1 rounded-xl border p-5 font-mono text-xs transition-all duration-700
              ${phase === 2
                ? 'border-green-500/40 bg-green-500/5 opacity-100'
                : 'border-gray-700/40 bg-gray-800/20 opacity-25'
              }`}
          >
            <div className="text-gray-500 mb-1">{'{'}</div>

            {CLEAN_CONTEXT_FIELDS.map(({ key, value, isArray }, i) => (
              <div
                key={key}
                style={{
                  transitionDelay: phase === 2 ? `${i * 130 + 350}ms` : '0ms',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  opacity: phase === 2 ? 1 : 0,
                  transform: phase === 2 ? 'none' : 'translateY(6px)',
                }}
                className="ml-4 mb-1"
              >
                <span className="text-violet-400">{key}</span>
                <span className="text-gray-500">: </span>
                {isArray ? (
                  <span className="text-blue-300">
                    [{(value).map((s) => `"${s}"`).join(', ')}]
                  </span>
                ) : (
                  <span className="text-green-300">{value}</span>
                )}
                <span className="text-gray-600">,</span>
              </div>
            ))}

            <div className="text-gray-500 mt-1">{'}'}</div>

            {phase === 2 && (
              <div
                style={{ transition: 'opacity 0.6s ease', transitionDelay: '900ms', opacity: phase === 2 ? 1 : 0 }}
                className="mt-5 pt-4 border-t border-green-500/20"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-green-400 text-[10px] uppercase tracking-widest">
                    Připraveno k předání
                  </span>
                </div>
                <p className="text-gray-600 text-[10px] mt-1.5 leading-relaxed">
                  97 % méně tokenů · záměr zachován
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SLIDE REGISTRY
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Thank You
// ═════════════════════════════════════════════════════════════════════════════
function ThankYouSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center overflow-hidden select-none">
      {/* Ambient glows */}
      <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(139,92,246,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Icon cluster */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/10">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-700" />
          <div className="p-3 rounded-xl border border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20 glow-pulse">
            <GitMerge className="w-6 h-6 text-violet-300" />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-700" />
          <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10">
            <Code2 className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[72px] font-black text-white tracking-tighter leading-none mb-3">
          Any Questions?
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent mx-auto mb-5" />
        <p className="text-lg font-light text-gray-400 mb-12 max-w-lg">
          Ruflo je open-source — všechna čest patří tvůrci. Hvězdičkuj, forkuj, postav na tom něco svého.
        </p>

        {/* GitHub link card */}
        <a
          href="https://github.com/ruvnet/ruflo"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 px-7 py-4 rounded-2xl border border-violet-500/30 bg-violet-500/10
            hover:border-violet-500/70 hover:bg-violet-500/20 transition-all duration-300"
        >
          {/* GitHub SVG icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white shrink-0">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577
              0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756
              -1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304
              3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931
              0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322
              3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404
              2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84
              1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823
              2.222 0 1.606-.015 2.896-.015 3.286 0 .322.216.694.825.576C20.565 21.795 24 17.298
              24 12c0-6.627-5.373-12-12-12z"
            />
          </svg>
          <div className="text-left">
            <p className="text-white font-semibold text-sm group-hover:text-violet-300 transition-colors">
              github.com/ruvnet/ruflo
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Open-source · MIT licence</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all ml-2" />
        </a>
      </div>
    </div>
  );
}

const SLIDES = [TitleSlide, ProblemSlide, DemoSlide, ContextPruningSlide, ThankYouSlide];
const SLIDE_LABELS = ['Úvod', 'Problém', 'Demo', 'Context Pruning', 'Dotazy'];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [current, setCurrent] = useState(0);
  const [slideKey, setSlideKey] = useState(0);

  const goTo = useCallback(
    (next) => {
      if (next < 0 || next >= SLIDES.length) return;
      setSlideKey((k) => k + 1);
      setCurrent(next);
    },
    []
  );

  // Keyboard navigation — skip when user is typing
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, goTo]);

  const SlideComp = SLIDES[current];

  return (
    <div className="h-screen bg-[#08080d] text-white overflow-hidden flex flex-col">
      {/* Slide counter */}
      <div className="absolute top-5 right-8 text-[11px] font-mono text-gray-700 z-20 select-none">
        {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
      </div>

      {/* Slide area */}
      <div key={slideKey} className="flex-1 min-h-0 slide-enter">
        <SlideComp />
      </div>

      {/* Bottom navigation bar */}
      <div className="shrink-0 flex items-center justify-between px-10 py-3.5 border-t border-gray-800/60">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          aria-label="Previous slide"
          className="p-2 rounded-lg border border-gray-700/60 text-gray-500
            hover:text-white hover:border-gray-500
            disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dot nav */}
        <div className="flex items-center gap-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="flex items-center gap-2 group"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className={`rounded-full transition-all duration-300
                  ${i === current
                    ? 'w-6 h-1.5 bg-violet-400'
                    : 'w-1.5 h-1.5 bg-gray-700 group-hover:bg-gray-500'
                  }`}
              />
              <span
                className={`text-[11px] font-mono transition-colors
                  ${i === current ? 'text-gray-300' : 'text-gray-700 group-hover:text-gray-500'}`}
              >
                {SLIDE_LABELS[i]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => goTo(current + 1)}
          disabled={current === SLIDES.length - 1}
          aria-label="Next slide"
          className="p-2 rounded-lg border border-gray-700/60 text-gray-500
            hover:text-white hover:border-gray-500
            disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
