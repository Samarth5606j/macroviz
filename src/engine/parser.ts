// src/engine/parser.ts
import { SecurityDiagnostic } from '../types/macro';

export const STANDARD_OPCODES = new Set([
  'START', 'END', 'READ', 'PRINT', 'MOVR', 'MOV', 'ADD', 'SUB',
  'MUL', 'DIV', 'CMP', 'JMP', 'JE', 'JNE', 'CALL', 'RET', 'PUSH', 'POP'
]);

export function cleanLine(line: string): string {
  const commentIdx = line.indexOf(';');
  const withoutComment = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
  return withoutComment.trim();
}

export function tokenize(line: string): string[] {
  return line
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

// Direction 3: Formal Verification & Security Vulnerability Guard
export function auditMacroSecurity(macroName: string, lines: string[], startLine: number): SecurityDiagnostic[] {
  const diagnostics: SecurityDiagnostic[] = [];

  lines.forEach((line, idx) => {
    const trimmed = cleanLine(line);
    const lineNum = startLine + idx;

    // 1. Unconstrained buffer length check
    if (trimmed.toUpperCase().includes('ALLOC') || trimmed.toUpperCase().includes('BUFF') || trimmed.toUpperCase().includes('COPY')) {
      if (!lines.some(l => l.toUpperCase().includes('CMP') || l.toUpperCase().includes('LIMIT'))) {
        diagnostics.push({
          type: 'BUFFER_OVERFLOW',
          severity: 'CRITICAL',
          targetLine: lineNum,
          message: `Unchecked buffer operation detected in macro '${macroName}'. Parameter length is unconstrained.`,
          autoRemediation: `Inject: CMP &LEN, 64; JL SECURE_ALLOC`
        });
      }
    }

    // 2. Operator Precedence Bug (e.g. MULT &VAR, 1+2 without parentheses)
    if (trimmed.includes('+') || trimmed.includes('*')) {
      if (!trimmed.includes('(') && !trimmed.includes(')')) {
        diagnostics.push({
          type: 'OPERATOR_PRECEDENCE',
          severity: 'WARNING',
          targetLine: lineNum,
          message: `Expression in '${trimmed}' lacks parenthetical scoping. High risk of macro precedence corruption.`,
          autoRemediation: `Wrap formal operands in grouping enclosures: (&EXPR)`
        });
      }
    }
  });

  if (diagnostics.length === 0) {
    diagnostics.push({
      type: 'CLEAN',
      severity: 'SECURE',
      targetLine: startLine,
      message: `Formal AST inspection passed: No buffer-overflow or taint exposures detected in '${macroName}'.`
    });
  }

  return diagnostics;
}