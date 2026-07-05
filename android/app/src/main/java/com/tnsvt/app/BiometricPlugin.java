package com.tnsvt.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.Executor;

@CapacitorPlugin(name = "BiometricPlugin")
public class BiometricPlugin extends Plugin {

    // ⚠ Importante: DEBE coincidir con MainActivity.PREFS_NAME ("CapacitorStorage")
    // para que app lock y PIN funcionen correctamente.
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_PIN_HASH = "pin_hash";
    private static final String KEY_APP_LOCK = "app_lock_enabled";
    private static final String KEY_BIOMETRIC_ENABLED = "biometric_enabled";
    private static final String TAG = "BiometricPlugin";

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        try {
            FragmentActivity activity = (FragmentActivity) getActivity();
            if (activity == null) {
                call.reject("Activity not available");
                return;
            }
            BiometricManager manager = BiometricManager.from(activity);
            int result = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            JSObject ret = new JSObject();
            ret.put("isAvailable", result == BiometricManager.BIOMETRIC_SUCCESS);
            ret.put("biometricType", "fingerprint");
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isAvailable", false);
            ret.put("biometricType", "none");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        try {
            FragmentActivity activity = (FragmentActivity) getActivity();
            if (activity == null) {
                call.reject("Activity not available");
                return;
            }
            String reason = call.getString("reason", "Autenticación biométrica");

            Executor executor = ContextCompat.getMainExecutor(activity);
            BiometricPrompt biometricPrompt = new BiometricPrompt(
                    activity, executor, new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    call.resolve();
                }

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    if (errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                        errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                        call.reject("cancelado", String.valueOf(errorCode));
                    } else {
                        call.reject(errString.toString(), String.valueOf(errorCode));
                    }
                }

                @Override
                public void onAuthenticationFailed() {
                }
            });

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(reason)
                    .setSubtitle("Colocá tu huella digital")
                    .setNegativeButtonText("Cancelar")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                    .build();

            biometricPrompt.authenticate(promptInfo);
        } catch (Exception e) {
            Log.e(TAG, "authenticate error", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setPin(PluginCall call) {
        String pin = call.getString("pin");
        if (pin == null || pin.length() < 4) {
            call.reject("PIN must be at least 4 digits");
            return;
        }
        String hash = sha256(pin);
        getPrefs().edit().putString(KEY_PIN_HASH, hash).apply();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void verifyPin(PluginCall call) {
        String pin = call.getString("pin");
        String storedHash = getPrefs().getString(KEY_PIN_HASH, null);
        boolean success = pin != null && storedHash != null && storedHash.equals(sha256(pin));
        JSObject ret = new JSObject();
        ret.put("success", success);
        call.resolve(ret);
    }

    @PluginMethod
    public void hasPin(PluginCall call) {
        boolean hasPin = getPrefs().getString(KEY_PIN_HASH, null) != null;
        JSObject ret = new JSObject();
        ret.put("hasPin", hasPin);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAppLockEnabled(PluginCall call) {
        boolean enabled = "true".equals(getPrefs().getString(KEY_APP_LOCK, "false"));
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void setAppLockEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        getPrefs().edit().putString(KEY_APP_LOCK, String.valueOf(enabled)).apply();
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void isBiometricEnabled(PluginCall call) {
        boolean enabled = "true".equals(getPrefs().getString(KEY_BIOMETRIC_ENABLED, "false"));
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void setBiometricEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        getPrefs().edit().putString(KEY_BIOMETRIC_ENABLED, String.valueOf(enabled)).apply();
        JSObject ret = new JSObject();
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
