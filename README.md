# Kombinatorika: trezor

Multiplayer igra u pregledaču koja gradivo kombinatornih prebrojavanja pretvara u trku. Timovi rešavaju zadatke, osvajaju poene, sabotiraju jedni druge i prate rang-listu uživo na projektoru. Brojevi u zadacima se menjaju, a odgovor se može uneti kao izraz, na primer `C(7,3)` ili `7!/(3!*4!)`.

Igra je nastala kao pratnja klasi;ne prezentacije za predavanje iz Diskretne Matematike.

## Šta igra pokriva

**Gradivo je iz poglavlja o uređenim i neuređenim izborima elemenata:**

* Uređeni izbor sa ponavljanjem
* Permutacije skupa
* m-permutacije skupa
* Permutacije multiskupa
* Podskupovi skupa od n elemenata
* m-kombinacije skupa
* Jednačine $x_1 + \dots + x_m = n$ (zvezde i pregrade)
* m-kombinacije multiskupa

## Načini igre

Na ekranu za ulazak bira se način igre i opcije:

| Izbor | Opis |
| :--- | :--- |
| **Trezor** | 6 zadataka, svaka tačna daje jednu cifru. Cifre se unose u završni trezor. |
| **Nivoi** | 4 nivoa i 9 zadataka. Sledeći nivo se otključava tek kada se završi prethodni. |
| **Solo** | Igra se sam, odmah, bez čekanja administratora i bez pojavljivanja na rang-listi. |
| **Test režim** | Igra počinje odmah, a na rang-listi se pojavljuju 4 računarska igrača. |
| **Bez opcija** | Takmičenje između timova: čeka se START administratora, rang-lista i sabotaže su aktivni. |

Nivoi: Osnove, Permutacije, Kombinacije, Zvezde i pregrade.

## Mogućnosti

- **Nasumični zadaci.** Pitanje je isto, brojevi su drugačiji za svaki tim. Tačan odgovor se izračunava po formuli, a tekst, hint i objašnjenje se generišu sa tim istim brojevima.
- **Odgovor kao izraz.** Prihvata se svaka tačna vrednost, bez obzira na zapis (vidi dole).
- **Bodovanje koje nagrađuje znanje.** Tačnost, broj pokušaja i brzina utiču na rezultat, pa nasumično pogađanje ne pobeđuje.
- **Sabotaže.** Poenima se kupuju napadi na druge timove i štit.
- **Rang-lista uživo.** Posebna stranica za projektor sa QR kodom za pridruživanje i prikazom sabotaža u realnom vremenu.
- **Botovi.** Četiri simulirana tima za testiranje bez prisustva administratora.

## Unos odgovora

Polje za odgovor prima broj ili matematički izraz. Sve sledeće je jednako tačno za rezultat 35:

```
35
C(7,3)
7!/(3!*4!)
7*6*5/6
binom(7;3)
```

Podržano: `+ - * / ^ ( ) !`, znakovi `×` i `·`, funkcije `C(n,k)`, `P(n,k)`, `fact(n)`. Argumenti se razdvajaju zarezom ili tačka-zarezom. Izrazi se izračunavaju sopstvenim parserom, bez `eval`.

## Bodovanje

| Događaj | Poeni |
|---|---|
| Tačan odgovor | +100 |
| Tačno iz prvog pokušaja | +30 |
| Tačno iz drugog pokušaja | +15 |
| Svaki pogrešan pokušaj | -5 |
| Brzina | do +50 (opada tokom 90 s) |
| Hint | -10 |
| Pogrešna šifra trezora | -5 |
| Otključan trezor / završena igra | +100 |

## Sabotaže

| Akcija | Cena | Trajanje | Efekat |
|---|---|---|---|
| Zamrzni | 100 | 10 s | Meta ne može da šalje odgovore |
| Zamagli | 67 | 17 s | Tekst zadatka se zamuti |
| Firewall | 145 | 30 s | Svaki pogrešan odgovor mete košta 15 poena više |
| Blokiraj hint | 200 | 90 s | Meta ne može da otvori hint |
| Štit | 35 | 45 s | Poništava sve dolazne napade |

Između dva napada postoji pauza od 12 sekundi.

## Kako radi

Aplikacija je statička i nema sopstveni server.

- **Front-end:** čist HTML, CSS i JavaScript (ES moduli), bez frameworka i bez build koraka.
- **Hosting:** GitHub Pages.
- **Baza i sinhronizacija:** Firebase Firestore, rang-lista se osvežava preko slušalaca u realnom vremenu.
- **Prijava:** timovi anonimno (Firebase Anonymous Auth), administrator preko Google naloga.
- **Zadaci:** generatori u `questions.js`. Svaki tim ima svoj `seed`, pa su brojevi različiti među timovima, a stabilni nakon osvežavanja stranice.

## Struktura projekta

| Fajl | Namena |
|---|---|
| `index.html`, `game.js` | Igra za timove |
| `questions.js` | Generatori zadataka, parser izraza, nivoi |
| `scoring.js` | Bodovanje, cene i trajanja sabotaža |
| `leaderboard.html`, `leaderboard.js` | Rang-lista za projektor |
| `admin.html`, `admin.js` | Panel administratora |
| `firebase.js` | Firebase konfiguracija i uvozi |
| `firestore.rules` | Bezbednosna pravila baze |
| `style.css`, `sabotage.css` | Izgled |
| `qrcode.min.js` | QR kod za pridruživanje |

## Adrese:

- igra: `/index.html`
- rang-lista: `/leaderboard.html`
- administrator: `/admin.html`

## Ograničenja

Odgovori se proveravaju u pregledaču, što je dovoljno za učionicu, ali ne štiti od igrača koji čitaju izvorni kod stranice. Za takmičenje sa stvarnim ulozima proveru bi trebalo premestiti na server (na primer Cloud Functions).

## Licenca

Videti fajl `LICENSE`.
