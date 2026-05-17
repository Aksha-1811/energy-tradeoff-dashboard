import { useId, useState } from "react";

interface InfoTipProps {
  title: string;
  children: React.ReactNode;
  align?: "right" | "left";
}

export function InfoTip({ title, children, align = "right" }: InfoTipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-3 right-2 z-20">
      <button
        type="button"
        aria-label="Info"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
      >
        <span className="text-xs font-semibold">i</span>
      </button>

      {open && (
        <div
          id={id}
          role="tooltip"
          className={`absolute top-9 z-[9999] w-[340px] rounded-xl border bg-white p-3 text-left text-xs text-gray-700 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="text-[11px] font-semibold text-gray-900">{title}</div>
          <div className="mt-1 leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}
