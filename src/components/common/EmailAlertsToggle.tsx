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
      className={`group flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none min-h-[48px] ${
        checked
          ? 'bg-[#B8FF3D]/[0.08] border-[#B8FF3D]/40 shadow-sm shadow-[#B8FF3D]/5'
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
      } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      <div className="pt-0.5 shrink-0 flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded text-[#B8FF3D] focus:ring-[#B8FF3D] focus:ring-offset-0 border-white/30 bg-black/50 cursor-pointer accent-[#B8FF3D] transition-transform duration-150 group-active:scale-95"
        />
      </div>

      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white group-hover:text-white transition-colors">
            {isBn ? 'ইমেইল সতর্কতা (এসএমএস শীঘ্রই আসছে)' : 'Email alerts (SMS coming soon)'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30 shrink-0">
            EMAIL
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          {isBn
            ? 'চরম আবহাওয়া, খরা বা আকস্মিক বন্যার বাস্তব নাসা উপগ্রহ ও আবহাওয়া সতর্কবার্তা সরাসরি আপনার নিবন্ধিত ইমেইলে পৌঁছাবে। (মোবাইল এসএমএস সম্প্রচার শীঘ্রই যুক্ত হবে)'
            : 'Real NASA satellite & weather alerts for extreme heat, drought, and heavy rainfall sent directly to your email. (Mobile SMS broadcast coming soon)'}
        </p>
      </div>
    </label>
  );
};
