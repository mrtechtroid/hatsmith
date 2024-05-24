# [Introducere](#introducere)

---

Hat.sh este o aplicație web gratuită [opensource] care oferă criptare sigură a fișierelor în browser.

<br>

# [Caracteristici](#caracteristici)

---

### Securitate

- [XChaCha20-Poly1305] - pentru criptare simetrică.
- [Argon2id] - pentru derivarea cheii bazate pe parolă.
- [X25519] - pentru schimbul de chei.

Biblioteca libsodium este folosită pentru toți algoritmii criptografici. [Detalii tehnice aici](#detalii-tehnice).

<br>

### Confidențialitate

- Aplicația rulează local în browserul tău.
- Niciun fel de date nu sunt colectate sau trimise către nimeni.​

<br>

### Funcționalitate

- Criptare/decriptare sigură a fișierelor cu parole sau chei.
- Generare sigură a parolelor aleatorii.
- Generare perechi de chei asimetrice.
- Schimb de chei autentificate.
- Estimarea puterii parolei.

<br>

# [Instalare](#instalare)

---
Este ușor să găzduiești și să implementezi hat.sh, poți face asta fie cu npm, fie cu docker.

Dacă dorești să găzduiești aplicația, te rugăm să urmezi aceste instrucțiuni:

<br>

## Cu npm

Înainte de instalare, asigură-te că rulezi [nodejs](https://nodejs.org/en/) și ai [npm](https://www.npmjs.com/) instalat.

<br >

1. clonează repo-ul de pe github

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. mută-te în folder

```bash
cd hat.sh
```

3. instalează dependențele

```bash
npm install
```

4. construiește aplicația

```bash
npm run build
```

5. pornește hat.sh

```bash
npm run start
```

aplicația ar trebui să ruleze pe portul 3391.
<br>

dacă dorești să rulezi aplicația în mediul de dezvoltare, rulează:

<br>

```bash
npm run dev
```

<br>

## Cu docker

Poți instala aplicația cu docker în mai multe moduri. Ești liber să alegi metoda preferată.

<br>

- #### instalează de pe docker hub

1. descarcă imaginea de pe docker hub

```bash
docker pull shdv/hat.sh:latest
```

2. rulează containerul

```bash
docker run -d -p 3991:80 shdv/hat.sh
```

<br>

- #### Construiește o imagine din codul sursă

1. clonează repo-ul de pe github

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. mută-te în folder

```bash
cd hat.sh
```

3. construiește imaginea folosind docker

```bash
docker build . -t shdv/hat.sh
```

4. rulează containerul

```bash
docker run -d -p 3991:80 shdv/hat.sh
```

<br>

- #### Folosind docker compose

1. clonează repo-ul de pe github

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. mută-te în folder

```bash
cd hat.sh
```

3. construiește imaginea folosind docker compose

```bash
docker compose build
```

4. rulează containerul

```bash
docker compose up
```

<br>

Aplicația ar trebui să ruleze pe portul 3991.

hat.sh este disponibil și ca imagine Docker. Poți găsi pe [Docker Hub].

<br>

# [Utilizare](#utilizare)

---

## Criptarea Fișierelor

- ### folosind o parolă

1. Deschide hat.sh.
2. Navighează la panoul de Criptare.
3. Trage și Plasează sau Selectează fișierele pe care dorești să le criptezi.
4. Introdu o parolă sau generează una.
5. Descarcă fișierul criptat.

> Ar trebui să folosești întotdeauna o parolă puternică!

- ### folosind chei publice și private

1. Deschide hat.sh.
2. Navighează la panoul de Criptare.
3. Trage și Plasează sau Selectează fișierele pe care dorești să le criptezi.
4. Alege metoda cheie publică.
5. Introdu sau încarcă cheia publică a destinatarului și cheia ta privată.
   dacă nu ai chei publice și private, poți genera o pereche de chei.
6. Descarcă fișierul criptat.
7. Partajează cheia ta publică cu destinatarul pentru ca acesta să poată decripta fișierul.

> Nu împărtăși niciodată cheia ta privată cu nimeni! Doar cheile publice ar trebui schimbate.

<br>

## Decriptarea Fișierelor

- ### folosind o parolă

1. Deschide hat.sh.
2. Navighează la panoul de Decriptare.
3. Trage și Plasează sau Selectează fișierele pe care dorești să le decriptezi.
4. Introdu parola de criptare.
5. Descarcă fișierul decriptat.

- ### folosind chei publice și private

1. Deschide hat.sh.
2. Navighează la panoul de Decriptare.
3. Trage și Plasează sau Selectează fișierele pe care dorești să le decriptezi.
4. Introdu sau încarcă cheia publică a expeditorului și cheia ta privată.
5. Descarcă fișierul decriptat.

<br>

# [Limitări](#limitări)

---

### Semnătura Fișierului

Fișierele criptate cu hat.sh sunt identificabile prin semnătura fișierului folosită de aplicație pentru a verifica conținutul unui fișier, astfel de semnături sunt cunoscute și ca numere magice sau Magic Bytes. Acesti Bytes sunt autentificate și nu pot fi schimbate.

### Browsere Safari și Mobile

Browserele Safari și cele pentru telefoanele mobile sunt limitate la un singur fișier cu dimensiunea maximă de 1GB din cauza unor probleme legate de service-workers. În plus, această limitare se aplică și atunci când aplicația nu reușește să înregistreze service-worker-ul (de exemplu, FireFox Private Browsing).

<br>

# [Cele mai bune practici](#cele-mai-bune-practici)

---

### Alegerea Parolelor

Majoritatea indivizilor se confruntă cu dificultăți în a crea și a memora parole, rezultând în parole slabe și reutilizarea parolelor. Criptarea bazată pe parolă este considerabil mai puțin sigură din cauza acestor practici necorespunzătoare. De aceea este recomandat să folosești generatorul de parole încorporat și să folosești un manager de parole precum [Bitwarden], unde poți stoca parola sigură.

Dacă dorești să alegi o parolă pe care să o poți memora, ar trebui să tastezi o frază din 8 cuvinte sau mai mult.

<br>

### Folosirea criptării cu chei publice în loc de parolă

Dacă criptezi un fișier pe care intenționezi să îl partajezi cu altcineva, atunci ar trebui să îl criptezi cu cheia publică a destinatarului și cheia ta privată.

<br>

### Partajarea Fișierelor Criptate

Dacă intenționezi să trimiți cuiva un fișier criptat, se recomandă să folosești cheia ta privată și cheia publică a destinatarului pentru a cripta fișierul.

Fișierul poate fi partajat în orice aplicație de partajare a fișierelor sigură.

<br>

### Partajarea cheii publice

Cheile publice pot fi partajate, ele pot fi trimise ca fișier `.public` sau ca text.

> Nu împărtăși niciodată cheia ta privată cu nimeni! Doar cheile publice ar trebui schimbate.

<br>

### Stocarea Cheilor Publice și Private

Asigură-te că stochezi cheile tale de criptare într-un loc sigur și fă un backup pe un mediu de stocare extern.

Stocarea cheii private în cloud nu este recomandată!

<br>

### Partajarea Parolelor de Decriptare

Partajarea parolei de decriptare poate fi făcută folosind o aplicație de mesagerie criptată end-to-end sigură. Se recomandă utilizarea unei funcții de _Mesaje care dispar_ și ștergerea parolei după ce destinatarul a decriptat fișierul

.

> Nu alege niciodată aceeași parolă pentru fișiere diferite.

<br>

# [Întrebări frecvente](#întrebări-frecvente)

---

### Aplicația înregistrează sau stochează datele mele?

Nu, hat.sh nu stochează niciodată datele tale. Rulează doar local în browserul tău.

<hr style="height: 1px">

### Hat.sh este gratuit?

Da, Hat.sh este gratuit și va fi întotdeauna. Cu toate acestea, te rugăm să iei în considerare [donarea](https://github.com/sh-dv/hat.sh#donations) pentru a sprijini proiectul.

<hr style="height: 1px">

### Ce tipuri de fișiere sunt acceptate? Există o limită de dimensiune a fișierelor?

Hat.sh acceptă toate tipurile de fișiere. Nu există o limită de dimensiune a fișierelor, ceea ce înseamnă că fișiere de orice dimensiune pot fi criptate.

Browserul Safari și browserele mobile/smartphone sunt limitate la 1GB.

<hr style="height: 1px">

### Am uitat parola, pot totuși să decriptez fișierele mele?

Nu, nu știm parola ta. Asigură-te întotdeauna că îți stochezi parolele într-un manager de parole.

<hr style="height: 1px">

### De ce văd un mesaj care spune "Ai o experiență limitată (fișier unic, 1GB)"?

Înseamnă că browserul tău nu suportă server-worker fetch api. Prin urmare, ești limitat la fișiere de dimensiuni mici. vezi [Limitări](#limitări) pentru mai multe informații.

<hr style="height: 1px" id="de-ce-am-nevoie-de-cheia-privată">

### Este sigur să îmi partajez cheia publică?

Da. Cheile publice pot fi partajate, ele pot fi trimise ca fișier `.public` sau ca text.

Dar asigură-te că nu împărtășești niciodată cheia ta privată cu nimeni!

<hr style="height: 1px">

### De ce aplicația cere cheia mea privată în modul de criptare cu cheie publică?

Hat.sh folosește criptare autentificată. Expeditorul trebuie să furnizeze cheia sa privată, o nouă cheie partajată va fi calculată din ambele chei pentru a cripta fișierul. Destinatarul trebuie să furnizeze cheia sa privată atunci când decriptează. În acest fel, se poate verifica că fișierul criptat nu a fost modificat și a fost trimis de la expeditorul real.

<hr style="height: 1px">

### Mi-am pierdut cheia privată, este posibil să o recuperez?

Nu. Cheile private pierdute nu pot fi recuperate.

De asemenea, dacă simți că cheia ta privată a fost compromisă (de exemplu, împărtășită accidental / computerul a fost hack-uit), atunci trebuie să decriptezi toate fișierele care au fost criptate cu acea cheie, să generezi o nouă pereche de chei și să recriptezi fișierele.

<hr style="height: 1px">

### Cum generează o pereche de chei (Publică și Privată)?

Poți genera chei vizitând [pagina de generare a cheilor](https://hat.sh/generate-keys), asigură-te că [stochezi cheile în siguranță](#cele-mai-bune-practici).

<hr style="height: 1px">

### Aplicația măsoară puterea parolei?

Folosim implementarea JS [zxcvbn](https://github.com/dropbox/zxcvbn) pentru a verifica entropia parolei introduse, această entropie va fi convertită într-un scor care va fi afișat pe ecran.

<hr style="height: 1px">

### Aplicația se conectează la internet?

Odată ce vizitezi site-ul și pagina se încarcă, rulează doar offline.

<hr style="height: 1px">

### Cum pot să contribui?

Hat.sh este o aplicație open-source. Poți ajuta la îmbunătățirea ei făcând commit-uri pe GitHub. Proiectul este întreținut în timpul meu liber. [Donațiile](https://github.com/sh-dv/hat.sh#donations) de orice dimensiune sunt apreciate.

<hr style="height: 1px">

### Cum raportez bug-uri?

Te rog raportează bug-uri prin [Github] deschizând un issue etichetat cu "bug".

<hr style="height: 1px">

### Cum raportez o vulnerabilitate de securitate?

Dacă identifici o problemă de securitate validă, te rog să scrii un email la hatsh-security@pm.me

Nu există nicio recompensă disponibilă în acest moment, dar contul tău de github va fi creditat în secțiunea de recunoașteri din documentația aplicației.

<hr style="height: 1px">

### De ce ar trebui să folosesc hat.sh?

1. Aplicația folosește algoritmi criptografici moderni și siguri.
2. Este super rapidă și ușor de utilizat.
3. Rulează în browser, nu este nevoie să configurezi sau să instalezi nimic.
4. Este un software gratuit open-source și poate fi găzduit cu ușurință.

<hr style="height: 1px">

### Când nu ar trebui să folosesc hat.sh?

1. Dacă dorești să criptezi un disc (de exemplu, [VeraCrypt]).
2. Dacă dorești să accesezi frecvent fișierele criptate (de exemplu, [Cryptomator]).
3. Dacă dorești să criptezi și să semnezi fișiere în același instrument. (de exemplu, [Kryptor]).
4. Dacă preferi un instrument de linie de comandă (de exemplu, [Kryptor]).
5. Dacă dorești ceva care aderă la standardele industriei, folosește [GPG].

<br>

# [Detalii Tehnice](#detalii-tehnice)

---

### Hashing-ul Parolei și Derivarea Cheilor

Funcțiile de hashing ale parolelor derivă o cheie secretă de orice dimensiune dintr-o parolă și un salt.

<br>

<div class="codeBox">

```javascript
let salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
let key = sodium.crypto_pwhash(
  sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
  password,
  salt,
  sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
  sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
  sodium.crypto_pwhash_ALG_ARGON2ID13
);
```

</div>

Funcția `crypto_pwhash()` derivă o cheie lungă de 256 biți dintr-o parolă și un salt a cărui lungime fixă este de 128 biți, care ar trebui să fie impredictibil.

`randombytes_buf()` este cea mai simplă modalitate de a umple cei 128 biți ai saltului.

<br>

`OPSLIMIT` reprezintă o cantitate maximă de calcule de efectuat.

`MEMLIMIT` este cantitatea maximă de RAM pe care funcția o va folosi, în octeți.

<br>

`crypto_pwhash_OPSLIMIT_INTERACTIVE` și `crypto_pwhash_MEMLIMIT_INTERACTIVE` furnizează linia de bază pentru acești doi parametri. Acest lucru necesită în prezent 64 MiB de RAM dedicată. ceea ce este potrivit pentru operațiunile din browser.
<br>
`crypto_pwhash_ALG_ARGON2ID13` folosește algoritmul Argon2id versiunea 1.3.

<br>

### Criptarea Fișierelor (stream)

Pentru a folosi aplicația pentru a cripta un fișier, utilizatorul trebuie să furnizeze un fișier valid și o parolă. această parolă este hash-uită și o cheie sigură este derivată din ea cu Argon2id pentru a cripta fișierul.

<br>

<div class="codeBox">

```javascript
let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
header = res.header;
state = res.state;

let tag = last
  ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
  : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
  state,
  new Uint8Array(chunk),
  null,
  tag
);

stream.enqueue(signature, salt, header, encryptedChunk);
```

</div>

Funcția `crypto_secretstream_xchacha20poly1305_init_push` creează un flux criptat unde inițializează un `state` folosind cheia și un vector de inițializare intern, generat automat. Apoi stochează antetul fluxului în `

header` care are o dimensiune de 192 biți.

Aceasta este prima funcție de apelat pentru a crea un flux criptat. Cheia nu va mai fi necesară pentru operațiunile ulterioare.

<br>

Un flux criptat începe cu un antet scurt, a cărui dimensiune este de 192 biți. Acest antet trebuie trimis/stocat înainte de secvența de mesaje criptate, deoarece este necesar pentru decriptarea fluxului. Conținutul antetului nu trebuie să fie secret deoarece decriptarea cu un antet diferit ar eșua.

Un tag este atașat fiecărei mesaje în funcție de valoarea `last`, care indică dacă acesta este ultimul fragment al fișierului sau nu. Acest tag poate fi oricare dintre:

1. `crypto_secretstream_xchacha20poly1305_TAG_MESSAGE`: Acesta nu adaugă nicio informație despre natura mesajului.
2. `crypto_secretstream_xchacha20poly1305_TAG_FINAL`: Acesta indică faptul că mesajul marchează sfârșitul fluxului și șterge cheia secretă utilizată pentru a cripta secvența anterioară.

Funcția `crypto_secretstream_xchacha20poly1305_push()` criptează fragmentul de fișier `chunk` folosind `state` și `tag`, fără informații suplimentare (`null`).
<br>

XChaCha20 stream cipher și Poly1305 MAC authentication sunt folosite pentru criptare.

Funcția `stream.enqueue()` adaugă semnătura hat.sh (magic bytes), salt și antet urmate de fragmentele criptate.

### Decriptarea Fișierelor (stream)

<div class="codeBox">

```javascript
let state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, key);

let result = sodium.crypto_secretstream_xchacha20poly1305_pull(
  state,
  new Uint8Array(chunk)
);

if (result) {
  let decryptedChunk = result.message;
  stream.enqueue(decryptedChunk);

  if (!last) {
    // continuă decriptarea
  }
}
```

</div>

Funcția `crypto_secretstream_xchacha20poly1305_init_pull()` inițializează un state dat un `key` secret și un `header`. Cheia este derivată din parola furnizată în timpul decriptării și antetul decupat din fișier. Cheia nu va mai fi necesară pentru operațiunile ulterioare.

<br>

Funcția `crypto_secretstream_xchacha20poly1305_pull()` verifică faptul că `chunk` conține un ciphertext valid și un tag de autentificare pentru `state` dat.

Această funcție va rămâne într-un buclă, până când un mesaj cu tag-ul `crypto_secretstream_xchacha20poly1305_TAG_FINAL` este găsit.

Dacă cheia de decriptare este incorectă, funcția returnează o eroare.

Dacă ciphertext-ul sau tag-ul de autentificare par a fi invalide, returnează o eroare.

<br>

### Generarea Parolelor Aleatorii

<div class="codeBox">

```javascript
let password = sodium.to_base64(
  sodium.randombytes_buf(16),
  sodium.base64_variants.URLSAFE_NO_PADDING
);
return password;
```

</div>

Funcția `randombytes_buf()` umple 128 biți începând de la buf cu o secvență impredictibilă de octeți.

Funcția `to_base64()` encodează buf ca un șir Base64 fără padding.

<br>

### Generarea și Schimbul Cheilor

<div class="codeBox">

```javascript
const keyPair = sodium.crypto_kx_keypair();
let keys = {
  publicKey: sodium.to_base64(keyPair.publicKey),
  privateKey: sodium.to_base64(keyPair.privateKey),
};
return keys;
```
</div>

Funcția `crypto_kx_keypair()` generează aleatoriu o cheie secretă și o cheie publică corespunzătoare. Cheia publică este pusă în publicKey și cheia secretă în privateKey. ambele de 256 biți.

<br>

<div class="codeBox">

```javascript
let key = sodium.crypto_kx_client_session_keys(
  sodium.crypto_scalarmult_base(privateKey),
  privateKey,
  publicKey
);
```
</div>

Folosind API-ul de schimb de chei, două părți pot calcula în siguranță un set de chei partajate folosind cheia publică a peer-ului și cheia lor secretă.

Funcția `crypto_kx_client_session_keys()` calculează o pereche de chei partajate lungi de 256 biți folosind cheia publică a destinatarului și cheia privată a expeditorului.

Funcția `crypto_scalarmult_base()` este folosită pentru a calcula cheia publică a expeditorului din cheia sa privată.

<br>

### XChaCha20-Poly1305

XChaCha20 este o variantă a ChaCha20 cu un nonce extins, permițând nonce-urilor aleatorii să fie sigure.

XChaCha20 nu necesită tabele de căutare și evită posibilitatea atacurilor de sincronizare.

Intern, XChaCha20 funcționează ca un cifru de bloc utilizat în modul counter. Folosește funcția hash HChaCha20 pentru a deriva o subcheie și un subnonce din cheia originală și nonce-ul extins și un contor de blocuri dedicat de 64 de biți pentru a evita incrementarea nonce-ului după fiecare bloc.

<br>

### V2 vs V1

- trecerea la xchacha20poly1305 pentru criptarea simetrică a fluxului și Argon2id pentru derivarea cheii bazate pe parolă. în loc de AES-256-GCM și PBKDF2.
- utilizarea bibliotecii libsodium pentru toată criptografia în locul WebCryptoApi.
- în această versiune, aplicația nu citește întregul fișier în memorie. în schimb, este împărțit în fragmente de 64MB care sunt procesate unul câte unul.
- deoarece nu folosim procesarea pe server, aplicația înregistrează un URL de descărcare fals (/file) care va fi gestionat de service-worker fetch api.
- dacă toate validările sunt trecute, un nou flux este inițializat. apoi, fragmentele de fișiere sunt transferate de la aplicația principală la
  fișierul service-worker prin mesaje.
- fiecare fragment este criptat/decriptat pe cont propriu și adăugat la flux.
- după ce fiecare fragment este scris pe disc, acesta va fi imediat colectat de gunoi de către browser, acest lucru ducând la nu având niciodată mai mult de câteva fragmente în memorie în același timp.

<br>

[//]: # "linkuri"
[xchacha20-poly1305]: https://libsodium.gitbook.io/doc/secret-key_cryptography/aead/chacha20-poly1305/xchacha20-poly1305_construction
[argon2id]: https://github.com/p-h-c/phc-winner-argon2
[x25519]: https://cr.yp.to/ecdh.html
[opensource]: https://github.com/sh-dv/hat.sh
[bitwarden]: https://bitwarden.com/
[extending the salsa20 nonce paper]: https://cr.yp.to/snuffle/xsalsa-20081128.pdf
[soon]: https://tools.ietf.org/html/draft-irtf-cfrg-xchacha
[github]: https://github.com/sh-dv/hat.sh
[veracrypt]: https://veracrypt.fr
[cryptomator]: https://cryptomator.org
[kryptor]: https://github.com/samuel-lucas6/Kryptor
[gpg]: https://gnupg.org
[docker hub]: https://hub.docker.com/r/shdv/hat.sh