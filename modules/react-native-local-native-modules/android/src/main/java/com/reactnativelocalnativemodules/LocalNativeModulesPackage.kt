package com.reactnativelocalnativemodules

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class LocalNativeModulesPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      VideoProperties.NAME -> VideoProperties(reactContext)
      FileChunkGenerator.NAME -> FileChunkGenerator(reactContext)
      FileCiphering.NAME -> FileCiphering(reactContext)
      GoogleDrive.NAME -> GoogleDrive(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    val moduleNames = listOf(
      VideoProperties.NAME,
      FileChunkGenerator.NAME,
      FileCiphering.NAME,
      GoogleDrive.NAME,
    )
    moduleNames.associateWith { name ->
      ReactModuleInfo(
        name,
        name,
        /* canOverrideExistingModule = */ false,
        /* needsEagerInit          = */ false,
        /* isCxxModule             = */ false,
        /* isTurboModule           = */ true,
      )
    }
  }
}
