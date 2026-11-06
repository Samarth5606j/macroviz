// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, SkipForward, RotateCcw, Code2, 
  Database, AlertTriangle, CheckCircle2, 
  Cpu, ShieldAlert, BarChart3, Activity, Terminal
} from 'lucide-react';
import { runUnifiedMacroCore } from './engine/macroProcessor';
import { ProcessorStep, TargetISA } from './types/macro';

interface TestCasePreset {
  id: string;
  name: string;
  defaultTab: 'AI_METRICS' | 'SECURITY' | 'TABLES';
  description: string;
  code: string;
}

const DEMO_PRESETS: TestCasePreset[] = [
  {
    id: 'tc1_ai_cache',
    name: 'Test Case 1: AI Cache & Inlining Decision',
    defaultTab: 'AI_METRICS',
    description: 'Shows AI model differentiating between inline expansion vs subroutine synthesis to protect 32KB L1i cache.',
    code: `; === TEST CASE 1: NEURO-SYMBOLIC INLINING ===
MACRO
FAST_INCR &VAR
ADD &VAR, 1
MEND

MACRO
HEAVY_TRANS &DST, &SRC, &LEN
ALLOC_BUFF &DST, &LEN
MOVR R1, &SRC
MOVR R2, &DST
ADD R1, 10
ADD R2, 20
SUB R1, R2
MOVR &DST, R1
MEND

START 100
FAST_INCR A
FAST_INCR B
HEAVY_TRANS D1, S1, 64
HEAVY_TRANS D2, S2, 64
HEAVY_TRANS D3, S3, 64
PRINT A
END`
  },
  {
    id: 'tc2_security',
    name: 'Test Case 2: Formal Security & Buffer Guard',
    defaultTab: 'SECURITY',
    description: 'Demonstrates AST taint analysis flagging unguarded buffer allocation vs secured boundary checks.',
    code: `; === TEST CASE 2: FORMAL SAFETY & TAINT AUDIT ===
MACRO
UNGUARDED_COPY &TARGET, &SIZE
ALLOC_BUFF &TARGET, &SIZE
MOVR R1, &SIZE
MEND

MACRO
GUARDED_COPY &TARGET, &SIZE
CMP &SIZE, 64
ALLOC_BUFF &TARGET, &SIZE
MOVR R1, &SIZE
MEND

START 200
READ IN_LEN
UNGUARDED_COPY BUFF1, IN_LEN
GUARDED_COPY BUFF2, IN_LEN
END`
  },
  {
    id: 'tc3_cross_isa',
    name: 'Test Case 3: Cross-ISA Transpilation (RISC-V/ARM/x86)',
    defaultTab: 'AI_METRICS',
    description: 'Expands a universal macro into native assembly for RISC-V (RV64I), ARM64 (AArch64), and x86-64.',
    code: `; === TEST CASE 3: CROSS-ISA TRANSPILATION ===
MACRO
MATH_BLOCK &X, &Y
MOVR R1, &X
ADD R1, &Y
SUB R1, 4
MOVR &X, R1
MEND

START 300
READ VAL1
READ VAL2
MATH_BLOCK VAL1, VAL2
PRINT VAL1
END`
  },
  {
    id: 'tc4_error_trap',
    name: 'Test Case 4: Diagnostic Parameter Mismatch',
    defaultTab: 'TABLES',
    description: 'Tests the deterministic error-trapping engine when caller omits required positional arguments.',
    code: `; === TEST CASE 4: REVERSIBLE ERROR TRAPPING ===
MACRO
CALCULATE &A, &B, &C
MOVR R1, &A
ADD R1, &B
SUB R1, &C
MEND

START 400
READ X
READ Y
; Deliberate fault: Passing only 2 arguments instead of 3
CALCULATE X, Y
END`
  }
];

