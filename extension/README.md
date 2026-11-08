# Fiskalio – nova kartica

Proširenje za Chrome, Edge i Brave koje zamjenjuje stranicu nove kartice. Svaka nova kartica odmah otvara stranicu `/newtab` aplikacije Fiskalio: mjesečni kalendar računa, „Na redu”, koliko je ostalo za platiti i brzo označavanje plaćenog. Samo proširenje nema vlastitu logiku – sav sadržaj dolazi iz aplikacije, pa svaka izmjena aplikacije odmah vrijedi i ovdje.

Datoteke:

- `manifest.json` – Manifest V3, nadjačava novu karticu; jedino dopuštenje je `storage` (pamti adresu aplikacije)
- `newtab.html`, `newtab.js` – preusmjeravaju novu karticu na `/newtab`
- `options.html`, `options.js` – postavke (koju adresu aplikacije otvoriti)
- `icons/` – ikone generirane iz `app/icon.svg`

## Instalacija

Proširenje se učitava nepakirano, izravno iz ove mape.

**Chrome**

1. Otvorite `chrome://extensions`.
2. Gore desno uključite **Developer mode** (Način rada za razvojne programere).
3. Kliknite **Load unpacked** i odaberite mapu `extension` iz ovog repozitorija.

**Edge**

1. Otvorite `edge://extensions`.
2. Uključite **Developer mode** (u lijevom izborniku).
3. Kliknite **Load unpacked** i odaberite mapu `extension`.

**Brave**

1. Otvorite `brave://extensions`.
2. Uključite **Developer mode**, kliknite **Load unpacked** i odaberite mapu `extension`.

## Prvo pokretanje

1. **Potvrdite promjenu nove kartice.** Kad prvi put otvorite novu karticu, preglednik pita želite li zadržati promjenu koju je napravilo proširenje. Odaberite da je zadržavate (npr. „Keep it” / „Zadrži promjene”). Ako odaberete vraćanje na staro, preglednik isključuje proširenje.
2. **Prijavite se.** Ako niste prijavljeni, nova kartica nudi gumb **Prijavi se** i nakon prijave vraća vas na kalendar. Prijava vrijedi i za ostatak aplikacije.

## Kako se ponaša

- Nova kartica je obična stranica aplikacije (`…/newtab`), pa se njezina adresa vidi u adresnoj traci, a kursor je u stranici, ne u adresnoj traci. Za pretraživanje pritisnite **Ctrl+L** (ili **F6**) i tipkajte.
- Poveznice („Otvori Fiskalio”, „Pregled →”) otvaraju aplikaciju u istoj kartici.
- Ako kartica ostane otvorena preko ponoći, sama se osvježi da „danas” i „kasni” budu točni.

Zašto ne prikaz unutar okvira (iframe), koji bi ostavio kursor u adresnoj traci? Unutar okvira preglednik skriva kolačiće prijave od aplikacije. Clerk bi tada napravio novu, praznu sesiju i prepisao kolačić koji koriste obične kartice, pa bi vas svaka nova kartica odjavila. Preusmjeravanje nema taj problem.

## Lokalni razvoj

Zadana adresa je objavljena aplikacija (`https://fiskalio.marinactonci.com`). Za rad s lokalnom verzijom:

1. U `chrome://extensions` kod proširenja kliknite **Details** → **Extension options**.
2. Kliknite **Lokalni razvoj** (`http://localhost:3000`) i zatim **Spremi**.
3. Otvorite novu karticu.

Gumb **Objavljena aplikacija** vraća zadanu adresu.

## Važno

- **Ruta `/newtab` mora biti objavljena.** Zadana adresa radi tek kad je verzija aplikacije s rutom `/newtab` deployana.
- **Ažuriranja:** promjene aplikacije stižu uobičajenim deployem. Samo kad se promijene datoteke u ovoj mapi, u `chrome://extensions` kliknite gumb za ponovno učitavanje (↻) kod proširenja.

## Nije podržano

- **Anonimni (incognito/InPrivate) prozori** – preglednici nikad ne dopuštaju proširenjima da tamo zamijene novu karticu.
- **Firefox** – nije isprobano. Firefox podržava zamjenu nove kartice, ali trajno instalirano proširenje mora biti potpisano preko addons.mozilla.org.
