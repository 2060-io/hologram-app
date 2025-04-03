package com.localnativemodules

import android.media.MediaPlayer
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.IOException

class VideoPropertiesModule(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "VideoPropertiesModule"
    }

    @ReactMethod
    @Throws(IOException::class)
    fun getVideoProperties(videoPath: String?, promise: Promise) {
        try {
            val mp = MediaPlayer.create(this.reactApplicationContext, Uri.parse(videoPath))
            val result = Arguments.createMap()
            result.putInt("width", mp.videoWidth)
            result.putInt("height", mp.videoHeight)
            result.putInt("duration", mp.duration)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("VIDEO_PROPERTIES_ERROR", e.message)
        }
    }
}
