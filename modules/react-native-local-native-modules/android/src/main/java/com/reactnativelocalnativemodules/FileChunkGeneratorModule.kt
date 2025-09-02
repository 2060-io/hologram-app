package com.reactnativelocalnativemodules

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

@ReactModule(name = FileChunkGeneratorModule.NAME)
class FileChunkGeneratorModule(reactContext: ReactApplicationContext) :
  NativeFileChunkGeneratorSpec(reactContext) {

    override fun createChunks(
        filePath: String,
        outputFilePathPrefix: String,
        chunkSize: Double,
        promise: Promise
    ) {
        Log.d(
            "FileChunkGeneratorModule",
            ("createChunks of size " + chunkSize.toInt() + " for file: " + filePath
                    + " and output directory: " + outputFilePathPrefix)
        )

        var chunkCount = 0
        val outputPaths: MutableList<String> = ArrayList()

        try {
            val inputFile = File(filePath)
            val fis = FileInputStream(inputFile)

            while (fis.available() > 0) {
                val container =
                    ByteArray(if (fis.available() < chunkSize.toInt()) fis.available() else chunkSize.toInt())
                val currentChunkSize = fis.read(container)
                Log.d(
                    "FileChunkGeneratorModule",
                    ("creating chunk $chunkCount with size: $currentChunkSize")
                )
                val chunkFilePath = outputFilePathPrefix + '.' + chunkCount++.toString()
                val fos = FileOutputStream(chunkFilePath)
                fos.write(container)
                fos.close()
                outputPaths.add(chunkFilePath)
                Log.d("FileChunkGeneratorModule", "created chunk $chunkCount")
            }
        } catch (e: Exception) {
            Log.d("FileChunkGeneratorModule", "Error: " + e.message)
        }

        val returnArray = outputPaths.toTypedArray<String>()

        val promiseArray = Arguments.createArray()
        for (i in returnArray.indices) {
            promiseArray.pushString(returnArray[i])
        }

        promise.resolve(promiseArray)
    }

    override fun readChunk(filePath: String, offset: Double, length: Double, promise: Promise) {
        Log.d(
            "FileChunkGeneratorModule", ("read chunk for file: " + filePath
                    + " at offset " + offset + "with length " + length)
        )
        try {
            val inputFile = File(filePath)
            val fis = FileInputStream(inputFile)

            val data = ByteArray(length.toInt())
            fis.skip(offset.toLong())
            Log.d("FileChunkGeneratorModule", "reading chunk")
            fis.read(data)
            Log.d("FileChunkGeneratorModule", "chunk succesfully read")
            val result = Arguments.createArray()
            for (b in data) {
                result.pushInt(b.toInt())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            Log.d("FileChunkGeneratorModule", "Error: " + e.message)
            promise.reject("-1", e.message)
        }
    }

    companion object {
    const val NAME = "FileChunkGenerator"
  }
}
