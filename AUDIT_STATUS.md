# Auditointikorjausten tila 5.10.2026

Pohja: GitHub main 5eda4a4d0148eb1dfa895639c634a15846eac5db.
Työhaara: audit-finish-2026-10-05. Tuotantoon ei ole julkaistu.

| Havainto | Toteutus ja tarkistus |
|---|---|
| IV-01 | Kirjautumislinkin käsittely sidottu tällä laitteella aloitettuun rekisteröitymiseen ja palvelimelta varmennettuun sähköpostiin. Testattu. |
| IV-02 | Service worker ohittaa eri originin ja Authorization-pyynnöt sekä virhesivujen tallennuksen. Testattu. |
| IV-03 | Tuotujen tunnusten käyttö suorissa koodikäsittelijöissä poistettu, esc käsittelee myös heittomerkin. Haitallinen tuonti testattu. |
| IV-04 | Tavallinen palautuspiste enintään 15 minuutin välein, karsinta toistuvissa rajatuissa erissä. Testattu sovelluksessa. Palvelimen karsintaa ei ole asennettu. |
| IV-05 | Kaikissa varmuuskopioiden hauissa ja poistossa käyttäjäsuodatin. Testattu sovelluksessa. RLS- ja Storage-sääntöjen tuotantotarkistus avoin. |
| IV-06 | Uudempi tai viimeksi nähtyä eri pilvikopio pysäyttää synkronoinnin. Erillinen vahvistettu ylikirjoitus arkistoi etäkopion ensin. Testattu. Tarkistus on asiakaspuolen tarkistus, ei atominen palvelinlukitus. |
| IV-07 | Nykyisen työn tallennus ennen projektinvaihtoa/tuontia/uutta projektia; tallennusvirhe pysäyttää vaihdon. Testattu. |
| IV-08 | Tuonnin korvaus tunnisteen ja vahvistuksen perusteella, ei pelkällä osoitteella. Testattu. |
| IV-09 | Verkkovirhe ei poista istuntoa, palvelimen hylkäämä uusimistunnus poistaa. Testattu. |
| IV-10 | Oletuspäivä Europe/Helsinki-ajassa. Kesä- ja talviajan testit läpäisevät. |
| IV-11 | Tuodun kuvan omistajuus ja tallennuspolku tarkistetaan. Testattu. |
| IV-12 | Poistot jonotetaan pysyvästi ja suoritetaan vasta nykyisten, tallennettujen, pilvikopion ja kaikkien haettujen palautuspisteiden viittausten tarkistuksen jälkeen. Virhe/offline säilyttää kuvan. Rajat ylittävä historia keskeyttää siivouksen. Poistojen, tuonnin ylikirjoituksen ja projektirajan aiheuttamat ehdokkaat kerätään. Testattu. Vanhoja kokonaan jäljettömiä Storage-orpoja ei inventoida. |
| IV-13 | Kaikki PDF-kuvat kulkevat canvas/JPEG-muunnoksen kautta. Virhe käyttäjälle. Muunnospolku testattu korvaavilla Image/canvas-toteutuksilla; todellinen selaindekoodaus avoin. Chromium-asennus epäonnistui tyhjään lataukseen. |
| IV-14 | Käyttäjä vahvisti arvot venttiilikohtaisiksi. Summa adjusted × Kpl, puuttuva/virheellinen Kpl käyttää vanhaa yhden oletusta. Kenttä- ja PDF-teksti selventää merkityksen. Testattu; esimerkki Kpl 2 × 10 l/s = 20 l/s. PDF renderöity ja tarkistettu. |
| IV-15 | Inline-eventit korvattu inerttien toimintojen sallittuun listaan perustuvalla tapahtumadelegaatiolla ilman evalia. CSP sallii vain sovellusskriptin SHA-256-tiivisteen; logolähteet escapataan, kuvapolut validoidaan, kuollut togglePressureSign poistettu, Tila-muutos ryhmitellään change-tapahtumassa. Testattu. Vanhentunut zip poistettu tästä työhaarasta. Tokenien localStorage-käytäntö säilyy. EU-alue ja muiden käyttäjien tietosuojaseloste on tarkistettava käyttöönoton laajentuessa. |

20 testitiedostoa läpäisivät 5.10.2026. Tulokset tests/audit/results-2026-10-05.json.
Ajo: npm install; npm test. Testit ovat eristettyjä eivätkä käytä tuotantotietoja.

Julkaisun ehdot: tarkista supabase/audit-readonly.sql:n tulos, tee tarvittavat palvelinkorjaukset, aja todellinen selaimen kuva-/CSP-/IndexedDB-testi. Julkaise vasta niiden jälkeen. Välimuistiversio v51 on varattu tähän julkaisuun.

CSP-tiiviste on päivitettävä index.html:n sovellusskriptin jokaisen muutoksen yhteydessä. test-ui-hardening.js tarkistaa tämän.

