"use client";

import { ChevronLeft, ChevronRight, MapPin, Radio } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui";

const stadiumSlides = [
  {
    name: "National Stadium",
    location: "Addis Ababa",
    image: "/stadiums/national-stadium.svg",
    stat: "60K capacity",
    note: "Main inauguration operations",
  },
  {
    name: "Addis Stadium",
    location: "Addis Ababa",
    image: "/stadiums/addis-stadium.svg",
    stat: "Gate-ready",
    note: "Protocol and media access flow",
  },
  {
    name: "Bahir Dar Stadium",
    location: "Bahir Dar",
    image: "/stadiums/bahir-dar-stadium.svg",
    stat: "Multi-gate",
    note: "Regional event access control",
  },
  {
    name: "Hawassa Stadium",
    location: "Hawassa",
    image: "/stadiums/hawassa-stadium.svg",
    stat: "Live scan",
    note: "Mobile-first entry validation",
  },
];

export function StadiumCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = stadiumSlides[activeIndex];
  const progressWidth = useMemo(() => `${((activeIndex + 1) / stadiumSlides.length) * 100}%`, [activeIndex]);

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
    <section className="group relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(2,6,23,0.16)] md:p-5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at top left, color-mix(in oklab, var(--adey-yellow) 18%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in oklab, var(--adey-blue) 20%, transparent), transparent 38%)" }} />
      <div className="relative grid min-h-[320px] gap-4 overflow-hidden rounded-[1.5rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="relative min-h-[280px] overflow-hidden rounded-[1.25rem] bg-slate-950">
          {stadiumSlides.map((item, index) => (
            <Image
              alt={`${item.name} illustration`}
              className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
              fill
              key={item.name}
              priority={index === 0}
              src={item.image}
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
            <Badge tone="blue"><Radio className="mr-1 size-3" /> Live stadium view</Badge>
            <Badge tone="dark">{slide.stat}</Badge>
          </div>
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/70">
              <MapPin className="size-4" />
              {slide.location}
            </div>
            <h2 className="mt-2 max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">{slide.name}</h2>
            <p className="mt-3 max-w-lg text-sm font-bold leading-6 text-white/74 sm:text-base">{slide.note}</p>
          </div>
        </div>

        <div className="relative grid content-between gap-4 rounded-[1.25rem] border p-5" style={{ background: "color-mix(in oklab, var(--surface) 88%, transparent)", borderColor: "var(--line)" }}>
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "var(--text-muted)" }}>Stadium operations</span>
              <span className="badge-live rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "color-mix(in oklab, var(--ok) 13%, var(--surface))", color: "var(--ok)" }}>Active</span>
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl" style={{ color: "var(--text-strong)" }}>Manage invitations, QR entry, and gate activity from one live control room.</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {["VIP flow", "Gate scans", "Fayda check"].map((label) => (
                <div className="rounded-2xl border p-3" key={label} style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                  <div className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{label}</div>
                  <div className="mt-1 text-lg font-black" style={{ color: "var(--text-strong)" }}>Ready</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full" style={{ background: "color-mix(in oklab, var(--line) 70%, transparent)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: progressWidth, background: "var(--adey-blue)" }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {stadiumSlides.map((item, index) => (
                  <button
                    aria-label={`Show ${item.name}`}
                    className="h-2.5 rounded-full transition-all"
                    key={item.name}
                    onClick={() => setActiveIndex(index)}
                    style={{
                      width: index === activeIndex ? "2rem" : "0.625rem",
                      background: index === activeIndex ? "var(--adey-blue)" : "color-mix(in oklab, var(--text-muted) 28%, transparent)",
                    }}
                    type="button"
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button aria-label="Previous stadium" className="grid size-10 place-items-center rounded-full border transition hover:-translate-x-0.5" onClick={previousSlide} style={{ borderColor: "var(--line)", background: "var(--surface)" }} type="button">
                  <ChevronLeft className="size-5" />
                </button>
                <button aria-label="Next stadium" className="grid size-10 place-items-center rounded-full border transition hover:translate-x-0.5" onClick={nextSlide} style={{ borderColor: "var(--line)", background: "var(--surface)" }} type="button">
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
