package io.twentysixty.mobileagent;

import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;

import java.util.UUID;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.InvalidKeyException;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.Mac;

import org.spongycastle.crypto.digests.SHA512Digest;
import org.spongycastle.crypto.generators.PKCS5S2ParametersGenerator;
import org.spongycastle.crypto.params.KeyParameter;
import org.spongycastle.util.encoders.Hex;

import android.util.Base64;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class FileCipheringModule extends ReactContextBaseJavaModule {

    private static final String CIPHER_ALGORITHM = "AES/CBC/PKCS7Padding";
    public static final String HMAC_SHA_256 = "HmacSHA256";
    public static final String HMAC_SHA_512 = "HmacSHA512";
    private static final String KEY_ALGORITHM = "AES";

    FileCipheringModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "FileCipheringModule";
    }

    @ReactMethod
    public void encrypt(String text, String key, String iv, String algorithm, Promise promise) {
        try {
            if (text == null || text.length() == 0) {
                promise.resolve(null);
            }
            byte [] encrypted = encrypt(text.getBytes("UTF-8"), key, iv);
            promise.resolve(Base64.encodeToString(encrypted, Base64.NO_WRAP));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void encryptFile(String inputPath, String outputPath, String key, String iv, String algorithm, Promise promise) {
        Log.d("FileCipheringModule", "encryptFile inputPath: " + inputPath
                + " outputPath: " + outputPath);
        try {
            File inputFile = new File(inputPath);
            FileInputStream fis = new FileInputStream(inputFile);

            byte [] data = new byte[fis.available()];
            int bytesRead = fis.read(data);
            Log.d("FileCipheringModule", "read " + Integer.toString(bytesRead) + " bytes");
            byte [] encrypted = encrypt(data, key, iv);
            Log.d("FileCipheringModule", "encrypted");

            FileOutputStream fos = new FileOutputStream(outputPath);
            fos.write(encrypted);
            fos.close();
            Log.d("FileCipheringModule", "file written");

            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void decrypt(String ciphertext, String pwd, String iv, String algorithm, Promise promise) {
        try {

            if(ciphertext == null || ciphertext.length() == 0) {
                promise.resolve(null);
            }

            byte [] decrypted = decrypt(Base64.decode(ciphertext, Base64.NO_WRAP), pwd, iv);
            promise.resolve(new String(decrypted, "UTF-8"));
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void decryptFile(String inputPath, String outputPath, String pwd, String iv, String algorithm, Promise promise) {
        try {
            Log.d("FileCipheringModule", "decryptFile inputPath: " + inputPath
                    + " outputPath: " + outputPath);

            File inputFile = new File(inputPath);
            FileInputStream fis = new FileInputStream(inputFile);

            byte [] data = new byte[fis.available()];
            int bytesRead = fis.read(data);
            Log.d("FileCipheringModule", "read " + Integer.toString(bytesRead) + " bytes");
            byte [] decrypted = decrypt(data, pwd, iv);

            Log.d("FileCipheringModule", "decrypted");

            FileOutputStream fos = new FileOutputStream(outputPath);
            fos.write(decrypted);
            fos.close();
            Log.d("FileCipheringModule", "file written");

            promise.resolve(null);

        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void pbkdf2(String pwd, String salt, Integer cost, Integer length, Promise promise) {
        try {
            String strs = pbkdf2(pwd, salt, cost, length);
            promise.resolve(strs);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void hmac256(String data, String pwd, Promise promise) {
        try {
            String strs = hmacX(data, pwd, HMAC_SHA_256);
            promise.resolve(strs);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void hmac512(String data, String pwd, Promise promise) {
        try {
            String strs = hmacX(data, pwd, HMAC_SHA_512);
            promise.resolve(strs);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha256(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-256");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha1(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-1");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void sha512(String data, Promise promise) {
        try {
            String result = shaX(data, "SHA-512");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void randomUuid(Promise promise) {
        try {
            String result = UUID.randomUUID().toString();
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    @ReactMethod
    public void randomKey(Integer length, Promise promise) {
        try {
            byte[] key = new byte[length];
            SecureRandom rand = new SecureRandom();
            rand.nextBytes(key);
            String keyHex = bytesToHex(key);
            promise.resolve(keyHex);
        } catch (Exception e) {
            promise.reject("-1", e.getMessage());
        }
    }

    private String shaX(String data, String algorithm) throws Exception {
        MessageDigest md = MessageDigest.getInstance(algorithm);
        md.update(data.getBytes());
        byte[] digest = md.digest();
        return bytesToHex(digest);
    }

    public static String bytesToHex(byte[] bytes) {
        final char[] hexArray = "0123456789abcdef".toCharArray();
        char[] hexChars = new char[bytes.length * 2];
        for ( int j = 0; j < bytes.length; j++ ) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }

    private static String pbkdf2(String pwd, String salt, Integer cost, Integer length)
            throws NoSuchAlgorithmException, InvalidKeySpecException, UnsupportedEncodingException
    {
        PKCS5S2ParametersGenerator gen = new PKCS5S2ParametersGenerator(new SHA512Digest());
        gen.init(pwd.getBytes("utf-8"), salt.getBytes("utf-8"), cost);
        byte[] key = ((KeyParameter) gen.generateDerivedParameters(length)).getKey();
        return bytesToHex(key);
    }

    private static String hmacX(String text, String key, String algorithm)
            throws NoSuchAlgorithmException, InvalidKeyException, UnsupportedEncodingException
    {
        byte[] contentData = text.getBytes("utf-8");
        byte[] akHexData = Hex.decode(key);
        Mac sha_HMAC = Mac.getInstance(algorithm);
        SecretKey secret_key = new SecretKeySpec(akHexData, algorithm);
        sha_HMAC.init(secret_key);
        return bytesToHex(sha_HMAC.doFinal(contentData));
    }

    final static IvParameterSpec emptyIvSpec = new IvParameterSpec(new byte[] {0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00});

    private static byte [] encrypt(byte [] data, String hexKey, String hexIv) throws Exception {
        byte[] key = Hex.decode(hexKey);
        SecretKey secretKey = new SecretKeySpec(key, KEY_ALGORITHM);

        Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, hexIv == null ? emptyIvSpec : new IvParameterSpec(Hex.decode(hexIv)));
        return cipher.doFinal(data);
    }

    private static byte [] decrypt(byte [] data, String hexKey, String hexIv) throws Exception {
        byte[] key = Hex.decode(hexKey);
        SecretKey secretKey = new SecretKeySpec(key, KEY_ALGORITHM);

        Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, hexIv == null ? emptyIvSpec : new IvParameterSpec(Hex.decode(hexIv)));
        return cipher.doFinal(data);
    }

}
