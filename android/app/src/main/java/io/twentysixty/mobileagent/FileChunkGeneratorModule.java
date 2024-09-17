package io.twentysixty.mobileagent;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.WritableArray;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import android.util.Log;

public class FileChunkGeneratorModule extends ReactContextBaseJavaModule {
    FileChunkGeneratorModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "FileChunkGeneratorModule";
    }

    @ReactMethod
    public void createChunks(String filePath, String outputFilePathPrefix, int chunkSize, final Promise promise) {
        Log.d("FileChunkGeneratorModule", "createChunks of size " + chunkSize + " for file: " + filePath
                + " and output directory: " + outputFilePathPrefix);

        int chunkCount = 0;
        List<String> outputPaths = new ArrayList<String>();

        try {
            File inputFile = new File(filePath);
            FileInputStream fis = new FileInputStream(inputFile);

            while(fis.available() > 0) {
                byte [] container = new byte[fis.available() < chunkSize ? fis.available() : chunkSize];
                int currentChunkSize = fis.read(container);
                Log.d("FileChunkGeneratorModule", "creating chunk " + Integer.toString(chunkCount)
                        + " with size: " + currentChunkSize);
                String chunkFilePath = outputFilePathPrefix + '.' + Integer.toString(chunkCount++);
                FileOutputStream fos = new FileOutputStream(chunkFilePath);
                fos.write(container);
                fos.close();
                outputPaths.add(chunkFilePath);
                Log.d("FileChunkGeneratorModule", "created chunk " + Integer.toString(chunkCount));
            }
        } catch(Exception e) {
            Log.d("FileChunkGeneratorModule", "Error: " + e.getMessage());
        }

        String[] returnArray = outputPaths.toArray(new String[0]);

        WritableArray promiseArray = Arguments.createArray();
        for (int i = 0 ; i < returnArray.length; i++) {
            promiseArray.pushString(returnArray[i]);
        }

        promise.resolve(promiseArray);

    }

    @ReactMethod
    public void readChunk(String filePath, double offset, double length, final Promise promise) {
        Log.d("FileChunkGeneratorModule", "read chunk for file: " + filePath
                + " at offset " + offset + "with length " + length);
        try {
            File inputFile = new File(filePath);
            FileInputStream fis = new FileInputStream(inputFile);

            byte [] data = new byte[(int) length];
            fis.skip((long) offset);
            Log.d("FileChunkGeneratorModule", "reading chunk");
            fis.read(data);
            Log.d("FileChunkGeneratorModule", "chunk succesfully read");
            WritableArray result = Arguments.createArray();
            for (byte b : data) {
                result.pushInt((int) b);
            }
            promise.resolve(result);
        } catch(Exception e) {
            Log.d("FileChunkGeneratorModule", "Error: " + e.getMessage());
            promise.reject("-1", e.getMessage());
        }
    }

}
