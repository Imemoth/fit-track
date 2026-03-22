# TODO

Ez a fájl az élő backlog. Ha jön új ötlet, és nem azzal megyünk tovább azonnal, ide kerül a `Hátra van` részbe. Amikor elkészül, átkerül az `Elkészült` részbe.

## Elkészült

- [x] A statikus buildelt repóból forráskódú `React + Vite + TypeScript + PWA` projekt lett.
- [x] Az app shell, routing és mobilos alsó tabos navigáció elkészült.
- [x] A Supabase kliens alapkonfigurációja bekerült a projektbe.
- [x] Az auth/session alapok elkészültek magic link belépéssel.
- [x] A profil- és authállapot bekötése megtörtént a frontend shellbe.
- [x] A súlymodul valós CRUD flow-t kapott.
- [x] Az étkezésmodul valós CRUD flow-t kapott.
- [x] Az edzésmodul bekötése megtörtént valós backend contractra.
- [x] A testméretmodul bekötése megtörtént valós backend contractra.
- [x] A dashboard már valós súly-, étkezés-, edzés- és méretadatokból építkezik.
- [x] A fő felületek nagy része magyarosítva lett.
- [x] A projekt buildje és typecheckje lefut.
- [x] A hosted Supabase séma aktuális migrációi local és remote oldalon szinkronba kerültek.
- [x] A nutrition oldalon kereshető ételkatalógus-választó készült dropdown helyett.
- [x] Az edzés oldalon sablonimport UX és backend template read réteg előkészítése megtörtént.
- [x] A food catalog és workout template seed localban és hostedben is ellenőrizve lett.
- [x] Route-szintű code splitting bekerült a frontendbe.
- [x] A gyakorlatnév mező automatikus ajánlásokat kapott a gyakori, sablonos és korábban használt gyakorlatokból.
- [x] A `TODO.md` a projekt folyamatosan vezetett backlogja lett.
- [x] A light/dark témaváltó alapja bekerült az alkalmazásba.
- [x] A súlyoldalon működő BMI-kijelzés és magasság alapú számolás bekerült.
- [x] A JSON backup export már valódi visszaállításként használható a dashboardról, nem csak hozzáfűző importként.
- [x] A felhasználói export elvált a backup funkciótól: egyfájlos, külön munkalapos Excel-kompatibilis export a táblázatos felhasználáshoz, JSON a biztonsági mentéshez.
- [x] A fő empty-state blokkok kaptak irányt adó, pozitív microcopyt és vizuális háttér-polish-t.

## Hátra van

- [ ] Import/export jobok UI és tényleges workflow bekötése.
- [ ] Üres, hiba- és betöltési állapotok végső finomhangolása minden oldalon.
- [ ] Helyi smoke test teljes lefuttatása bejelentkezéssel és valós adatrögzítéssel.
- [ ] PWA offline viselkedés és cache stratégia további finomítása.
- [ ] Import/export jobok backend-oldali indításának és nyomon követésének teljes workflowja.
- [ ] A számmezők egységes korlátozása legfeljebb 2 tizedesjegyre, vessző és pont támogatásával minden érintett mezőn.
- [ ] Light mode végleges implementálása és light/dark témaváltó teljes UI-polish-sal.
- [ ] A dark mode teljes átállítása token-alapú témázásra hardcodeolt színek nélkül.
- [ ] Dashboard copy sweep és a maradék hibás vagy ékezetlen UI-szövegek javítása.
- [ ] Háttérképes és erősebb vizuális irány beépítése a fő oldalakra.
- [ ] Gyakori vagy kedvenc gyakorlatok külön gyorsválasztó blokkja.
- [ ] Sebességoptimalizálás és mobil UX végső csiszolása.
