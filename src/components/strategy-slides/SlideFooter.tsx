import logoFull from "@/assets/logo-iobee-full.svg";

interface SlideFooterProps {
  slideNumber?: number;
  totalSlides?: number;
}

const SlideFooter = ({ slideNumber, totalSlides }: SlideFooterProps) => (
  <div className="absolute bottom-8 left-24 right-24 flex items-center justify-between">
    <img src={logoFull} alt="iOBEE" className="h-6 opacity-30" style={{ width: "fit-content" }} />
    {slideNumber && totalSlides && (
      <span className="text-[14px] text-[#999] font-medium tabular-nums">
        {slideNumber} / {totalSlides}
      </span>
    )}
  </div>
);

export default SlideFooter;
