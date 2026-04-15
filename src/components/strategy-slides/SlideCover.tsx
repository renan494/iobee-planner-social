import SlideLayout from "./SlideLayout";
import logoFull from "@/assets/logo-iobee-full.svg";
import symbolPink from "@/assets/symbol-pink.svg";

interface SlideCoverProps {
  clientName: string;
  date: string;
}

const SlideCover = ({ clientName, date }: SlideCoverProps) => (
  <SlideLayout className="bg-[#E81F76]">
    <div className="h-full flex flex-col justify-between p-20 relative overflow-hidden">
      {/* Brand ring symbol — decorative */}
      <img
        src={symbolPink}
        alt=""
        className="absolute -right-[120px] top-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-20"
        style={{ filter: "brightness(0) invert(1)" }}
      />

      {/* Logo white */}
      <img
        src={logoFull}
        alt="iOBEE"
        className="h-10 relative z-10"
        style={{ width: "fit-content", filter: "brightness(0) invert(1)" }}
      />

      <div className="relative z-10 flex flex-col max-w-[65%]">
        <p className="text-[24px] text-white/60 font-light mb-5 tracking-wide">
          Estratégia de Mídia Social
        </p>
        <h1 className="text-[88px] font-black text-white leading-[0.92] tracking-tight uppercase mb-8">
          {clientName}
        </h1>
        <div className="w-28 h-2 bg-white/40 rounded-full" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[18px] text-white/50 font-medium">{date}</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FDB600]" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  </SlideLayout>
);

export default SlideCover;
