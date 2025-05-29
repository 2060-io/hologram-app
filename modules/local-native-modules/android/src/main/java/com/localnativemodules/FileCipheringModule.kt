package com.localnativemodules

import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.spongycastle.crypto.digests.SHA512Digest
import org.spongycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.spongycastle.crypto.params.KeyParameter
import org.spongycastle.util.encoders.Hex
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.UnsupportedEncodingException
import java.security.InvalidKeyException
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.security.spec.InvalidKeySpecException
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class FileCipheringModule internal constructor(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "FileCipheringModule"
    }

    @ReactMethod
    fun encrypt(text: String?, key: String, iv: String?, algorithm: String?, promise: Promise) {
        try {
            if (text == null || text.length == 0) {
                promise.resolve(null)
            }
            val encrypted = encrypt(text!!.toByteArray(charset("UTF-8")), key, iv)
            promise.resolve(Base64.encodeToString(encrypted, Base64.NO_WRAP))
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun encryptFile(
        inputPath: String,
        outputPath: String,
        key: String,
        iv: String?,
        algorithm: String?,
        promise: Promise
    ) {
        Log.d(
            "FileCipheringModule", ("encryptFile inputPath: " + inputPath
                    + " outputPath: " + outputPath)
        )
        try {
            val inputFile = File(inputPath)
            val fis = FileInputStream(inputFile)

            val data = ByteArray(fis.available())
            val bytesRead = fis.read(data)
            Log.d("FileCipheringModule", "read $bytesRead bytes")
            val encrypted = encrypt(data, key, iv)
            Log.d("FileCipheringModule", "encrypted")

            val fos = FileOutputStream(outputPath)
            fos.write(encrypted)
            fos.close()
            Log.d("FileCipheringModule", "file written")

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun decrypt(
        ciphertext: String?,
        pwd: String,
        iv: String?,
        algorithm: String?,
        promise: Promise
    ) {
        try {
            if (ciphertext == null || ciphertext.length == 0) {
                promise.resolve(null)
            }

            val decrypted = decrypt(Base64.decode(ciphertext, Base64.NO_WRAP), pwd, iv)
            promise.resolve(String(decrypted, charset("UTF-8")))
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun decryptFile(
        inputPath: String,
        outputPath: String,
        pwd: String,
        iv: String?,
        algorithm: String?,
        promise: Promise
    ) {
        try {
            Log.d(
                "FileCipheringModule", ("decryptFile inputPath: " + inputPath
                        + " outputPath: " + outputPath)
            )

            val inputFile = File(inputPath)
            val fis = FileInputStream(inputFile)

            val data = ByteArray(fis.available())
            val bytesRead = fis.read(data)
            Log.d("FileCipheringModule", "read $bytesRead bytes")
            val decrypted = decrypt(data, pwd, iv)

            Log.d("FileCipheringModule", "decrypted")

            val fos = FileOutputStream(outputPath)
            fos.write(decrypted)
            fos.close()
            Log.d("FileCipheringModule", "file written")

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun pbkdf2(pwd: String, salt: String, cost: Int, length: Int, promise: Promise) {
        try {
            val strs = pbkdf2(pwd, salt, cost, length)
            promise.resolve(strs)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun hmac256(data: String, pwd: String, promise: Promise) {
        try {
            val strs = hmacX(data, pwd, HMAC_SHA_256)
            promise.resolve(strs)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun hmac512(data: String, pwd: String, promise: Promise) {
        try {
            val strs = hmacX(data, pwd, HMAC_SHA_512)
            promise.resolve(strs)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun sha256(data: String, promise: Promise) {
        try {
            val result = shaX(data, "SHA-256")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun sha1(data: String, promise: Promise) {
        try {
            val result = shaX(data, "SHA-1")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun sha512(data: String, promise: Promise) {
        try {
            val result = shaX(data, "SHA-512")
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun randomUuid(promise: Promise) {
        try {
            val result = UUID.randomUUID().toString()
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @ReactMethod
    fun randomKey(length: Int, promise: Promise) {
        try {
            val key = ByteArray(length)
            val rand = SecureRandom()
            rand.nextBytes(key)
            val keyHex = bytesToHex(key)
            promise.resolve(keyHex)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    @Throws(Exception::class)
    private fun shaX(data: String, algorithm: String): String {
        val md = MessageDigest.getInstance(algorithm)
        md.update(data.toByteArray())
        val digest = md.digest()
        return bytesToHex(digest)
    }

    companion object {
        private const val CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding"
        const val HMAC_SHA_256: String = "HmacSHA256"
        const val HMAC_SHA_512: String = "HmacSHA512"
        private const val KEY_ALGORITHM = "AES"

        fun bytesToHex(bytes: ByteArray): String {
            val hexArray = "0123456789abcdef".toCharArray()
            val hexChars = CharArray(bytes.size * 2)
            for (j in bytes.indices) {
                val v = bytes[j].toInt() and 0xFF
                hexChars[j * 2] = hexArray[v ushr 4]
                hexChars[j * 2 + 1] = hexArray[v and 0x0F]
            }
            return String(hexChars)
        }

        @Throws(
            NoSuchAlgorithmException::class,
            InvalidKeySpecException::class,
            UnsupportedEncodingException::class
        )
        private fun pbkdf2(pwd: String, salt: String, cost: Int, length: Int): String {
            val gen = PKCS5S2ParametersGenerator(SHA512Digest())
            gen.init(pwd.toByteArray(charset("utf-8")), salt.toByteArray(charset("utf-8")), cost)
            val key = (gen.generateDerivedParameters(length) as KeyParameter).key
            return bytesToHex(key)
        }

        @Throws(
            NoSuchAlgorithmException::class,
            InvalidKeyException::class,
            UnsupportedEncodingException::class
        )
        private fun hmacX(text: String, key: String, algorithm: String): String {
            val contentData = text.toByteArray(charset("utf-8"))
            val akHexData = Hex.decode(key)
            val sha_HMAC = Mac.getInstance(algorithm)
            val secret_key: SecretKey = SecretKeySpec(akHexData, algorithm)
            sha_HMAC.init(secret_key)
            return bytesToHex(sha_HMAC.doFinal(contentData))
        }

        val emptyIvSpec: IvParameterSpec = IvParameterSpec(
            byteArrayOf(
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00
            )
        )

        @Throws(Exception::class)
        private fun encrypt(data: ByteArray, hexKey: String, hexIv: String?): ByteArray {
            val key = Hex.decode(hexKey)
            val secretKey: SecretKey = SecretKeySpec(key, KEY_ALGORITHM)

            val cipher = Cipher.getInstance(CIPHER_ALGORITHM)
            cipher.init(
                Cipher.ENCRYPT_MODE, secretKey, if (hexIv == null) emptyIvSpec else IvParameterSpec(
                    Hex.decode(hexIv)
                )
            )
            return cipher.doFinal(data)
        }

        @Throws(Exception::class)
        private fun decrypt(data: ByteArray, hexKey: String, hexIv: String?): ByteArray {
            val key = Hex.decode(hexKey)
            val secretKey: SecretKey = SecretKeySpec(key, KEY_ALGORITHM)

            val cipher = Cipher.getInstance(CIPHER_ALGORITHM)
            cipher.init(
                Cipher.DECRYPT_MODE, secretKey, if (hexIv == null) emptyIvSpec else IvParameterSpec(
                    Hex.decode(hexIv)
                )
            )
            return cipher.doFinal(data)
        }
    }
}
