# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ==== Capacitor: preservar clases necesarias ====
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-dontwarn com.getcapacitor.**

# ==== JS bridge: preservar metodos anotados con @JavascriptInterface ====
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ==== WebView y Cordova ====
-keep class android.webkit.WebView { *; }
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ==== SplashScreen / AppCompat ====
-keep class androidx.core.splashscreen.SplashScreen { *; }
-keep class androidx.appcompat.app.AppCompatActivity { *; }

# ==== Mantener line numbers para debugging ====
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
