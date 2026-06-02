"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const stadiumSlides = [
  {
    name: "Bahir Dar Stadium",
    image: "/stadium-photos/dire-dawa-stadium.jpg",
    credit: "Provided stadium photo",
  },
  {
    name: "Adey Abeba Stadium",
    image: "/stadium-photos/national-stadium-construction.png",
    credit: "Provided stadium photo",
  },
  {
    name: "Sheikh Mohammed Al Amoudi Stadium",
    image: "/stadium-photos/hawassa-stadium.jpg",
    credit: "Wikimedia Commons",
  },
  {
    name: "Addis Ababa Stadium Tribune",
    image: "/stadium-photos/addis-ababa-tribune-2018.jpg",
    credit: "Wikimedia Commons",
  },
  {
    name: "Addis Ababa Stadium",
    image: "/stadium-photos/addis-ababa-stadium.jpg",
    credit: "Wikimedia Commons",
  },
  {
    name: "Addis Ababa Stadium Exterior",
    image: "/stadium-photos/addis-ababa-stadium-classic.jpg",
    credit: "Wikimedia Commons",
  },
];

export function StadiumCarousel({ compact = false }: { compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = stadiumSlides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % stadiumSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  function previousSlide() {
    setActiveIndex((current) => (current - 1 + stadiumSlides.length) % stadiumSlides.length);
  }

  function nextSlide() {
    setActiveIndex((current) => (current + 1) % stadiumSlides.length);
  }

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border bg-white p-2 shadow-[var(--shadow-card)]" style={{ borderColor: "var(--stroke)" }}>
      <div className={`relative overflow-hidden rounded-[1rem] bg-slate-950 ${compact ? "aspect-[4/3] min-h-[260px]" : "aspect-[16/5] min-h-[220px]"}`}>
        <Image
          alt={`${slide.name} photo`}
          className="absolute inset-0 h-full w-full object-cover transition duration-700"
          fill
          key={slide.name}
          priority={activeIndex === 0}
          src={slide.image}
          sizes={compact ? "(min-width: 1024px) 52vw, 100vw" : "(min-width: 1024px) 84vw, 100vw"}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/8 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/62">Stadium photo</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">{slide.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Previous stadium" className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur transition hover:bg-white/20" onClick={previousSlide} type="button">
              <ChevronLeft className="size-5" />
            </button>
            <button aria-label="Next stadium" className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur transition hover:bg-white/20" onClick={nextSlide} type="button">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-white/88 px-3 py-1 text-xs font-bold text-slate-600 backdrop-blur">
          {slide.credit}
        </div>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {stadiumSlides.map((item, index) => (
            <button
              aria-label={`Show ${item.name}`}
              className="h-1.5 rounded-full transition-all"
              key={item.name}
              onClick={() => setActiveIndex(index)}
              style={{
                width: index === activeIndex ? "1.75rem" : "0.5rem",
                background: index === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.42)",
              }}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
