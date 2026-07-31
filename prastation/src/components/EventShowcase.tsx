"use client";

import Link from "next/link";

export function EventShowcase() {
  const events = [
    {
      title: "Creative Meetup #1: Content Creator Jakarta",
      slug: "creative-meetup-1-jakarta",
      date: "2025-08-14",
      time: "14:00 - 18:00",
      location: "Prastation Event Hall",
      capacity: 50,
      price: "Rp150.000",
      isFree: false,
      status: "published",
      image: "/images/event-1.jpg",
    },
    {
      title: "Workshop: Lighting Basic untuk Pemula",
      slug: "workshop-lighting-basic",
      date: "2025-08-21",
      time: "10:00 - 13:00",
      location: "Prastation Photo Studio",
      capacity: 15,
      price: "Rp500.000",
      isFree: false,
      status: "published",
      image: "/images/event-2.jpg",
    },
    {
      title: "Open House Prastation",
      slug: "open-house-prastation",
      date: "2025-08-30",
      time: "10:00 - 16:00",
      location: "Prastation All Areas",
      capacity: 100,
      price: "",
      isFree: true,
      status: "published",
      image: "/images/event-3.jpg",
    },
  ];

  return (
    <section id="event" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Event & <span className="text-yellow-400">Komunitas</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Bergabunglah dengan komunitas kreatif. Workshop, meetup, open house, dan networking.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, idx) => (
            <Link key={idx} href={`/event/${event.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10">
              <div className="aspect-video overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-20 w-28 rounded-xl bg-zinc-600/80" />
                    <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Event Image</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    event.isFree 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                  }`}>
                    {event.isFree ? "GRATIS" : event.price}
                  </span>
                  {event.isFree || (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400 border border-white/10">
                      Sisa {event.capacity} kursi
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/event" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Lihat Semua Event & Daftar
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}