package io.twentysixty.mobileagent;

import static androidx.core.app.ActivityCompat.startIntentSenderForResult;
import static com.facebook.react.views.textinput.ReactTextInputManager.TAG;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentSender;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;

import java.util.List;

public class GDriveAuthorization extends ReactContextBaseJavaModule implements ActivityEventListener {

    public static final String MODULE_NAME = "GDriveAuthorization";
    AuthorizationResult authorizationResult = null;
    public static final int INTENT_SELECT_ACCOUNT_REQUEST_CODE = 1;
    public static final int INTENT_AUTH_REQUEST_CODE = 2;
    private Promise authorizationRequestPromise;


    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    public GDriveAuthorization(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @ReactMethod
    public void selectAccount(String accountName, Promise promise) {
        authorizationRequestPromise = promise;
        Intent intent = AccountManager.newChooseAccountIntent(
                accountName == null ? null : new Account(accountName, GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE),
                null,
                new String[]{GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE},
                null,
                null,
                null,
                null );
        Activity activity = this.getCurrentActivity();
        if(activity == null) {
            authorizationRequestPromise.reject("NO_CURRENT_UI_ACTIVITY", "There is not an activity to execute an intent");
        } else {
            activity.startActivityForResult(intent, INTENT_SELECT_ACCOUNT_REQUEST_CODE);
        }
    }

    @ReactMethod
    public void authorize(String accountName, Promise promise){
        authorizationRequestPromise = promise;
        List<Scope> requestedScopes = List.of(new Scope("https://www.googleapis.com/auth/drive.appdata"));
        Account account = new Account(accountName, GoogleAuthUtil.GOOGLE_ACCOUNT_TYPE);
        AuthorizationRequest authorizationRequest = AuthorizationRequest.builder().setRequestedScopes(requestedScopes)
                .setAccount(account)
                .build();
        Identity.getAuthorizationClient(this.getReactApplicationContext())
                .authorize(authorizationRequest)
                .addOnSuccessListener(
                        authorizationResult -> {
                            if (authorizationResult.hasResolution()) {
                                // Access needs to be granted by the user
                                PendingIntent pendingIntent = authorizationResult.getPendingIntent();
                                try {
                                    startIntentSenderForResult(this.getCurrentActivity(), pendingIntent.getIntentSender(),
                                            INTENT_AUTH_REQUEST_CODE, null, 0, 0, 0, null);
                                } catch (IntentSender.SendIntentException e) {
                                    Log.e(TAG, "Couldn't start GDriveAuthorization UI: " + e.getLocalizedMessage());
                                }
                            }
                            else {
                                // Access already granted, continue with user action
                                Log.e(TAG, "Access already granted: " + authorizationResult.getAccessToken());
                                this.authorizationResult = authorizationResult;
                                authorizationRequestPromise.resolve(true);
                            }
                        })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Failed to authorize", e);
                    authorizationRequestPromise.reject(MODULE_NAME,"Failed to authorize");
                });
    }

    @ReactMethod
    public void getAccessToken(final Promise promise) {
        if (authorizationResult == null) {
            promise.reject(MODULE_NAME, "getTokens requires authorizationResult to be initialized");
            return;
        }
        promise.resolve(authorizationResult.getAccessToken());
    }

    @Override
    public void onActivityResult(Activity activity,int requestCode, int resultCode, Intent data) {
        Log.i("resultCode", String.valueOf(resultCode));
        if (requestCode == INTENT_SELECT_ACCOUNT_REQUEST_CODE) {
            if (authorizationRequestPromise != null) {
                if (resultCode == Activity.RESULT_OK) {
                    String accountName = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
                    authorizationRequestPromise.resolve(accountName);
                } else {
                    authorizationRequestPromise.reject(MODULE_NAME, "User cancelled the account selection dialog");
                }
            }
        }
        if (requestCode == INTENT_AUTH_REQUEST_CODE) {
            try {
                authorizationResult = Identity.getAuthorizationClient(this.getReactApplicationContext()).getAuthorizationResultFromIntent(data);
                authorizationRequestPromise.resolve(true);
            } catch (ApiException e) {
                authorizationRequestPromise.reject(MODULE_NAME,"Failed to authorize");
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {

    }
}
