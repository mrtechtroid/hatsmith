<p align="center">
  <a href="#" rel="noopener">
 <img src="/public/assets/images/logo_new.png" width="180"></a>
</p>

<a href="https://hatsmith-topaz.vercel.app" style="color:#000"><h3 align="center">Hatsmith</h3></a>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#)
<!-- [![CodeQL](https://github.com/sh-dv/hat.sh/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/sh-dv/hat.sh/actions/workflows/codeql-analysis.yml)
[![Node.js CI](https://github.com/sh-dv/hat.sh/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/sh-dv/hat.sh/actions/workflows/node.js.yml)
[![Snyk](https://github.com/sh-dv/hat.sh/actions/workflows/snyk.yml/badge.svg)](https://github.com/sh-dv/hat.sh/actions/workflows/snyk.yml) -->

</div>

---

[Hatsmith](https://hatsmith-topaz.vercel.app) is a web app that provides secure local file encryption in the browser. It's fast, secure, and uses modern cryptographic algorithms with chunked AEAD stream encryption/decryption.

Hatsmith is a fork of [Hat.sh](https://github.com/sh-dv/hat.sh), created by sh-dv, and other contributors. Hatsmith will be a drop-in replacement for Hat.sh, with the same features and security guarantees, and will keep the same versioning scheme.

## Usage

![how-to-use-gif](https://i.imgur.com/NbAZOgP.gif)

<br>

## Features

### Security

- XChaCha20-Poly1305 - for symmetric encryption.
- Argon2id - for password-based key derivation.
- X25519 - for key exchange.

The libsodium library is used for all cryptographic algorithms.

### Privacy

- The app runs locally in your browser.
- No data is ever collected or sent to anyone.​

### Functionality

- Secure multiple file encryption/decryption with passwords or keys.
- Secure random password generation.
- Asymmetric key pair generation.
- Authenticated key exchange.
- Password strength estimation.

<br>

## Offline Use

The app can be easily self hosted, please follow the [installation](https://hatsmith-topaz.vercel.app/about/#installation) instructions.

<br>

## Browser Compatibility

We officially support the last two versions of every major browser. Specifically, we test on the following

- **Chrome** on Windows, macOS, and Linux , Android
- **Firefox** on Windows, macOS, and Linux
- **Safari** on iOS and macOS
- **Edge** on Windows

Safari and Mobile browsers are limited to single 1GB files, due to lack of support with server-worker fetch api.

<br>

## Official running instances of the app

| #   | URL                                       |
| --- | ----------------------------------------- |
| 1   | [hatsmith-topaz.vercel.app](https://hatsmith-topaz.vercel.app)                 |    |
| 2   | [hatsmith.megalol.nl.eu.org](https://hatsmith.megalol.nl.eu.org/) |

<br>

## Donations

I'm not accepting donations at this time.
If you want to donate, please consider donating to the original project, [Hat.sh](https://github.com/sh-dv/hat.sh).


## Acknowledgements and Credits

- Everyone who supported the project.
- [Samuel-lucas6](https://github.com/samuel-lucas6) from the [Kryptor](https://github.com/samuel-lucas6/Kryptor) project for being helpful and doing a lot of beta testing.
- [stophecom](https://github.com/stophecom) from the [Scrt.link](https://scrt.link/) project for translating to German.
- [bbouille](https://github.com/bbouille) for translating to French.
- [qaqland](https://github.com/qaqland) for translating to Chinese.
- [Ser-Bul](https://github.com/Ser-Bul) for translating to Russian.
- [matteotardito](https://github.com/matteotardito) for translating to Italian.
- [t0mzSK](https://github.com/t0mzSK) for translating to Slovak.
- [Xurdejl](https://github.com/Xurdejl) for translating to Spanish.
- [Franatrtur](https://github.com/Franatrtur) for translating to Czech.
- [darkao](https://github.com/darkao) for translating to Turkish.
- [Frank7sun](https://github.com/Frank7sun) for translating to Japanese.

<br>

## License
This project is licensed under [MIT License](/LICENSE).   
Copyright (c) 2025 mrtechtroid  
Copyright (c) 2022 sh-dv