## Käyttäjän toimittama tuotantotarkistus 5.10.2026

app_backups-, app_backup_versions- ja storage.objects-tauluissa RLS on päällä. Toimitetuissa säännöissä varmuuskopioiden lukeminen, lisääminen, päivittäminen ja versioiden poistaminen rajautuvat auth.uid() = user_id -ehtoon. Kuvien kaikki neljä operaatiota rajautuvat project-photos-bucketiin ja kirjautuneen käyttäjän ylimpään kansioon. Muita Storage-sääntöjä toimitetussa täydellisessä tuloksessa ei ollut. Tarvittavat nykyisen kopion yksilöivä indeksi ja versiohistorian käyttäjä/aikaindeksi ovat olemassa.

Kuitenkin photo_bucket = []: project-photos-id:llä ei löytynyt bucket-riviä tästä kyselystä. Bucketin olemassaolo, yksityisyys ja palveluprojektin vastaavuus ovat vielä avoinna. Tämä tulos ei yksin todista kuvien katoamista. Seuraava tarkistus: SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY name.

## Bucketin nimen tarkennus

Käyttäjän toimittama bucket-inventaario: id/name Project-photos, public=false, file_size_limit=5242880, allowed_mime_types=[image/jpeg]. Tietokannan neljä Storage-sääntöä viittasivat virheellisesti pienen p:n project-photos-id:hen. Sovelluksen PHOTO_BUCKET korjattu olemassa olevaan Project-photos-id:hen, ja neljää ALTER POLICY -komentoa sisältävä transaktio on valmisteltu supabase/migrations/20261005_match_photo_bucket_case.sql-tiedostoon. SQL:n suoritus ja sen tulos odottavat käyttäjää. Bucketia ei nimetä uudelleen eikä kuvia siirretä tai poisteta.

Uusi test-photo-bucket.js testaa latauksen, autentikoidun haun ja turvallisen siivouksen täsmälliset Storage-URL:t. Testi löysi samalla kovennuksen jälkeen kuvapolun .jpg-päätteen sanitointivirheen; tiedostopääte lisätään nyt vasta tunnisteiden sanitoinnin jälkeen. Bucket-, CSP-/UI- ja tuodun kuvan omistajuustestit läpäisivät korjauksen.

## Storage-sääntöjen suorituksen vahvistus

Käyttäjä toimitti kaikkien neljän muutetun säännön tulokset. SELECT/INSERT/UPDATE/DELETE kohdistuvat nyt bucket_id='Project-photos'-id:hen; authenticated-rooli ja oman käyttäjän kansiorajaus säilyvät. Sovellus-/palvelinpuolen bucket-nimiero on korjattu. Varsinaista tuotantokuvan latausta ei tällä tarkistuksella ajettu.

Cloud Browserin kautta yritettiin paikallista testiversiota http://localhost:8765. Yhteys estyi net::ERR_BLOCKED_BY_CLIENT-virheeseen, joten tämäkään reitti ei mahdollistanut oikean selaimen testiä. Rajoitusta ei ohitettu.

## Palvelimen versiohistorian karsinta

Valmisteltu supabase/migrations/20261005_bound_backup_history.sql: SECURITY INVOKER -triggeri säilyttää uuden historiarivin jälkeen käyttäjän 20 uusinta palautuspistettä (created_at DESC NULLS LAST, id DESC). Transaktion käyttäjäkohtainen advisory-lukko rajaa saman käyttäjän karsinnan samanaikaisuutta. Sovelluksen nykyisiä app_backups-rivejä ja Storage-kuvia ei käsitellä tässä SQL:ssä. Aiempi historia ei muutu asennuksen aikana, vaan seuraavan saman käyttäjän historiatallennuksen yhteydessä.

Testattu aidolla PostgreSQL-moottorilla PGlitessa: 30 vanhaa + uusi palautuspiste → uusimmat 20; saman aikaleiman deterministinen järjestys; authenticated-roolin RLS-rajaus säilyy; väärän käyttäjän INSERT torjutaan; toisen käyttäjän 30 palautuspistettä säilyy; app_backups-sentineli säilyy; ROLLBACK palauttaa historian; migraatio voidaan ajaa uudelleen. Testi tests/database-history.cjs, ajo npm run test:database. Monen erillisen yhteyden kuormitustestiä ei ajettu. Supabasen tuotantoasennus odottaa käyttäjää.

## Oikean selaimen tarkistus

Paikallinen eristetty Chromium-testi läpäisi 5.10.2026: mobiilin delegoidut painikkeet ja syötteet, Kpl 2 × 10 l/s = 20 l/s, tulo/poisto-vaihto säilyttää kortin auki, PNG-/harmaasävy-/CMYK-kuvien natiivi dekoodaus ja RGB-JPEG-muunnos, virheellisen kuvan torjunta, projektin tuonti ja IndexedDB-kuvien säilyminen sivun uudelleenlatauksessa, PDF:n luonti ja lataus. JavaScript- tai CSP-virheitä ei havaittu. Supabase-kutsut estettiin; tuotantotietoja ei käytetty.

