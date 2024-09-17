package io.twentysixty.mobileagent;

import android.media.MediaMetadataRetriever;
import android.media.MediaPlayer;
import android.net.Uri;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.IOException;

public class VideoProperties extends ReactContextBaseJavaModule {

    public VideoProperties(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "VideoProperties";
    }

    @ReactMethod
    public void getVideoProperties(String videoPath, Promise promise) throws IOException {
        try {
            MediaPlayer mp = MediaPlayer.create(this.getReactApplicationContext(), Uri.parse(videoPath));
            WritableMap result = Arguments.createMap();
            result.putInt("width", mp.getVideoWidth());
            result.putInt("height", mp.getVideoHeight());
            result.putInt("duration", mp.getDuration());
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("VIDEO_PROPERTIES_ERROR", e.getMessage());
        }
    }
}
