# [Introdução](#introdução)

---

Hat.sh é um aplicativo web gratuito [opensource] que oferece criptografia segura de arquivos no navegador.

<br>

# [Recursos](#recursos)

---

### Segurança

- [XChaCha20-Poly1305] - para criptografia simétrica.
- [Argon2id] - para derivação de chave baseada em senha.
- [X25519] - para troca de chaves.

A biblioteca libsodium é usada para todos os algoritmos criptográficos. [Detalhes técnicos aqui](#detalhes-técnicos).

<br>

### Privacidade

- O aplicativo é executado localmente no seu navegador.
- Nenhum dado é coletado ou enviado para ninguém.

<br>

### Funcionalidade

- Criptografia/Descriptografia segura de arquivos com senhas ou chaves.
- Geração segura de senhas aleatórias.
- Geração de pares de chaves assimétricas.
- Troca de chaves autenticada.
- Estimativa de força da senha.

<br>

# [Instalação](#instalação)

---
É fácil hospedar e implantar o hat.sh por conta própria, você pode fazer isso com npm ou docker.

Se desejar hospedar o aplicativo, siga estas instruções:

<br>

## Com npm

Antes da instalação, certifique-se de que você está executando [nodejs](https://nodejs.org/en/) e tem [npm](https://www.npmjs.com/) instalado.

<br>

1. clone o repositório github

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. vá para a pasta

```bash
cd hat.sh
```

3. instale as dependências

```bash
npm install
```

4. construa o aplicativo

```bash
npm run build
```

5. inicie o hat.sh

```bash
npm run start
```

o aplicativo deve estar rodando na porta 3391.
<br>

se você deseja executar o aplicativo em ambiente de desenvolvimento, execute:

<br>

```bash
npm run dev
```

<br>

## Com docker

Você pode instalar o aplicativo com docker de várias maneiras. Você é livre para escolher o método que preferir.

<br>

- #### instalar a partir do docker hub

1. faça o pull da imagem do docker hub

```bash
docker pull shdv/hat.sh:latest
```

2. execute o container

```bash
docker run -d -p 3991:80 shdv/hat.sh
```

<br>

- #### Construir uma imagem a partir do código fonte

1. clone o repositório do GitHub

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. vá para a pasta

```bash
cd hat.sh
```

3. construa a imagem usando o Docker

```bash
docker build . -t shdv/hat.sh
```

4. execute o contêiner

```bash
docker run -d -p 3991:80 shdv/hat.sh
```

<br>

- #### Usando Docker Compose

1. clone o repositório do GitHub

```bash
git clone https://github.com/sh-dv/hat.sh.git hat.sh
```

2. vá para a pasta

```bash
cd hat.sh
```

3. construa a imagem usando o Docker Compose

```bash
docker compose build
```

4. execute o contêiner

```bash
docker compose up
```

<br>

O aplicativo deve estar rodando na porta 3991.

hat.sh também está disponível como uma imagem Docker. Você pode encontrá-lo no [Docker Hub].

<br>


# [Uso](#uso)

---

## Criptografia de arquivo

- ### usando uma senha

1. Abra hat.sh.
2. Navegue até o painel Criptografia.
3. Arraste e solte ou selecione os arquivos que deseja criptografar.
4. Digite uma senha ou gere uma.
5. Baixe o arquivo criptografado.

> Você deve sempre usar uma senha forte!

- ### usando chaves públicas e privadas

1. Abra hat.sh.
2. Navegue até o painel Criptografia.
3. Arraste e solte ou selecione os arquivos que deseja criptografar.
4. Escolha o método de chave pública.
5. Insira ou carregue a chave pública do destinatário e sua chave privada.
   se você não tiver chaves públicas e privadas, poderá gerar um par de chaves.
6. Baixe o arquivo criptografado.
7. Compartilhe sua chave pública com o destinatário para que ele possa descriptografar o arquivo.

> Nunca compartilhe sua chave privada com ninguém! Apenas chaves públicas devem ser trocadas.

<br>

## Descriptografia de arquivo

- ### usando uma senha

1. Abra hat.sh.
2. Navegue até o painel Descriptografia.
3. Arraste e solte ou selecione os arquivos que deseja descriptografar.
4. Digite a senha de criptografia.
5. Baixe o arquivo descriptografado.

- ### usando chaves públicas e privadas

1. Abra hat.sh.
2. Navegue até o painel Descriptografia.
3. Arraste e solte ou selecione os arquivos que deseja descriptografar.
4. Insira ou carregue a chave pública do remetente e sua chave privada.
5. Baixe o arquivo descriptografado.

<br>

# [Limitações](#limitacoes)

---

### Assinatura do arquivo

Os arquivos criptografados com hat.sh são identificáveis ​​observando a assinatura do arquivo usada pelo aplicativo para verificar o conteúdo de um arquivo. Essas assinaturas também são conhecidas como números mágicos ou Bytes Mágicos. Esses bytes são autenticados e não podem ser alterados.

### Safari e navegadores móveis

Os navegadores Safari e Mobile estão limitados a um único arquivo com tamanho máximo de 1 GB devido a alguns problemas relacionados aos service workers. Além disso, esta limitação também se aplica quando o aplicativo não consegue registrar o service-worker (por exemplo, FireFox Private Browsing).

<br>

# [Melhores práticas](#melhorespraticas)

---

### Escolhendo senhas

A maioria das pessoas tem dificuldade para criar e lembrar senhas, resultando em senhas fracas e na reutilização de senhas. A criptografia baseada em senha é substancialmente menos segura como resultado dessas práticas inadequadas. É por isso que é recomendado usar o gerador de senhas integrado e um gerenciador de senhas como o [Bitwarden], onde você pode armazenar a senha segura.


Se quiser escolher uma senha que possa memorizar, você deve digitar uma senha composta de 8 palavras ou mais.

<br>

### Usando criptografia de chave pública em vez de uma senha

Se você estiver criptografando um arquivo que irá compartilhá-lo com outra pessoa, provavelmente deverá criptografá-lo com a chave pública do destinatário e sua chave privada.

<br>

### Compartilhando arquivos criptografados

Se você planeja enviar um arquivo criptografado para alguém, é recomendável usar sua chave privada e sua chave pública para criptografar o arquivo.

O arquivo pode ser compartilhado em qualquer aplicativo seguro de compartilhamento de arquivos.

<br>

### Compartilhando a chave pública

As chaves públicas podem ser compartilhadas, elas podem ser enviadas como arquivo `.public` ou como texto.

> Nunca compartilhe sua chave privada com ninguém! Apenas chaves públicas devem ser trocadas.

<br>

### Armazenando as chaves públicas e privadas

Certifique-se de armazenar suas chaves de criptografia em um local seguro e fazer um backup em um armazenamento externo.

Armazenar sua chave privada no armazenamento em nuvem não é recomendado!

<br>

### Compartilhando senhas de descriptografia

O compartilhamento da senha de descriptografia pode ser feito usando um aplicativo seguro de mensagens criptografadas de ponta a ponta. É recomendado usar o recurso _Mensagens que desaparecem_ e excluir a senha depois que o destinatário descriptografar o arquivo.

> Nunca escolha a mesma senha para arquivos diferentes.

<br>

# [Perguntas frequentes](#faqs)

---

### O aplicativo registra ou armazena algum dos meus dados?

Não, hat.sh nunca armazena nenhum dos seus dados. Ele só é executado localmente no seu navegador.

<hr style="altura: 1px">

### O hat.sh é gratuito?

Sim, Hat.sh é gratuito e sempre será. No entanto, considere [doar](https://github.com/sh-dv/hat.sh#donations) para apoiar o projeto.

<hr style="altura: 1px">

### Quais tipos de arquivo são suportados? Existe um limite de tamanho de arquivo?

Hat.sh aceita todos os tipos de arquivo. Não há limite de tamanho de arquivo, o que significa que arquivos de qualquer tamanho podem ser criptografados.

O navegador Safari e os navegadores de celulares/smartphones são limitados a 1 GB.

<hr style="altura: 1px">

### Esqueci minha senha, ainda posso descriptografar meus arquivos?

Não, não sabemos sua senha. Sempre certifique-se de armazenar suas senhas em um gerenciador de senhas.

<hr style="altura: 1px">

### Por que estou vendo um aviso que diz "Você tem experiência limitada (arquivo único, 1 GB)"?

Isso significa que seu navegador não suporta a API de busca do server-worker. Portanto, você está limitado a arquivos de tamanho pequeno. consulte [Limitações](#limitações) para obter mais informações.

<hr style="height: 1px" id="why-need-private-key">

### É seguro compartilhar minha chave pública?

Sim. As chaves públicas podem ser compartilhadas, elas podem ser enviadas como arquivo `.public` ou como texto.

Mas certifique-se de nunca compartilhar sua chave privada com ninguém!

<hr style="altura: 1px">

### Por que o aplicativo pede minha chave privada no modo de criptografia de chave pública?

Hat.sh usa criptografia autenticada. O remetente deve fornecer sua chave privada, uma nova chave compartilhada será calculada a partir de ambas as chaves para criptografar o arquivo. O destinatário também deve fornecer sua chave privada ao descriptografar. desta forma pode verificar se o arquivo criptografado não foi adulterado e foi enviado pelo verdadeiro remetente.

<hr style="altura: 1px">

### Perdi minha chave privada, é possível recuperá-la?

Não. chaves privadas perdidas não podem ser recuperadas.

Além disso, se você achar que sua chave privada foi comprometida (por exemplo, compartilhada acidentalmente/hackeada por computador), você deverá descriptografar todos os arquivos que foram criptografados com essa chave, gerar um novo par de chaves e criptografar novamente os arquivos.

<hr style="altura: 1px">

### Como faço para gerar um par de chaves (pública e privada)?

Você pode gerar chaves visitando a [página de geração de chaves](https://hat.sh/generate-keys). Certifique-se de [armazenar as chaves com segurança](#best-practices).

<hr style="altura: 1px">

### O aplicativo mede a força da senha?

Usamos a implementação JS [zxcvbn](https://github.com/dropbox/zxcvbn) para verificar a entropia da entrada da senha, esta entropia será convertida em pontuação que será exibida na tela.

<hr style="height: 1px">

### O aplicativo se conecta à internet?

Depois que você visita o site e a página é carregada, ela funciona apenas offline.

<hr style="altura: 1px">

### Como posso contribuir?

Hat.sh é um aplicativo de código aberto. Você pode ajudar a melhorar fazendo commits no GitHub. O projeto é mantido no meu tempo livre. [Doações](https://github.com/sh-dv/hat.sh#donations) de qualquer tamanho são bem-vindas.

<hr style="altura: 1px">

### Como reportar bugs?

Por favor, relate bugs via [Github] abrindo um problema rotulado como "bug".

<hr style="altura: 1px">

### Como posso relatar uma vulnerabilidade de segurança?

Se você identificar um problema de segurança válido, escreva um e-mail para hatsh-security@pm.me

Não há recompensa disponível no momento, mas sua conta do github será creditada na seção de agradecimentos na documentação do aplicativo.

<hr style="altura: 1px">

### Por que devo usar hat.sh?

1. O aplicativo usa algoritmos criptográficos seguros e rápidos.
2. É super rápido e fácil de usar.
3. Ele roda no navegador, sem necessidade de configurar ou instalar nada.
4. É um software de código aberto gratuito e pode ser facilmente auto-hospedado.

<hr style="altura: 1px">

### Quando não devo usar hat.sh?

1. Se você deseja criptografar um disco (por exemplo, [VeraCrypt]).
2. Se você deseja acessar arquivos criptografados com frequência (por exemplo, [Cryptomator]).
3. Se você deseja criptografar e assinar arquivos na mesma ferramenta. (por exemplo, [Kryptor]).
4. Se você preferir uma ferramenta de linha de comando (por exemplo, [Kryptor]).
5. Se você deseja algo que atenda aos padrões da indústria, use [GPG].

<br>

# [Detalhes Técnicos](#detalhestecnicos)

---

### Hash de senha e derivação de chave

As funções de hash de senha derivam uma chave secreta de qualquer tamanho de uma senha e de um salt.

<br>

<div class="codeBox">

```bash

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

A função `crypto_pwhash()` deriva uma chave de 256 bits de uma senha e um sal cujo comprimento fixo é de 128 bits, o que deve ser imprevisível.

`randombytes_buf()` é a maneira mais fácil de preencher os 128 bits do salt.

<br>

`OPSLIMIT` representa uma quantidade máxima de cálculos a serem executados.

`MEMLIMIT` é a quantidade máxima de RAM que a função utilizará, em bytes.

<br>

`crypto_pwhash_OPSLIMIT_INTERACTIVE` e `crypto_pwhash_MEMLIMIT_INTERACTIVE` fornecem a linha de base para esses dois parâmetros. Atualmente, isso requer 64 MiB de RAM dedicada. que é adequado para operações no navegador.
<br>
`crypto_pwhash_ALG_ARGON2ID13` usando o algoritmo Argon2id versão 1.3.

<br>

### Criptografia de arquivo (stream)

Para usar o aplicativo para criptografar um arquivo, o usuário deve fornecer um arquivo válido e uma senha. essa senha é criptografada e uma chave segura é derivada dela com Argon2id para criptografar o arquivo.

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

A função `crypto_secretstream_xchacha20poly1305_init_push` cria um fluxo criptografado onde inicializa um `state` usando a chave e um vetor de inicialização interno gerado automaticamente. Em seguida, ele armazena o cabeçalho do fluxo em `header` que tem um tamanho de 192 bits.

Esta é a primeira função a ser chamada para criar um fluxo criptografado. A chave não será mais necessária para operações subsequentes.

<br>

Um fluxo criptografado começa com um cabeçalho curto, cujo tamanho é de 192 bits. Esse cabeçalho deve ser enviado/armazenado antes da sequência de mensagens criptografadas, pois é necessário para descriptografar o fluxo. O conteúdo do cabeçalho não precisa ser secreto porque a descriptografia com um cabeçalho diferente falharia.

Uma tag é anexada a cada mensagem de acordo com o valor `last`, que indica se aquele é o último pedaço do arquivo ou não. Essa tag pode ser qualquer uma das seguintes:

1. `crypto_secretstream_xchacha20poly1305_TAG_MESSAGE`: Isso não adiciona nenhuma informação sobre a natureza da mensagem.
2. `crypto_secretstream_xchacha20poly1305_TAG_FINAL`: Indica que a mensagem marca o fim do stream e apaga a chave secreta usada para criptografar a sequência anterior.

A função `crypto_secretstream_xchacha20poly1305_push()` criptografa o arquivo `chunk` usando o `state` e a `tag`, sem qualquer informação adicional (`null`).
<br>

a autenticação MAC Poly1305 da cifra de fluxo XChaCha20 é usada para criptografia.

A função `stream.enqueue()` adiciona a assinatura hat.sh (bytes mágicos), salt e cabeçalho seguido pelos pedaços criptografados.

### Descriptografia de arquivo (fluxo)

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
    // continue decryption
  }
}
```

</div>

A função `crypto_secretstream_xchacha20poly1305_init_pull()` inicializa um estado dado uma `chave` secreta e um `cabeçalho`. A chave é derivada da senha fornecida durante a descriptografia e do cabeçalho cortado do arquivo. A chave não será mais necessária para operações subsequentes.

<br>

A função `crypto_secretstream_xchacha20poly1305_pull()` verifica se o `chunk` contém um texto cifrado válido e uma tag de autenticação para o `estado` fornecido.

Esta função permanecerá em loop até que uma mensagem com a tag `crypto_secretstream_xchacha20poly1305_TAG_FINAL` seja encontrada.

Se a chave de descriptografia estiver incorreta, a função retornará um erro.

Se o texto cifrado ou a etiqueta de autenticação parecerem inválidos, ele retornará um erro.

<br>

### Geração aleatória de senha

<div class="codeBox">

```javascript
let password = sodium.to_base64(
  sodium.randombytes_buf(16),
  sodium.base64_variants.URLSAFE_NO_PADDING
);
return password;
```

</div>

A função `randombytes_buf()` preenche 128 bits começando em buf com uma sequência imprevisível de bytes.

A função `to_base64()` codifica buf como uma string Base64 sem preenchimento.

<br>

### Geração e troca de chaves

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

A função `crypto_kx_keypair()` gera aleatoriamente uma chave secreta e uma chave pública correspondente. A chave pública é colocada em publicKey e a chave secreta em privateKey. ambos de 256 bits.

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

Usando a API de troca de chaves, duas partes podem calcular com segurança um conjunto de chaves compartilhadas usando a chave pública de seu par e sua própria chave secreta.

A função `crypto_kx_client_session_keys()` calcula um par de chaves compartilhadas de 256 bits usando a chave pública do destinatário, a chave privada do remetente.

A função `crypto_scalarmult_base()` usada para calcular a chave pública do remetente a partir de sua chave privada.

<br>

### XChaCha20-Poly1305

XChaCha20 é uma variante do ChaCha20 com um nonce estendido, permitindo que nonces aleatórios sejam seguros.

XChaCha20 não requer nenhuma tabela de pesquisa e evita a possibilidade de ataques de temporização.

Internamente, o XChaCha20 funciona como uma cifra de bloco usada no modo contador. Ele usa a função hash HChaCha20 para derivar uma subchave e um subnonce da chave original e do nonce estendido, e um contador de bloco dedicado de 64 bits para evitar o incremento do nonce após cada bloco.

<br>

### V2 vs V1

- mudar para xchacha20poly1305 para criptografia de fluxo simétrico e Argon2id para derivação de chave baseada em senha. em vez de AES-256-GCM e PBKDF2.
- usando a biblioteca libsodium para toda criptografia em vez do WebCryptoApi.
- nesta versão o app não lê todo o arquivo na memória. em vez disso, ele é dividido em pedaços de 64 MB que são processados ​​um por um.
- como não estamos usando nenhum processamento do lado do servidor, o aplicativo registra uma URL de download falsa (/file) que será tratada pela API de busca do service-worker.
- se todas as validações forem aprovadas, um novo fluxo será inicializado. então, pedaços de arquivo são transferidos do aplicativo principal para o
 arquivo service-worker por meio de mensagens.
- cada pedaço é criptografado/descriptografado sozinho e adicionado ao fluxo.
- depois que cada pedaço é gravado no disco, ele será imediatamente coletado como lixo pelo navegador, o que faz com que nunca haja mais do que alguns pedaços na memória ao mesmo tempo.
<br>

[//]: # "links"
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
