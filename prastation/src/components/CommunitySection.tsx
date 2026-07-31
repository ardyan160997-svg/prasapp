"use client";

import Link from "next/link";

export function CommunitySection() {
  const benefits = [
    {
      icon: "Crown",
      title: "Creator Pass Member",
      desc: "Diskon 20% semua booking, prioritas jadwal, akses event eksklusif, konsultasi gratis bulanan.",
    },
    {
      icon: "Users",
      title: "Komunitas Discord",
      desc: "Channel sharing, job posting, feedback session, collaboration matching, industry insights.",
    },
    {
      icon: "Calendar",
      title: "Event Bulanan",
      desc: "Workshop, meetup, open house, showcase, networking dinner khusus member.",
    },
    {
      icon: "Award",
      title: "Reward System",
      desc: "Poin per booking, redeem equipment rental, upgrade studio, merchandise eksklusif.",
    },
  ];

  const icons: Record<string, React.ReactNode> = {
    Crown: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    Users: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    Calendar: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Award: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <section id="komunitas" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Bergabung dengan <span className="text-yellow-400">Komunitas</span> Prastation
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Jadi bagian dari ekosistem kreatif yang saling mendukung, belajar, dan berkarya bersama.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, idx) => (
            <Link key={idx} href="#komunitas" className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400 transition-all duration-300 group-hover:bg-yellow-400/25 group-hover:text-yellow-300 group-hover:scale-110">
                {icons[benefit.icon]}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{benefit.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="#komunitas" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Gabung Komunitas Discord
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}