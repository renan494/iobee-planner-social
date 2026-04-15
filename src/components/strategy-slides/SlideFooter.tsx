import logoIobee from "@/assets/logo-iobee.svg";

interface SlideFooterProps {
  slideNumber?: number;
  totalSlides?: number;
}

const SlideFooter = ({ slideNumber, totalSlides }: SlideFooterProps) => (
  <div className="absolute bottom-8 left-24 right-24 flex items-center justify-between">
    <img src={logoIobee} alt="iOBEE" className="h-6 opacity-40" style={{ width: "fit-content" }} />
    {slideNumber && totalSlides && (
      <span className="text-[14px] text-[#aaa] font-medium tabular-nums">
        {slideNumber} / {totalSlides}
      </span>
    )}
  </div>
);

export default SlideFooter;