Kolmisivuinen ladattu PDF tarkastettiin Popplerilla: kolme testikuvaa ovat RGB JPEG -kuvia ja venttiilien summa on 20 l/s. Kuvasivu renderöitiin ja tarkastettiin visuaalisesti. Testi tests/native-browser.cjs, fixturet tests/browser-fixtures; vaatii Playwrightin ja Chromiumin (valinnainen CHROMIUM_EXECUTABLE_PATH). Cloud Browserin paikallisosoiterajoitus säilyi; testi tehtiin erillisellä kehitystestiselaimella.

Jäljellä ennen julkaisua: käyttäjä asentaa palvelimen historiamigraation ja toimittaa triggerin tarkistustuloksen.

## Tuotantomigraation vahvistus

Käyttäjän toimittama tarkistustulos 5.10.2026: iv_prune_backup_history AFTER INSERT ON public.app_backup_versions FOR EACH ROW EXECUTE FUNCTION iv_prune_backup_history(). Palvelinpuolen historian karsinta on asennettu. Kaikki 20 sovellustestitiedostoa läpäisivät viimeisen yhteisajon, ja natiivi Chromium-/PDF-testi läpäisi. Julkaisu GitHub main -haaraan on nyt käyttäjän aiemman ohjeen mukaisesti valmis.

## Synkronoinnin jatkokorjaus

Oman tallennuksen aikaleima tallennettiin Z-muodossa, mutta palvelin palauttaa saman ajan +00:00-muodossa. Tekstivertailu aiheutti väärän ristiriidan seuraavan kuvamerkinnän tallennuksessa. Korjattu kelvollisten kellonaikojen vertailuksi; käynnistys käyttää samaa ristiriitatarkistusta. Testi toistaa virheen ennen korjausta ja kattaa uuden kuvaviittauksen, uudelleenalustuksen sekä aidon ulkoisen muutoksen torjunnan. Kaikki 20 sovellustestiä ja natiivi Chromium-/PDF-testi läpäisivät. CSP-tiiviste ja välimuistiversio v52 päivitetty.

Palvelimen historiatriggeriin liittyvä aikakatkaisu on edelleen tutkittava. Käyttäjälle annettiin triggerin poistaminen käytöstä, ja tämän jälkeen toimitettu kuva näytti onnistuneen synkronoinnin. Sovelluksen oma rajattu historian karsinta säilyy.

## Korvaava pilviprojekti – käyttöönottovalmistelu

Vanhan projektin historiassa oli 530 palautuspistettä ja taulun koko 1160 MB. Käyttäjän hyväksymä siivous poisti 410 vanhaa palautuspistettä, minkä jälkeen levy täyttyi ja tietokantayhteydet estyivät. Nykyisen pilvikopion tauluun tai Storage-kuviin ei kohdistettu muutoksia; lopputarkistus ei ollut mahdollinen. Vanhaa projektia ei poisteta.

Uusi projekti Iv-mittaus-uusi (quuanwefzmsyjetltmzr, eu-north-1) on luotu ja secure_bounded_backup_history-migraatio asennettu. Tarkistettu RLS, yksityinen JPEG-kuvakansio, 2 MB:n JSON-sisältöraja, saman lähdeaikaleiman deduplikointi ja käyttäjäkohtainen 20 palautuspisteen raja. Turvallisuusneuvoja: ei havaintoja. Sovelluksen valmisteltu yhteys käyttää uuden projektin julkista publishable-avainta ja välimuistia v53.

JSON-vertailu normalisoi avainten järjestyksen ja ohittaa pelkän ylimmän localUpdatedAt-muutoksen. Siivousvirhe näytetään ja onnistumisaika kirjataan vasta onnistuneesta siivouksesta. Paikallisesti saatavilla olevat vanhan omistajan kuvat ladataan uudelleen uudelle omistajalle; puuttuvia vanhoja kuvaviitteitä sisältävä pilvitallennus estetään eikä viitteitä poisteta.

Testattu 22 sovellustiedostoa, uuden skeeman paikallinen Postgres-testi (20/100, deduplikointi, kokoraja, RLS, Storage-omistajuus) ja natiivi Chromium-/PDF-testi. Käyttäjän nykyisen projektin varmuuskopio sisältää kaikki neljä kuvaa. Käyttöönotto odottaa uuden käyttäjätilin luontia ja oikean käyttäjän pilvitallennus-/kuvatestiä. Muutoksia ei vielä julkaista main-haaraan; muiden vanhojen projektien kuvien saatavuus on selvitettävä ennen yhteyden vaihtoa.