export default function App() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEMO_PRESETS[0].id);
  const [sourceCode, setSourceCode] = useState<string>(DEMO_PRESETS[0].code);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedISA, setSelectedISA] = useState<TargetISA>('RISCV');
  const [activeTab, setActiveTab] = useState<'TABLES' | 'AI_METRICS' | 'SECURITY'>(DEMO_PRESETS[0].defaultTab);

  const handleSelectPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setIsPlaying(false);
    setSelectedPresetId(preset.id);
    setSourceCode(preset.code);
    setCurrentStepIndex(0);
    setActiveTab(preset.defaultTab);
    setIsEditing(false);
  };

  const { steps } = useMemo(() => {
    return runUnifiedMacroCore(sourceCode);
  }, [sourceCode]);

  const activeStep: ProcessorStep = steps[currentStepIndex] || {
    stepNumber: 0,
    pass: 1,
    currentLineIndex: -1,
    currentLineContent: '',
    explanation: 'Ready',
    mnt: [],
    mdt: [],
    kpdt: [],
    ala: [],
    callStack: [],
    expandedCode: [],
    isaTranslations: { x86_64: [], ARM64: [], RISCV: [] },
    aiMetrics: [],
    diagnostics: []
  };

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      if (currentStepIndex < steps.length - 1 && !activeStep.error) {
        timer = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, playbackSpeed);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed, activeStep.error]);

  const codeLines = sourceCode.split('\n');
  const currentPreset = DEMO_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-lg shadow-md shadow-indigo-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
              MacroViz
            </h1>
          </div>

          {/* Quick Demo Preset Dropdown */}
          <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-2 uppercase tracking-wider">Demo Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none cursor-pointer pr-4"
            >
              {DEMO_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('AI_METRICS')}
            className={`px-3 py-1 rounded transition font-medium flex items-center space-x-1.5 ${
              activeTab === 'AI_METRICS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Cache Optimizer</span>
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`px-3 py-1 rounded transition font-medium flex items-center space-x-1.5 ${
              activeTab === 'SECURITY' ? 'bg-rose-900/70 text-rose-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Formal Safety Guard</span>
          </button>
          <button
            onClick={() => setActiveTab('TABLES')}
            className={`px-3 py-1 rounded transition font-medium flex items-center space-x-1.5 ${
              activeTab === 'TABLES' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Classic Tables</span>
          </button>
        </div>

        {/* Step Status Badge */}
        <div className={`px-2.5 py-1 rounded text-xs font-bold border ${
          activeStep.pass === 1 
            ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300' 
            : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
        }`}>
          {activeStep.pass === 1 ? 'PASS 1: FORMAL SPEC & AST' : 'PASS 2: MULTI-ISA SYNTHESIS'}
        </div>
      </header>

      {/* Control Strip & Scrubber */}
      <section className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between space-x-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 space-x-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!!activeStep.error}
              className="px-3 py-1 hover:bg-slate-800 disabled:opacity-40 rounded transition flex items-center space-x-1 text-xs font-semibold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => currentStepIndex < steps.length - 1 && setCurrentStepIndex(prev => prev + 1)}
              disabled={currentStepIndex >= steps.length - 1 || isPlaying || !!activeStep.error}
              className="px-3 py-1 hover:bg-slate-800 disabled:opacity-40 rounded transition flex items-center space-x-1 text-xs font-semibold text-cyan-400"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>
            <button
              onClick={() => { setIsPlaying(false); setCurrentStepIndex(0); }}
              className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrubber Bar */}
        <div className="flex-1 flex items-center space-x-3 max-w-xl">
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
            Step {activeStep.stepNumber}/{steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIndex(Number(e.target.value));
            }}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
          Active: <span className="text-amber-300 font-semibold">{activeStep.currentLineContent || 'None'}</span>
        </div>
      </section>

      {/* Explanatory Alert Banner */}
      <section className={`border-b px-6 py-1.5 flex items-center justify-between text-xs font-medium ${
        activeStep.error
          ? 'bg-rose-950/60 border-rose-800 text-rose-200'
          : activeStep.isComplete
          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
          : 'bg-slate-950/80 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center space-x-2">
          {activeStep.error ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{activeStep.explanation}</span>
        </div>
        {currentPreset && (
          <span className="text-[11px] text-slate-400 italic">
            Objective: {currentPreset.description}
          </span>
        )}
      </section>

      {/* Main 3-Column Layout */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        
        {/* Column 1: Source Assembly */}
        <section className="col-span-12 lg:col-span-4 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <span className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Universal Source Program</span>
            </span>
            <button
              onClick={() => { setIsEditing(!isEditing); setCurrentStepIndex(0); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              {isEditing ? 'Save & Re-Index' : 'Edit Source'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="flex-1 p-3 bg-slate-950 text-slate-100 font-mono text-xs resize-none focus:outline-none"
              spellCheck={false}
            />
          ) : (
            <div className="flex-1 flex overflow-auto p-2 font-mono text-xs bg-slate-950/70">
              <div className="flex flex-col select-none text-slate-600 pr-3 border-r border-slate-800 text-right">
                {codeLines.map((_, i) => (
                  <div key={i} className={`h-6 leading-6 ${activeStep.currentLineIndex === i ? 'text-indigo-400 font-bold' : ''}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col pl-3">
                {codeLines.map((line, i) => (
                  <div
                    key={i}
                    className={`h-6 leading-6 px-1.5 rounded transition whitespace-pre ${
                      activeStep.currentLineIndex === i
                        ? activeStep.error
                          ? 'bg-rose-950/60 text-rose-300 font-bold border-l-2 border-rose-500'
                          : 'bg-indigo-600/30 text-indigo-100 font-bold border-l-2 border-indigo-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {line || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Column 2: Interactive Dynamic Visual Graphs */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-4">
          
          {/* TAB 1: AI Cache Optimizer & Visual Graphs */}
          {activeTab === 'AI_METRICS' && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>L1i Cache Pressure & Optimization Telemetry</span>
                </span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  L1 Cache Model: 32 KB
                </span>
              </div>

              {/* DYNAMIC RUNTIME CYCLE ACCUMULATOR GRAPH */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-300 font-semibold">Live Cumulative CPU Cycles</span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800 animate-pulse">
                      Step {activeStep.stepNumber} Active
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span><span className="text-slate-400">Pure Inline</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-slate-400">Subroutine Call</span></span>
                  </div>
                </div>

                <div className="h-32 flex items-end justify-around border-b border-slate-800 pt-3 pb-2 px-2">
                  {activeStep.aiMetrics.length === 0 ? (
                    <div className="text-slate-600 text-xs italic py-8">Analyzing AST...</div>
                  ) : (
                    activeStep.aiMetrics.map((metric, i) => {
                      const progressRatio = Math.min(1, Math.max(0.15, (activeStep.stepNumber / Math.max(1, steps.length))));
                      
                      // Dynamic heights that expand as you step forward
                      const inlineCycles = Math.min(100, Math.round(metric.bodyInstructionCount * metric.callSiteFrequency * 3.5 * progressRatio));
                      const subCycles = Math.min(100, Math.round(((metric.bodyInstructionCount * 2) + (metric.callSiteFrequency * 10)) * progressRatio));

                      const isCurrentlyActive = activeStep.currentLineContent.toUpperCase().includes(metric.macroName);

                      return (
                        <div key={i} className={`flex flex-col items-center space-y-1 transition-all ${isCurrentlyActive ? 'scale-105' : 'opacity-85'}`}>
                          <div className="flex items-end space-x-2 h-24">
                            {/* Inline Bar */}
                            <div 
                              className={`w-6 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-300 relative group ${
                                isCurrentlyActive ? 'ring-2 ring-cyan-300 shadow-lg shadow-cyan-500/30' : ''
                              }`}
                              style={{ height: `${Math.max(12, inlineCycles)}%` }}
                            >
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-900 border border-slate-700 px-1 rounded text-cyan-300 font-mono z-10 whitespace-nowrap">
                                {inlineCycles * 2}c
                              </span>
                            </div>

                            {/* Subroutine Bar */}
                            <div 
                              className={`w-6 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t transition-all duration-300 relative group ${
                                isCurrentlyActive ? 'ring-2 ring-indigo-300 shadow-lg shadow-indigo-500/30' : ''
                              }`}
                              style={{ height: `${Math.max(12, subCycles)}%` }}
                            >
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-900 border border-slate-700 px-1 rounded text-indigo-300 font-mono z-10 whitespace-nowrap">
                                {subCycles * 2}c
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono truncate max-w-[85px] ${isCurrentlyActive ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
                            {metric.macroName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* VISUAL CHART 2: Cache Hit Rate & Allocation Metrics */}
              <div className="space-y-3">
                {activeStep.aiMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">Macro: {metric.macroName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        metric.decision === 'INLINE' 
                          ? 'bg-emerald-950 border border-emerald-700 text-emerald-300' 
                          : 'bg-amber-950 border border-amber-700 text-amber-300'
                      }`}>
                        Decision: {metric.decision}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>L1 Instruction Cache Locality</span>
                        <span className="text-cyan-400 font-bold">{metric.l1CacheHitRatePct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-300 h-full rounded-full transition-all duration-500"
                          style={{ width: `${metric.l1CacheHitRatePct}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans bg-slate-900/80 p-2 rounded border border-slate-800/50">
                      {metric.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Formal Safety Guard & Vulnerability Audit */}
          {activeTab === 'SECURITY' && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-auto space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Formal AST & Taint Audit Guard</span>
                </span>
              </div>

              {activeStep.diagnostics.length === 0 ? (
                <div className="text-slate-600 italic text-center py-8 text-xs">Awaiting Pass 1 AST parse...</div>
              ) : (
                activeStep.diagnostics.map((diag, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border space-y-1.5 text-xs font-mono ${
                      diag.severity === 'CRITICAL' 
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200' 
                        : diag.severity === 'WARNING'
                        ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>[{diag.severity}] Line {diag.targetLine}</span>
                      <span className="text-[10px] uppercase tracking-wider">{diag.type}</span>
                    </div>
                    <p className="font-sans text-[11px]">{diag.message}</p>
                    {diag.autoRemediation && (
                      <div className="bg-slate-950/80 p-1.5 rounded border border-rose-900/50 text-[10px] text-rose-300">
                        Auto-Remediation: <code>{diag.autoRemediation}</code>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Classic System Tables (MNT / MDT) */}
          {activeTab === 'TABLES' && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-3 overflow-auto space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">MNT Directory</span>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th>#</th><th>Name</th><th>#PP</th><th>#KP</th><th>MDT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {activeStep.mnt.map(m => (
                    <tr key={m.index}><td className="py-1">{m.index}</td><td className="text-cyan-300 font-bold">{m.name}</td><td>{m.ppCount}</td><td>{m.kpCount}</td><td>{m.mdtIndex}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Column 3: Multi-ISA Cross-Compiler Inspector */}
        <section className="col-span-12 lg:col-span-4 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Cross-ISA Target Assembly</span>
            </span>

            {/* ISA Target Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
              {(['RISCV', 'ARM64', 'x86_64'] as TargetISA[]).map(isa => (
                <button
                  key={isa}
                  onClick={() => setSelectedISA(isa)}
                  className={`px-2 py-0.5 rounded transition font-bold font-mono ${
                    selectedISA === isa ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isa}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-3 font-mono text-xs overflow-auto bg-slate-950/70 space-y-1">
            {activeStep.expandedCode.length === 0 ? (
              <div className="text-slate-600 italic text-center py-10">Cross-compiled instructions will render during Pass 2...</div>
            ) : (
              (selectedISA === 'RISCV' 
                ? activeStep.isaTranslations.RISCV 
                : selectedISA === 'ARM64' 
                ? activeStep.isaTranslations.ARM64 
                : activeStep.isaTranslations.x86_64
              ).map((line, idx) => (
                <div key={idx} className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-900/40">
                  {line}
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}