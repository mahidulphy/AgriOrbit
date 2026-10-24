import React from 'react';

export interface EmailAlertsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isBn: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const EmailAlertsToggle: React.FC<EmailAlertsToggleProps> = ({
  checked,
  onChange,
  isBn,
  disabled = false,
  className = '',
  id = 'email-alerts-toggle',
}) => {
  return (
    <label
      htmlFor={id}
      className={`group flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-colors cursor-pointer select-none min-h-[48px] ${
        checked
          ? 'bg-[#22C55E]/5 border-[#22C55E]/40'
          : 'bg-[#141414] border-[#262626] hover:border-[#404040]'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      <div className="pt-0.5 shrink-0 flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded text-[#22C55E] focus:ring-0 focus:ring-offset-0 border-[#262626] bg-[#0A0A0A] cursor-pointer accent-[#22C55E]"
        />
      </div>

      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#FAFAFA]">
            {isBn ? 'ইমেইল সতর্কতা (এসএমএস শীঘ্রই আসছে)' : 'Email alerts (SMS coming soon)'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border border-[#262626] bg-[#0A0A0A] text-[#A3A3A3] shrink-0">
            EMAIL
          </span>
        </div>
        <p className="text-xs text-[#737373] leading-relaxed font-mono">
          {isBn
            ? 'চরম আবহাওয়া, খরা বা আকস্মিক বন্যার নাসা উপগ্রহ ও আবহাওয়া সতর্কবার্তা সরাসরি আপনার নিবন্ধিত ইমেইলে পৌঁছাবে।'
            : 'NASA satellite & weather alerts for extreme heat, drought, and heavy rainfall sent directly to your email.'}
        </p>
      </div>
    </label>
  );
};
