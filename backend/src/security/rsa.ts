import { readFileSync } from 'fs';
import { resolve } from 'path';
import { publicEncrypt, privateDecrypt, constants } from 'crypto';

let cachedPublicKey: string | null = null;
let cachedPrivateKey: string | null = null;


// retorna el directorio donde están las claves, por defecto "keys" en el cwd
function getKeysDir(): string {
  const custom = process.env.KEYS_DIR;
  if (custom && custom.trim().length > 0) {
    return resolve(custom);
  }
  return resolve(process.cwd(), 'keys');
}

// Carga y cachea las claves
function loadPublicKey(): string {
  if (cachedPublicKey) return cachedPublicKey;
  const pubPath = resolve(getKeysDir(), 'public.pem');
  try {
    cachedPublicKey = readFileSync(pubPath, 'utf8');
    return cachedPublicKey;
  } catch (err) {
    throw new Error(
      `No se pudo leer la clave pública en ${pubPath}. ` +
      `Verifica que exista 'keys/public.pem'. Error original: ${(err as Error).message}`
    );
  }
}

// carga y cachea las claves privadas
function loadPrivateKey(): string {
  if (cachedPrivateKey) return cachedPrivateKey;
  const privPath = resolve(getKeysDir(), 'private.pem');
  try {
    cachedPrivateKey = readFileSync(privPath, 'utf8');
    return cachedPrivateKey;
  } catch (err) {
    throw new Error(
      `No se pudo leer la clave privada en ${privPath}. ` +
      `Verifica que exista 'keys/private.pem'. Error original: ${(err as Error).message}`
    );
  }
}

//cifra un texto usando la clave pública y devuelve un Base64
export function rsaEncrypt(plain: string): string {
  const pub = loadPublicKey();
  const buf = Buffer.from(plain, 'utf8');
  const encrypted = publicEncrypt(
    {
      key: pub,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buf
  );
  return encrypted.toString('base64');
}

// descifra un texto cifrado en Base64 usando la clave privada
export function rsaDecrypt(base64Cipher: string): string {
  const priv = loadPrivateKey();
  const buf = Buffer.from(base64Cipher, 'base64');
  const decrypted = privateDecrypt(
    {
      key: priv,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buf
  );
  return decrypted.toString('utf8');
}