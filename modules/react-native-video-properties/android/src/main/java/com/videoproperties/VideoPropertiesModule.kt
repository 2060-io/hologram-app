package com.videoproperties

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.Promise
import android.media.MediaPlayer
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReactContext

@ReactModule(name = VideoPropertiesModule.NAME)
class VideoPropertiesModule(reactContext: ReactApplicationContext) :
  NativeVideoPropertiesSpec(reactContext) {

  private val mReactContext: ReactContext?

  init {
    mReactContext = reactContext
  }

  override fun getName(): String {
    return NAME
  }

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
