package com.sharemenu

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule


@ReactModule(name = ShareMenuModule.NAME)
class ShareMenuModule(reactContext: ReactApplicationContext?) : NativeShareMenuSpec(reactContext),
  ActivityEventListener {
  // Events
  val NEW_SHARE_EVENT: String = "NewShareEvent"

  // Keys
  val MIME_TYPE_KEY: String = "mimeType"
  val DATA_KEY: String = "data"

  private val mReactContext: ReactContext?

  init {
    mReactContext = reactContext

    mReactContext!!.addActivityEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  private fun extractShared(intent: Intent): ReadableMap? {
    val type = intent.type ?: return null

    val action = intent.action

    val data = Arguments.createMap()
    val uriArr = Arguments.createArray()

    if (Intent.ACTION_SEND == action) {
      val dataRow = Arguments.createMap()
      if ("text/plain" == type) {
        dataRow.putString(MIME_TYPE_KEY, type)
        dataRow.putString(DATA_KEY, intent.getStringExtra(Intent.EXTRA_TEXT))
        uriArr.pushMap(dataRow)
        data.putArray(DATA_KEY, uriArr)
        return data
      }
      val fileUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
      if (fileUri != null) {
        val cr = reactApplicationContext.contentResolver
        val mimeType = cr.getType(fileUri)
        dataRow.putString(MIME_TYPE_KEY, mimeType)
        dataRow.putString(DATA_KEY, fileUri.toString())
        uriArr.pushMap(dataRow)
        data.putArray(DATA_KEY, uriArr)
        return data
      }
    } else if (Intent.ACTION_SEND_MULTIPLE == action) {
      val fileUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
      if (fileUris != null) {
        for (uri in fileUris) {
          val dataRow = Arguments.createMap()
          val cr = reactApplicationContext.contentResolver
          val mimeType = cr.getType(uri)
          dataRow.putString(MIME_TYPE_KEY, mimeType)
          dataRow.putString(DATA_KEY, uri.toString())
          uriArr.pushMap(dataRow)
        }
        data.putArray(DATA_KEY, uriArr)
        return data
      }
    }

    return null
  }

  @ReactMethod
  override fun getSharedText(successCallback: Callback) {
    val currentActivity = currentActivity ?: return

    // If this isn't the root activity then make sure it is
    if (!currentActivity.isTaskRoot) {
      val newIntent = Intent(currentActivity.intent)
      newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      currentActivity.startActivity(newIntent)

      val shared = extractShared(newIntent)
      successCallback.invoke(shared)
      clearSharedText()
      currentActivity.finish()
      return
    }

    val intent = currentActivity.intent

    val shared = extractShared(intent)
    successCallback.invoke(shared)
    clearSharedText()
  }

  private fun dispatchEvent(shared: ReadableMap?) {
    if (mReactContext == null || !mReactContext.hasActiveCatalystInstance()) {
      return
    }

    mReactContext
      .getJSModule(BridgeReactContext.RCTDeviceEventEmitter::class.java)
      .emit(NEW_SHARE_EVENT, shared)
  }

  fun clearSharedText() {
    val mActivity = currentActivity ?: return

    val intent = mActivity.intent
    val type = intent.type ?: return

    if ("text/plain" == type) {
      intent.removeExtra(Intent.EXTRA_TEXT)
      return
    }

    intent.removeExtra(Intent.EXTRA_STREAM)
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    // DO nothing
  }

  override fun onNewIntent(intent: Intent) {
    // Possibly received a new share while the app was already running

    val currentActivity = currentActivity ?: return

    val shared = extractShared(intent)
    dispatchEvent(shared)

    // Update intent in case the user calls `getSharedText` again
    currentActivity.intent = intent
  }

  companion object {
    const val NAME: String = "ShareMenu"
  }
}

