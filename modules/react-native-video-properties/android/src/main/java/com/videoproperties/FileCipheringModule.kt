package com.videoproperties

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec
import org.spongycastle.util.encoders.Hex
import javax.crypto.spec.IvParameterSpec

@ReactModule(name = FileCipheringModule.NAME)
class FileCipheringModule(reactContext: ReactApplicationContext) :NativeFileCipheringModuleSpec(reactContext){
    override fun randomKey(length: Double, promise: Promise) {
        try {
            val key = ByteArray(length.toInt())
            val rand = SecureRandom()
            rand.nextBytes(key)
            val keyHex = bytesToHex(key)
            promise.resolve(keyHex)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    override fun encryptFile(
        filePath: String,
        outputPath: String,
        key: String,
        iv: String,
        algorithm: String,
        promise: Promise
    ) {
        Log.d(
            "FileCipheringModule", ("encryptFile inputPath: " + filePath
                    + " outputPath: " + outputPath)
        )
        try {
            val inputFile = File(filePath)
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

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    override fun decryptFile(
        filePath: String,
        outputPath: String,
        key: String,
        iv: String,
        algorithm: String,
        promise: Promise
    ) {
        try {
            Log.d(
                "FileCipheringModule", ("decryptFile inputPath: " + filePath
                        + " outputPath: " + outputPath)
            )

            val inputFile = File(filePath)
            val fis = FileInputStream(inputFile)

            val data = ByteArray(fis.available())
            val bytesRead = fis.read(data)
            Log.d("FileCipheringModule", "read $bytesRead bytes")
            val decrypted = decrypt(data, key, iv)

            Log.d("FileCipheringModule", "decrypted")

            val fos = FileOutputStream(outputPath)
            fos.write(decrypted)
            fos.close()
            Log.d("FileCipheringModule", "file written")

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("-1", e.message)
        }
    }

    companion object {
        private const val CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding"
        const val NAME = "FileCiphering"
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