# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class io.realm.**  { * ; }
-keep class org.webrtc.** { *; }
-keep class io.twentysixty.mobileagent.BuildConfig { *; }
-keep class io.twentysixty.rn.eidreader.** { *; }
-keep class org.jmrtd.** { *; } 
-keep class net.sf.scuba.**  { *; }
-keep class org.bouncycastle.** { *; }
-keep class org.ejbca.** { *; }
-dontwarn java.applet.Applet
-dontwarn java.awt.**

# react-native-file-logger (SLF4J + logback-android)
-keep class org.slf4j.impl.** { *; }
-keep class ch.qos.logback.** { *; }
-dontwarn org.slf4j.**
-dontwarn ch.qos.logback.**