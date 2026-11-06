import { cn } from "@/lib/utils";
import { container, displayHeading, Dot, PROFILES } from "./shared";

const card = "flex flex-col gap-[18px] rounded-[20px] p-7";
const cardLabel = "font-mono text-[13px]";
const cardTitle = "font-display text-[28px] font-bold tracking-[-0.02em]";

const PROFILE_LIST = [PROFILES.stan, PROFILES.brac, PROFILES.mama];
const BILLS = ["HEP struja", "Plin", "A1 internet"];
const PAYMENTS = [
  { month: "Stu 2026", amount: "48,60 €", paid: false },
  { month: "Lis 2026", amount: "52,10 €", paid: true },
  { month: "Ruj 2026", amount: "45,30 €", paid: true },
];

/** "Kako radi": profil / račun / uplata. */
export function HowItWorks() {
  return (
    <section
      id="kako"
      aria-labelledby="kako-naslov"
      className={cn(container, "py-20 md:pt-28 md:pb-26")}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
        <h2
          id="kako-naslov"
          className={cn(
            displayHeading,
            "flex-[1_1_520px] text-[clamp(36px,4.4vw,60px)]",
          )}
        >
          Tri stvari.
          <br />
          To je cijeli sustav.
        </h2>
        <p className="max-w-[440px] flex-[1_1_360px] text-lg text-ink-2">
          Sve što unesete svodi se na profil, račun i mjesečnu uplatu. Jednom
          postavite profile i račune – uplate dalje dolaze same.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
        {/* 01 */}
        <div className={cn(card, "border border-line bg-card")}>
          <p className={cn(cardLabel, "text-muted-foreground")}>01 / PROFIL</p>
          <h3 className={cardTitle}>Za koga ili za što plaćate</h3>
          <p className="text-ink-2">
            Stan, vikendica, roditelji, poslovni prostor. Svaki profil ima
            svoju adresu i boju, pa ga na kalendaru prepoznate na prvi pogled.
          </p>
          <ul className="mt-auto flex flex-col gap-2">
            {PROFILE_LIST.map((profile) => (
              <li
                key={profile.name}
                className="flex items-center gap-2.5 rounded-xl bg-paper px-3.5 py-3"
              >
                <Dot color={profile.color} className="size-3" />
                <span className="font-semibold">{profile.name}</span>
                <span className="ml-auto text-[13px] text-muted-foreground">
                  {profile.city}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 02 */}
        <div className={cn(card, "border border-line bg-card")}>
          <p className={cn(cardLabel, "text-muted-foreground")}>02 / RAČUN</p>
          <h3 className={cardTitle}>Obveza koja se ponavlja</h3>
          <p className="text-ink-2">
            Struja, voda, internet, pričuva. Uz račun spremite poveznicu na
            portal za e-račune i podatke za prijavu – šifrirano.
          </p>
          <ul className="mt-auto overflow-hidden rounded-xl border border-line">
            {BILLS.map((bill) => (
              <li
                key={bill}
                className="flex items-center gap-2.5 border-b border-line-soft px-3.5 py-3 last:border-b-0"
              >
                <Dot color={PROFILES.stan.color} className="size-2" />
                <span className="font-semibold">{bill}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  e-račun ↗
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 03 */}
        <div className={cn(card, "bg-ink text-white md:col-span-2 lg:col-span-1")}>
          <p className={cn(cardLabel, "text-[#B9BCC4]")}>03 / UPLATA</p>
          <h3 className={cardTitle}>Jedna po računu, svaki mjesec</h3>
          <p className="text-[#D5D7DC]">
            Iznos, datum dospijeća i bilješka. Kad platite – jedan klik. Ono što
            nije plaćeno na vrijeme samo isplivava na vrh.
          </p>
          <ul className="mt-auto flex flex-col gap-2 font-mono text-sm">
            {PAYMENTS.map((payment) => (
              <li
                key={payment.month}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl bg-[#23262D] px-3.5 py-3",
                  payment.paid && "text-[#B9BCC4]",
                )}
              >
                <span>{payment.month}</span>
                <span>{payment.amount}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-[3px] text-[11px]",
                    payment.paid ? "bg-lime text-ink" : "bg-ink-2",
                  )}
                >
                  {payment.paid ? "PLAĆENO" : "ČEKA"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
