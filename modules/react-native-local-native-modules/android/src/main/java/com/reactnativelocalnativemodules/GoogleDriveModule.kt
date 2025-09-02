package com.reactnativelocalnativemodules

import android.accounts.Account
import android.accounts.AccountManager
import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.views.textinput.ReactTextInputManager
import com.google.android.gms.auth.GoogleAuthUtil
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope

@ReactModule(name= GoogleDriveModule.NAME)
class GoogleDriveModule(reactContext: ReactApplicationContext): NativeGoogleDriveSpec(reactContext), ActivityEventListener {

    companion object {
        const val NAME: String = "GoogleDrive"
        const val INTENT_SELECT_ACCOUNT_REQUEST_CODE: Int = 1
        const val INTENT_AUTH_REQUEST_CODE: Int = 2
    }

    var authorizationResult: AuthorizationResult? = null
    private var authorizationRequestPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun authorize(
        accountName: String,
        promise: Promise
    ) {
        authorizationRequestPromise = promise
        val requestedScopes = listOf(Scope("https://www.googleapis.com/auth/drive.appdata"))
        val account = Account(accountName, GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE)
        val authorizationRequest =
            AuthorizationRequest.builder().setRequestedScopes(requestedScopes)
                .setAccount(account)
                .build()
        Identity.getAuthorizationClient(this.reactApplicationContext)
            .authorize(authorizationRequest)
            .addOnSuccessListener { authorizationResult: AuthorizationResult ->
                if (authorizationResult.hasResolution()) {
                    // Access needs to be granted by the user
                    val pendingIntent = authorizationResult.pendingIntent
                    try {
                        ActivityCompat.startIntentSenderForResult(
                            this.currentActivity!!,
                            pendingIntent!!.intentSender,
                            INTENT_AUTH_REQUEST_CODE,
                            null,
                            0,
                            0,
                            0,
                            null
                        )
                    } catch (e: IntentSender.SendIntentException) {
                        Log.e(
                            ReactTextInputManager.TAG,
                            "Couldn't start GDriveAuthorizationModule UI: " + e.localizedMessage
                        )
                    }
                } else {
                    // Access already granted, continue with user action
                    Log.e(
                        ReactTextInputManager.TAG,
                        "Access already granted: " + authorizationResult.accessToken
                    )
                    this.authorizationResult = authorizationResult
                    authorizationRequestPromise!!.resolve(true)
                }
            }
            .addOnFailureListener { e: Exception? ->
                Log.e(ReactTextInputManager.TAG, "Failed to authorize", e)
                authorizationRequestPromise!!.reject(
                    NAME,
                    "Failed to authorize"
                )
            }
    }

    override fun getAccessToken(promise: Promise) {
        if (authorizationResult == null) {
            promise.reject(NAME, "getTokens requires authorizationResult to be initialized")
            return
        }
        promise.resolve(authorizationResult!!.accessToken)
    }

    override fun selectAccount(
        accountName: String?,
        promise: Promise
    ) {
        authorizationRequestPromise = promise
        val intent = AccountManager.newChooseAccountIntent(
            if (accountName == null) null else Account(
                accountName,
                GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE
            ),
            null,
            arrayOf(GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE),
            null,
            null,
            null,
            null
        )
        val activity = this.currentActivity
        if (activity == null) {
            authorizationRequestPromise!!.reject(
                "NO_CURRENT_UI_ACTIVITY",
                "There is not an activity to execute an intent"
            )
        } else {
            activity.startActivityForResult(intent, INTENT_SELECT_ACCOUNT_REQUEST_CODE)
        }
    }

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        Log.i("resultCode", resultCode.toString())
        if (requestCode == INTENT_SELECT_ACCOUNT_REQUEST_CODE) {
            if (authorizationRequestPromise != null) {
                if (resultCode == Activity.RESULT_OK) {
                    val accountName = data?.getStringExtra(AccountManager.KEY_ACCOUNT_NAME)
                    authorizationRequestPromise!!.resolve(accountName)
                } else {
                    authorizationRequestPromise!!.reject(
                        NAME,
                        "User cancelled the account selection dialog"
                    )
                }
            }
        }
        if (requestCode == INTENT_AUTH_REQUEST_CODE) {
            try {
                authorizationResult = Identity.getAuthorizationClient(
                    this.reactApplicationContext
                ).getAuthorizationResultFromIntent(data)
                authorizationRequestPromise!!.resolve(true)
            } catch (e: ApiException) {
                authorizationRequestPromise!!.reject(NAME, "Failed to authorize")
            }
        }
    }

    override fun onNewIntent(p0: Intent?) {}
}