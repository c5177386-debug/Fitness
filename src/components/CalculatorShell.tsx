'use client';

import { useState, useMemo } from 'react';
import type { ToolConfig } from '@/lib/tools-registry';

interface CalculatorShellProps {
  tool: ToolConfig;
  resultRenderer: (result: unknown) => React.ReactNode;
}

/**
 * CalculatorShell — 通用计算器外壳
 * 所有工具共享这个 UI 框架。差异由 tool.fields 和 resultRenderer 注入。
 */
export default function CalculatorShell({ tool, resultRenderer }: CalculatorShellProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    Object.fromEntries(
      tool.fields.map((f) => [f.key, f.default ?? ''])
    )
  );
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Dynamically import the engine module
      const mod = await import(/* @vite-ignore */ tool.engine);
      const fn = mod[tool.resultFn];
      if (!fn) throw new Error(`Function ${tool.resultFn} not found`);

      // Build input object, coerce numeric strings
      const input: Record<string, unknown> = {};
      for (const field of tool.fields) {
        const v = values[field.key];
        if (field.type === 'number') {
          const num = typeof v === 'string' ? parseFloat(v) : v as number;
          if (isNaN(num)) throw new Error(`Please enter a valid number for "${field.label}"`);
          input[field.key] = num;
        } else {
          input[field.key] = v;
        }
      }

      const calcResult = fn(input);
      setResult(calcResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setValues(
      Object.fromEntries(tool.fields.map((f) => [f.key, f.default ?? '']))
    );
    setResult(null);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <section className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Enter Your Values</h2>
        <div className="space-y-5">
          {tool.fields.map((field) => (
            <div key={field.key}>
              <label className="calc-label" htmlFor={field.key}>
                {field.label}
              </label>
              {field.type === 'number' ? (
                <input
                  id={field.key}
                  type="number"
                  className="calc-input"
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={values[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  aria-label={field.label}
                />
              ) : (
                <select
                  id={field.key}
                  className="calc-input"
                  value={values[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  aria-label={field.label}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button className="calc-btn" onClick={handleCalculate} disabled={isLoading}>
            {isLoading ? 'Calculating…' : 'Calculate'}
          </button>
          <button
            className="px-4 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </section>

      {/* Result */}
      <section>
        {result ? (
          <div className="result-card">
            <h2 className="text-xl font-bold text-primary-800 mb-4">Results</h2>
            {resultRenderer(result)}
          </div>
        ) : (
          <div className="card text-center text-slate-500 py-12">
            <div className="text-5xl mb-4">📊</div>
            <p>Enter your values and click Calculate to see your results.</p>
          </div>
        )}
      </section>
    </div>
  );
}
