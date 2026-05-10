import ScrollRevealPane from './ScrollRevealPane';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col overflow-hidden md:h-[calc(100vh-60px)] md:flex-row">
      <ScrollRevealPane>
        {children}
      </ScrollRevealPane>

      <div className="hidden h-full w-[40%] border-l border-gray-200 bg-white md:block">
        <div className="relative h-full overflow-hidden bg-[#f8fafc]">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.82),rgba(255,255,255,0.82)),radial-gradient(circle_at_20%_18%,rgba(203,213,225,0.22),transparent_20%),radial-gradient(circle_at_78%_34%,rgba(203,213,225,0.2),transparent_18%),radial-gradient(circle_at_42%_78%,rgba(203,213,225,0.18),transparent_20%)]" />
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(203,213,225,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.45)_1px,transparent_1px)] [background-size:120px_120px]" />
          <div className="absolute left-[10%] top-[14%] h-24 w-36 rounded-[28px] border border-slate-200/70 bg-white/70" />
          <div className="absolute right-[12%] top-[23%] h-20 w-28 rounded-[24px] border border-slate-200/70 bg-white/70" />
          <div className="absolute left-[24%] top-[42%] h-28 w-44 rounded-[32px] border border-slate-200/70 bg-white/70" />
          <div className="absolute right-[18%] top-[54%] h-24 w-36 rounded-[28px] border border-slate-200/70 bg-white/70" />
          <div className="absolute left-[14%] bottom-[10%] h-20 w-28 rounded-[24px] border border-slate-200/70 bg-white/70" />
          <div className="absolute right-[28%] bottom-[18%] h-16 w-16 rounded-full bg-[#dbe7ff]" />
          <div className="absolute left-[33%] top-[28%] h-3 w-3 rounded-full bg-[#3d7fff] shadow-[0_0_0_10px_rgba(61,127,255,0.16)]" />
          <div className="absolute right-[30%] top-[47%] h-3 w-3 rounded-full bg-[#7ea7ff] shadow-[0_0_0_10px_rgba(126,167,255,0.14)]" />
          <div className="absolute bottom-[26%] left-[48%] h-3 w-3 rounded-full bg-[#3d7fff] shadow-[0_0_0_10px_rgba(61,127,255,0.16)]" />
        </div>
      </div>
    </div>
  );
}
