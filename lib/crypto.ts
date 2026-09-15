/**
 * Criptografia simétrica (AES-256-GCM) para tokens de acesso do Meta armazenados no banco.
 *
 * Isolado do restante do app: usado apenas pelo novo módulo de conexões multi-conta
 * (lib/meta-connections.ts). Não mexe em nada da parte de clonagem existente.
 *
 * Requer META_TOKEN_ENCRYPTION_KEY no .env — uma chave de 32 bytes em base64.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // recomendado para GCM

function getKey(): Buffer {
  const base64Key = process.env.META_TOKEN_ENCRYPTION_KEY
  if (!base64Key) {
    throw new Error(
      'META_TOKEN_ENCRYPTION_KEY não configurada. Defina uma chave de 32 bytes em base64 no .env.local.'
    )
  }
  const key = Buffer.from(base64Key, 'base64')
  if (key.length !== 32) {
    throw new Error('META_TOKEN_ENCRYPTION_KEY inválida: precisa decodificar para exatamente 32 bytes.')
  }
  return key
}

/**
 * Criptografa um texto em claro (ex.: access_token do Meta) e retorna uma string
 * única no formato "iv:authTag:ciphertext" (tudo em base64), pronta para salvar no banco.
 */
export function encryptSecret(plainText: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

/**
 * Reverte encryptSecret. Lança erro se o payload estiver corrompido ou a chave for outra
 * (ex.: rotação de META_TOKEN_ENCRYPTION_KEY sem re-criptografar os tokens existentes).
 */
export function decryptSecret(payload: string): string {
  const key = getKey()
  const [ivB64, authTagB64, dataB64] = payload.split(':')
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Payload criptografado em formato inválido.')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}
