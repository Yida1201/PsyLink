import { useId } from "react";
export function Sprout({ small = false }: { small?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`sprout ${small ? "small" : ""}`}
      viewBox="0 0 280 260"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`leaf-${id}`}
          x1="65"
          y1="65"
          x2="185"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a6b797" />
          <stop offset="1" stopColor="#496953" />
        </linearGradient>
        <linearGradient
          id={`pot-${id}`}
          x1="85"
          y1="160"
          x2="193"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fffdf3" />
          <stop offset=".5" stopColor="#e6e2d4" />
          <stop offset="1" stopColor="#bdbca9" />
        </linearGradient>
        <filter id={`shadow-${id}`}>
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <ellipse
        cx="142"
        cy="235"
        rx="75"
        ry="8"
        fill="#83927a"
        opacity=".2"
        filter={`url(#shadow-${id})`}
      />
      <circle cx="141" cy="118" r="94" fill="#e6ecdf" opacity=".55" />
      <path
        d="M140 185C145 146 151 100 170 74"
        stroke="#6c8561"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M144 151C89 149 65 123 66 89C109 86 142 111 144 151Z"
        fill={`url(#leaf-${id})`}
      />
      <path
        d="M155 115C151 68 176 46 206 43C213 84 187 111 155 115Z"
        fill={`url(#leaf-${id})`}
      />
      <path
        d="M82 101C108 114 124 128 139 143M196 57C181 76 170 91 159 108"
        stroke="#d1dcc5"
        strokeOpacity=".5"
        strokeWidth="1.5"
      />
      <path
        d="M90 173C89 157 192 157 192 173L184 218C181 239 102 239 98 218Z"
        fill={`url(#pot-${id})`}
      />
      <ellipse cx="141" cy="171" rx="51" ry="13" fill="#dedecf" />
      <ellipse cx="141" cy="168" rx="43" ry="9" fill="#818474" />
      <path d="M140 169L141 145" stroke="#65815a" strokeWidth="5" />
      <path
        d="M102 181L106 215"
        stroke="#fffdf5"
        strokeOpacity=".7"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function BookArt({ motif }: { motif: string }) {
  return (
    <svg
      viewBox="0 0 150 130"
      className="book-art"
      aria-hidden="true"
      fill="none"
    >
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
    </svg>
  );
}
