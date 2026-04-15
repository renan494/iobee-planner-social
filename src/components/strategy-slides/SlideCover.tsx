import SlideLayout from "./SlideLayout";
import logoIobee from "@/assets/logo-iobee.svg";

interface SlideCoverProps {
  clientName: string;
  date: string;
}

const SlideCover = ({ clientName, date }: SlideCoverProps) => (
  <SlideLayout className="bg-[#1a1a1a]">
    <div className="h-full flex flex-col justify-between p-20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -right-[100px] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[3px] border-[#FDB600]/20" />
      <div className="absolute -right-[200px] top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-[2px] border-[#FDB600]/10" />
      <div className="absolute -left-[150px] -top-[150px] w-[400px] h-[400px] rounded-full border-[2px] border-[#FDB600]/10" />

      <img src={logoIobee} alt="iOBEE" className="h-14 relative z-10 invert brightness-200" style={{ width: "fit-content" }} />

      <div className="relative z-10 flex flex-col max-w-[70%]">
        <p className="text-[26px] text-white/50 font-light mb-6">
          Estratégia de Mídia Social
        </p>
        <h1 className="text-[88px] font-black text-white leading-[0.92] tracking-tight uppercase mb-8">
          {clientName}
        </h1>
        <div className="w-28 h-2 bg-[#FDB600] rounded-full" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[18px] text-white/30 font-medium">{date}</span>
        <div className="w-24 h-1.5 bg-[#FDB600] rounded-full" />
      </div>
    </div>
  </SlideLayout>
);

export default SlideCover;
