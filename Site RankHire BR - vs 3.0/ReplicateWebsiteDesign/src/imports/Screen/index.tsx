import imgImage from "./079715c230cc4dc0518a01b3ae81ffe966dba11f.png";
import imgImage1 from "./6a7e9b0e188a59fa2eba23ba4550e2ee60426c9d.png";
import imgImage2 from "./41c86b422ec4415403a46890ee0b7edbdcd3d30f.png";
import imgImage3 from "./9552ba56c99c5450947791c1af86661465c6f6a7.png";

function Component3Homepage() {
  return (
    <div className="absolute contents left-0 top-0" data-name="3. Homepage">
      <div className="absolute h-[2169.333px] left-0 top-[6506px] w-[1440px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
      </div>
      <div className="absolute h-[2168.667px] left-0 top-[4337.33px] w-[1440px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
      </div>
      <div className="absolute h-[2168.667px] left-0 top-[2168.67px] w-[1440px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
      <div className="absolute h-[2168.667px] left-0 top-0 w-[1440px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
      </div>
    </div>
  );
}

export default function Screen() {
  return (
    <div className="bg-[#09090b] relative size-full" data-name="Screen">
      <Component3Homepage />
    </div>
  );
}