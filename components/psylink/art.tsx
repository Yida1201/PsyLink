import { useId } from "react";
/**
 * Glazed stoneware planter with a two-leaf sprout. One drawing for the whole
 * product: cylindrical shading, glaze streak, speckled clay, thick rim, soil
 * grain, veined translucent leaves and a soft contact shadow.
 */
export function Planter({
  face = false,
  halo = false,
  className = "",
  viewBox = "0 0 360 300",
}: {
  face?: boolean;
  halo?: boolean;
  className?: string;
  viewBox?: string;
}) {
  const raw = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${raw}`;
  const url = (name: string) => `url(#${id(name)})`;
  const pot = "M121 192L133 251Q136 266 152 267L208 267Q224 266 227 251L239 192Z";
  const leftLeaf = "M180 162C126 166 106 130 115 96C160 95 188 121 180 162Z";
  const rightLeaf = "M182 140C176 92 205 63 250 67C258 110 224 142 182 140Z";
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id("body")} x1="121" x2="239" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cfc6b3" />
          <stop offset=".18" stopColor="#f3ede1" />
          <stop offset=".34" stopColor="#fffdf8" />
          <stop offset=".62" stopColor="#ece4d4" />
          <stop offset=".86" stopColor="#d3c8b3" />
          <stop offset="1" stopColor="#bdb19a" />
        </linearGradient>
        <linearGradient id={id("depth")} x1="0" x2="0" y1="192" y2="267" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".18" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#6d5f47" stopOpacity=".28" />
        </linearGradient>
        <radialGradient id={id("bounce")} cx="214" cy="256" r="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f2c9ad" stopOpacity=".55" />
          <stop offset="1" stopColor="#f2c9ad" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("lipTop")} x1="0" x2="0" y1="178" y2="202" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffefb" />
          <stop offset="1" stopColor="#e7dfcf" />
        </linearGradient>
        <linearGradient id={id("lipSide")} x1="119" x2="241" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bfb39c" />
          <stop offset=".35" stopColor="#efe8da" />
          <stop offset="1" stopColor="#b5a88f" />
        </linearGradient>
        <radialGradient id={id("soil")} cx="180" cy="188" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6e5a45" />
          <stop offset="1" stopColor="#3f3226" />
        </radialGradient>
        <linearGradient id={id("leafA")} x1="115" y1="96" x2="182" y2="162" gradientUnits="userSpaceOnUse">
          <stop stopColor="#cfe0bd" />
          <stop offset=".45" stopColor="#93b285" />
          <stop offset="1" stopColor="#4d7255" />
        </linearGradient>
        <linearGradient id={id("leafB")} x1="250" y1="67" x2="182" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dbe8c9" />
          <stop offset=".4" stopColor="#a3bf92" />
          <stop offset="1" stopColor="#557a5b" />
        </linearGradient>
        <linearGradient id={id("stem")} x1="176" x2="186" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f7253" />
          <stop offset=".5" stopColor="#7fa076" />
          <stop offset="1" stopColor="#456649" />
        </linearGradient>
        <radialGradient id={id("halo")} cx="180" cy="130" r="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4f7ee" stopOpacity=".95" />
          <stop offset=".72" stopColor="#e3eadb" stopOpacity=".7" />
          <stop offset="1" stopColor="#d5dfcb" stopOpacity=".2" />
        </radialGradient>
        <clipPath id={id("potClip")}><path d={pot} /></clipPath>
        <clipPath id={id("soilClip")}><ellipse cx="180" cy="190" rx="49" ry="7.5" /></clipPath>
        <filter id={id("speckle")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="1" seed="7" />
          <feColorMatrix values="0 0 0 0 .36  0 0 0 0 .31  0 0 0 0 .24  0 0 0 -24 10.4" />
        </filter>
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="2" />
          <feColorMatrix values="0 0 0 0 .86  0 0 0 0 .76  0 0 0 0 .62  0 0 0 -7 4.2" />
        </filter>
        <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={id("tight")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter>
        <filter id={id("glaze")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>

      {halo && (
        <g>
          <circle cx="180" cy="134" r="122" fill={url("halo")} />
          <circle cx="180" cy="134" r="121.5" stroke="#fff" strokeOpacity=".8" />
          <path d="M84 70A122 122 0 0 1 238 26" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </g>
      )}

      {/* contact shadow + ambient occlusion */}
      <ellipse cx="182" cy="270" rx="78" ry="10" fill="#2b3a2f" opacity=".22" filter={url("soft")} />
      <ellipse cx="180" cy="267" rx="50" ry="4" fill="#2b2a22" opacity=".35" filter={url("tight")} />

      {/* leaves sit behind the rim */}
      <g className={face ? "welcome-leaves" : undefined}>
        <path d="M180 196C181 166 181 136 183 110" stroke={url("stem")} strokeWidth="6.5" strokeLinecap="round" />
        <path d={leftLeaf} fill={url("leafA")} />
        <path d={leftLeaf} stroke="#eef6e4" strokeOpacity=".55" strokeWidth="1.2" />
        <path d="M178 158C162 140 137 120 119 99" stroke="#e6f0da" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M160 140L142 136M148 127L131 121M168 150L154 151" stroke="#e6f0da" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
        <path d={rightLeaf} fill={url("leafB")} />
        <path d={rightLeaf} stroke="#f2f8e8" strokeOpacity=".6" strokeWidth="1.2" />
        <path d="M184 137C200 114 222 91 247 70" stroke="#eef5e2" strokeOpacity=".8" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M199 118L217 117M210 104L229 101M193 127L203 133" stroke="#eef5e2" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
        {/* a little sheen on each leaf */}
        <path d="M126 104C145 106 162 119 170 136" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" filter={url("glaze")} />
        <path d="M241 76C228 82 214 96 205 110" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" filter={url("glaze")} />
      </g>

      {/* stoneware body */}
      <path d={pot} fill={url("body")} />
      <g clipPath={url("potClip")}>
        <rect x="115" y="185" width="130" height="90" filter={url("speckle")} opacity=".4" />
        <rect x="115" y="185" width="130" height="90" fill={url("depth")} />
        <rect x="115" y="185" width="130" height="90" fill={url("bounce")} />
        {/* foot ring */}
        <path d="M128 255Q180 262 232 255L230 270L130 270Z" fill="#9b8e76" opacity=".22" />
        {/* glaze streaks */}
        <path d="M143 206L150 254" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85" filter={url("glaze")} />
        <path d="M156 205L160 230" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".55" filter={url("glaze")} />
      </g>
      <path d={pot} stroke="#8f826a" strokeOpacity=".25" />

      {/* thick rim: side band, top lip, opening, soil */}
      <path d="M119 190A61 12 0 0 0 241 190L241 197A61 12 0 0 1 119 197Z" fill={url("lipSide")} />
      <ellipse cx="180" cy="190" rx="61" ry="12" fill={url("lipTop")} />
      <path d="M124 187A57 9 0 0 1 236 187" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
      <ellipse cx="180" cy="190" rx="51" ry="8.5" fill="#5d4f3e" />
      <ellipse cx="180" cy="191" rx="49" ry="7.5" fill={url("soil")} />
      <g clipPath={url("soilClip")}><rect x="128" y="180" width="104" height="20" filter={url("grain")} opacity=".5" /></g>
      <path d="M180 191C181 184 181 178 181.5 172" stroke={url("stem")} strokeWidth="6.5" strokeLinecap="round" />

      {face && (
        <g>
          <ellipse cx="152" cy="232" rx="8" ry="4" fill="#e9a891" opacity=".55" filter={url("tight")} />
          <ellipse cx="208" cy="232" rx="8" ry="4" fill="#e9a891" opacity=".55" filter={url("tight")} />
          <circle cx="163" cy="222" r="3.4" fill="#3f4a3a" />
          <circle cx="197" cy="222" r="3.4" fill="#3f4a3a" />
          <circle cx="164.2" cy="220.8" r="1.1" fill="#fff" />
          <circle cx="198.2" cy="220.8" r="1.1" fill="#fff" />
          <path d="M173 232Q180 238.5 187 232" stroke="#3f4a3a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
export function Sprout({ small = false }: { small?: boolean }) {
  return <Planter halo viewBox="56 10 248 266" className={`sprout ${small ? "small" : ""}`} />;
}
export function BookArt({ motif }: { motif: string }) {
  // Blind-stamped into cloth: a light lower edge, a dark upper edge, then ink.
  const art = (
    <>
      {motif === "leaf" ? (
        <>
          <path d="M75 118V30" stroke="currentColor" strokeWidth="2" />
          <path
            d="M76 65C40 68 26 47 29 22C57 24 78 41 76 65ZM76 95C112 93 126 74 122 48C92 48 74 69 76 95Z"
            fill="currentColor"
            opacity=".7"
          />
        </>
      ) : motif === "sun" ? (
        <>
          <circle cx="75" cy="56" r="29" fill="currentColor" opacity=".65" />
          <path
            d="M16 108H134M31 97H119M46 86H104"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      ) : motif === "circles" ? (
        <>
          <circle
            cx="59"
            cy="61"
            r="34"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="91" cy="76" r="34" fill="currentColor" opacity=".3" />
          <circle
            cx="91"
            cy="76"
            r="23"
            stroke="currentColor"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          {[30, 50, 70, 90].map((y) => (
            <path
              key={y}
              d={`M10 ${y}Q42 ${y - 25} 75 ${y}T140 ${y}`}
              stroke="currentColor"
              strokeWidth="2"
            />
          ))}
        </>
      )}
    </>
  );
  return (
    <svg
      viewBox="0 0 150 130"
      className="book-art"
      aria-hidden="true"
      fill="none"
    >
      <g transform="translate(0.7 1)" style={{ color: "rgb(255 255 255 / 0.55)" }}>{art}</g>
      <g transform="translate(-0.5 -0.7)" style={{ color: "rgb(40 30 20 / 0.22)" }}>{art}</g>
      <g>{art}</g>
    </svg>
  );
}

/**
 * Oak-and-glass sand timer for Today Together: a little time, made physical.
 * Same oak as the turntable plinth, same glass language as the planter halo.
 */
export function Hourglass({ className = "" }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${raw}`;
  const url = (name: string) => `url(#${id(name)})`;
  const glass =
    "M78 41C50 58 52 100 94 118C97 119.5 97 121.5 94 123C52 140 50 182 78 200L122 200C150 182 148 140 106 123C103 121.5 103 119.5 106 118C148 100 150 58 122 41Z";
  const post = (x: number) => (
    <g key={x}>
      <rect x={x - 4} y="38" width="8" height="166" rx="4" fill={url("post")} />
      <ellipse cx={x} cy="46" rx="6.5" ry="3.2" fill={url("post")} />
      <ellipse cx={x} cy="196" rx="6.5" ry="3.2" fill={url("post")} />
    </g>
  );
  return (
    <svg className={className} viewBox="0 0 200 240" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id("oak")} x1="34" x2="166" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b5814f" />
          <stop offset=".3" stopColor="#dcb283" />
          <stop offset=".55" stopColor="#e8c79c" />
          <stop offset="1" stopColor="#ad7746" />
        </linearGradient>
        <linearGradient id={id("oakTop")} x1="0" x2="0" y1="18" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0d5ae" />
          <stop offset="1" stopColor="#d2a675" />
        </linearGradient>
        <linearGradient id={id("post")} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#9c6b3e" />
          <stop offset=".4" stopColor="#e6c294" />
          <stop offset="1" stopColor="#94633a" />
        </linearGradient>
        <linearGradient id={id("glass")} x1="50" x2="150" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".42" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".1" />
          <stop offset=".75" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#fff" stopOpacity=".34" />
        </linearGradient>
        <linearGradient id={id("sand")} x1="0" x2="0" y1="90" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#efd3a4" />
          <stop offset="1" stopColor="#c99d62" />
        </linearGradient>
        <clipPath id={id("glassClip")}><path d={glass} /></clipPath>
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="2" seed="5" />
          <feColorMatrix values="0 0 0 0 .38  0 0 0 0 .22  0 0 0 0 .09  0 0 0 .7 -.15" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>

      <ellipse cx="104" cy="224" rx="78" ry="9" fill="#3b2c1c" opacity=".26" filter={url("soft")} />

      {/* glass, sand and stream */}
      <path d={glass} fill={url("glass")} />
      <g clipPath={url("glassClip")}>
        <path d="M54 96Q100 106 146 96L146 126L54 126Z" fill={url("sand")} />
        <path d="M54 96Q100 106 146 96" stroke="#fff4dc" strokeOpacity=".7" />
        <path d="M58 202Q100 160 142 202Z" fill={url("sand")} />
        <path d="M74 190Q100 166 126 190" stroke="#fff4dc" strokeOpacity=".5" />
        <path className="hourglass-stream" d="M100 121V176" stroke="#d8b27a" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" />
      </g>
      <path d={glass} stroke="#fff" strokeOpacity=".85" strokeWidth="1.3" />
      <path d={glass} stroke="#5c4a33" strokeOpacity=".18" strokeWidth=".8" transform="translate(.6 .8)" />
      <path d="M71 52C61 72 65 94 84 108" stroke="#fff" strokeOpacity=".8" strokeWidth="3.2" strokeLinecap="round" filter={url("blur")} />
      <path d="M71 189C61 169 65 147 84 133" stroke="#fff" strokeOpacity=".7" strokeWidth="3.2" strokeLinecap="round" filter={url("blur")} />
      <path d="M131 58C137 70 136 84 128 96" stroke="#fff" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" filter={url("blur")} />

      {/* front posts */}
      {post(42)}
      {post(158)}

      {/* oak caps: side band + top face, with grain */}
      {[{ y: 26, h: 12 }, { y: 200, h: 14 }].map(({ y, h }) => (
        <g key={y}>
          <path d={`M34 ${y}A66 11 0 0 0 166 ${y}L166 ${y + h}A66 11 0 0 1 34 ${y + h}Z`} fill={url("oak")} />
          <path d={`M34 ${y}A66 11 0 0 0 166 ${y}L166 ${y + h}A66 11 0 0 1 34 ${y + h}Z`} filter={url("grain")} opacity=".55" />
          <ellipse cx="100" cy={y} rx="66" ry="11" fill={url("oakTop")} />
          <ellipse cx="100" cy={y} rx="66" ry="11" filter={url("grain")} opacity=".4" />
          <path d={`M38 ${y - 1}A62 9 0 0 1 162 ${y - 1}`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M34 ${y + h}A66 11 0 0 0 166 ${y + h}`} stroke="#6e4826" strokeOpacity=".35" />
        </g>
      ))}
    </svg>
  );
}
