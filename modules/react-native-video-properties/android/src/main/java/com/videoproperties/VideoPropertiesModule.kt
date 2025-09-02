package com.videoproperties

import android.media.MediaPlayer
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = VideoPropertiesModule.NAME)
class VideoPropertiesModule(reactContext: ReactApplicationContext) :
  NativeVideoPropertiesSpec(reactContext) {

  private val mReactContext: ReactContext? = reactContext

  override fun getVideoProperties(videoPath: String, promise: Promise) {
         try {
            val mp = MediaPlayer.create(mReactContext, Uri.parse(videoPath))
            val result = Arguments.createMap()
            result.putInt("width", mp.videoWidth)
            result.putInt("height", mp.videoHeight)
            result.putInt("duration", mp.duration)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("VIDEO_PROPERTIES_ERROR", e.message)
        }
  }

  companion object {
    const val NAME = "VideoProperties"
  }
}
