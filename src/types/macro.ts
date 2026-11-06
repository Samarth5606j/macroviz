// src/types/macro.ts

export type TargetISA = 'x86_64' | 'ARM64' | 'RISCV';

export interface MNTEntry {
  index: number;
  name: string;
  ppCount: number;
  kpCount: number;
  mdtIndex: number;
  kpdtIndex: number;
}

export interface MDTEntry {
  index: number;
  instruction: string;
}

export interface KPDTABEntry {
  index: number;
  paramName: string;
  defaultValue: string;
}

export interface ALAEntry {
  index: string;
  formal: string;
  actual: string;
}

export interface SecurityDiagnostic {
  type: 'BUFFER_OVERFLOW' | 'OPERATOR_PRECEDENCE' | 'TAINT_EXPOSURE' | 'CLEAN';
  severity: 'CRITICAL' | 'WARNING' | 'SECURE';
  targetLine: number;
  message: string;
  autoRemediation?: string;
}

export interface AIInliningDecision {
  macroName: string;
  bodyInstructionCount: number;
  callSiteFrequency: number;
  cacheFootprintBytes: number;
  decision: 'INLINE' | 'SYNTHESIZE_SUBROUTINE';
  speedupVsSubroutinePct: number;
  l1CacheHitRatePct: number;
  rationale: string;
}

export interface StackFrame {
  macroName: string;
  depth: number;
  currentMdtIndex: number;
  argumentsPassed: string;
}

export interface ISATranslation {
  x86_64: string[];
  ARM64: string[];
  RISCV: string[];
}

export interface ProcessorStep {
  stepNumber: number;
  pass: 1 | 2;
  currentLineIndex: number;
  currentLineContent: string;
  explanation: string;
  mnt: MNTEntry[];
  mdt: MDTEntry[];
  kpdt: KPDTABEntry[];
  ala: ALAEntry[];
  callStack: StackFrame[];
  expandedCode: string[];
  isaTranslations: ISATranslation;
  aiMetrics: AIInliningDecision[];
  diagnostics: SecurityDiagnostic[];
  error?: string;
  isComplete?: boolean;
}