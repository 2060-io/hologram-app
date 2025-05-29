package io.twentysixty.mobileagent

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher.onApplicationCreate
import expo.modules.ApplicationLifecycleDispatcher.onConfigurationChanged
import expo.modules.ReactNativeHostWrapper
import java.io.IOException

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(this, object : DefaultReactNativeHost(
            this
        ) {
            override fun getUseDeveloperSupport(): Boolean {
                return BuildConfig.DEBUG
            }

            override fun getPackages(): List<ReactPackage> {
                val packages: MutableList<ReactPackage> = PackageList(this).packages

                // Packages that cannot be autolinked yet can be added manually here, for example:
                // packages.add(new MyReactNativePackage());
                return packages
            }

            override fun getJSMainModuleName(): String {
                return "index"
            }

            override val isNewArchEnabled: Boolean
                get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

            override val isHermesEnabled: Boolean
                get() = BuildConfig.IS_HERMES_ENABLED
        })

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        try {
            SoLoader.init(this, OpenSourceMergedSoMapping)
        } catch (e: IOException) {
            throw RuntimeException(e)
        }
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        onConfigurationChanged(this, newConfig)
    }
}
