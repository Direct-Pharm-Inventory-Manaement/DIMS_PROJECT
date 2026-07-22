import Image from "next/image";

interface AuthHeroProps {
  headline: string;
  description: string;
}

export function AuthHero({ headline, description }: AuthHeroProps) {
  return (
    <section className="relative hidden lg:flex lg:w-1/2">
      <Image
        src="/login-hero.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 0vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-brand-900/40 to-brand-900/15"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col justify-center gap-6 px-12 py-16 xl:px-16">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-light.png"
            alt=""
            width={56}
            height={56}
            priority
            className="rounded-xl shadow-lg"
          />
          <div>
            <p className="text-3xl font-bold text-white">
              Direct Inventory Manager
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              Pharmacy Inventory, In Order
            </p>
          </div>
        </div>
        <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
          {headline.split(" ").map((word, index) => (
            <span
              key={index}
              className="hero-word mr-[0.3em]"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              {word}
            </span>
          ))}
        </h1>
        <p className="max-w-lg text-base leading-7 text-brand-100">
          {description}
        </p>
      </div>
    </section>
  );
}
