package com.localnativemodules

import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class FileChunkGeneratorModule internal constructor(context: ReactApplicationContext?) :
    ReactContextBaseJavaModule(context) {
    override fun getName(): String {
        return "FileChunkGeneratorModule"
    }

    @ReactMethod
    fun createChunks(
        filePath: String,
        outputFilePathPrefix: String,
        chunkSize: Int,
        promise: Promise
    ) {
        Log.d(
            "FileChunkGeneratorModule",
            ("createChunks of size " + chunkSize + " for file: " + filePath
                    + " and output directory: " + outputFilePathPrefix)
        )

        var chunkCount = 0
        val outputPaths: MutableList<String> = ArrayList()

        try {
            val inputFile = File(filePath)
            val fis = FileInputStream(inputFile)

            while (fis.available() > 0) {
                val container =
                    ByteArray(if (fis.available() < chunkSize) fis.available() else chunkSize)
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

    @ReactMethod
    fun readChunk(filePath: String, offset: Double, length: Double, promise: Promise) {
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
            // Encode to base64 string
            val base64String = Base64.encodeToString(data, Base64.NO_WRAP)
            promise.resolve(base64String)

        } catch (e: Exception) {
            Log.d("FileChunkGeneratorModule", "Error: " + e.message)
            promise.reject("-1", e.message)
        }
    }
}
