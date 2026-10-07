import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseInputProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement>, BaseInputProps {}

export const FormInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 ${
          error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};

export interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>, BaseInputProps {
  value: number;
  onChangeValue: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChangeValue,
  error,
  helperText,
  required,
  id,
}) => {
  const inputId = id || `curr-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    onChangeValue(num);
  };

  const formattedDisplay = value > 0 ? value.toLocaleString('id-ID') : '';

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-semibold text-neutral-400 font-mono">
          Rp
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={formattedDisplay}
          onChange={handleChange}
          placeholder="0"
          className={`w-full pl-11 pr-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 ${
            error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-neutral-300'
          }`}
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};

export interface DateInputProps extends InputHTMLAttributes<HTMLInputElement>, BaseInputProps {}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  ...props
}) => {
  const inputId = id || `date-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={inputId}
        type="date"
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 ${
          error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-neutral-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseInputProps {
  options: { label: string; value: string | number }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  options,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        id={inputId}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 ${
          error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-neutral-300'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};

export interface TextareaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseInputProps {}

export const TextareaInput: React.FC<TextareaInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  ...props
}) => {
  const inputId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        id={inputId}
        rows={3}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 ${
          error ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-neutral-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};
