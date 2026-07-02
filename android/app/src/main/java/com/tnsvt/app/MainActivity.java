package com.tnsvt.app;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.Executor;

public class MainActivity extends BridgeActivity {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_APP_LOCK = "app_lock_enabled";
    private static final String KEY_PIN_HASH = "pin_hash";
    private static final String KEY_PIN_ATTEMPTS = "pin_attempts";
    private static final String KEY_PIN_LOCKOUT_UNTIL = "pin_lockout_until";
    private static final String KEY_STARTUP_FAIL = "startup_fail_count";
    private static final int PIN_LOCKOUT_THRESHOLD = 5;
    private static final long PIN_LOCKOUT_DURATION_MS = 30_000L;
    private long lastPinAttemptMs = 0;
    private boolean appUnlocked = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Detect crash loops: if app locked and we crashed 3x within 60s, reset lock
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int fails = prefs.getInt(KEY_STARTUP_FAIL, 0);
        long firstFailTime = prefs.getLong("startup_first_fail_time", 0);
        boolean lockEnabled = prefs.getBoolean(KEY_APP_LOCK, false);
        if (lockEnabled && fails >= 3 && (System.currentTimeMillis() - firstFailTime) < 60_000L) {
            android.util.Log.w("TNSVT", "Detected " + fails + " startup failures within 60s, resetting app lock");
            prefs.edit()
                .putBoolean(KEY_APP_LOCK, false)
                .remove(KEY_PIN_HASH)
                .remove(KEY_PIN_ATTEMPTS)
                .remove(KEY_PIN_LOCKOUT_UNTIL)
                .remove(KEY_STARTUP_FAIL)
                .remove("startup_first_fail_time")
                .apply();
        } else if (!lockEnabled) {
            // If lock is disabled, clear crash counter
            prefs.edit().remove(KEY_STARTUP_FAIL).remove("startup_first_fail_time").apply();
        }

        try {
            getBridge().getWebView().getSettings().setBuiltInZoomControls(true);
            getBridge().getWebView().getSettings().setDisplayZoomControls(false);
            getBridge().getWebView().getSettings().setSupportZoom(true);
        } catch (Exception e) {
            android.util.Log.e("TNSVT", "WebView settings failed", e);
        }

        // App lock uses decorView.post to ensure view hierarchy is ready
        getWindow().getDecorView().post(() -> {
            try {
                SharedPreferences p = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                boolean lockEnabled = p.getBoolean(KEY_APP_LOCK, false);
                if (lockEnabled) {
                    int failCount = p.getInt(KEY_STARTUP_FAIL, 0) + 1;
                    SharedPreferences.Editor ed = p.edit();
                    ed.putInt(KEY_STARTUP_FAIL, failCount);
                    if (failCount == 1) {
                        ed.putLong("startup_first_fail_time", System.currentTimeMillis());
                    }
                    ed.apply();

                    View wv = getBridge().getWebView();
                    if (wv != null) {
                        wv.setVisibility(View.GONE);
                    }
                    showAppLock();
                } else {
                    p.edit().remove(KEY_STARTUP_FAIL).remove("startup_first_fail_time").apply();
                }
            } catch (Exception e) {
                android.util.Log.e("TNSVT", "app lock init failed", e);
                ensureWebViewVisible();
                getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    .edit().putInt(KEY_STARTUP_FAIL, 99).apply();
            }
        });
    }

    private void ensureWebViewVisible() {
        try {
            View wv = getBridge().getWebView();
            if (wv != null) wv.setVisibility(View.VISIBLE);
        } catch (Exception ignored) {}
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    private void showAppLock() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String pinHash = prefs.getString(KEY_PIN_HASH, null);

        BiometricManager manager = BiometricManager.from(this);
        boolean bioAvailable = manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                == BiometricManager.BIOMETRIC_SUCCESS;

        if (bioAvailable) {
            showBiometricPrompt(pinHash);
        } else if (pinHash != null) {
            showPinPrompt();
        } else {
            unlockApp();
        }
    }

    private void showBiometricPrompt(String pinHash) {
        Executor executor = ContextCompat.getMainExecutor(this);
        BiometricPrompt biometricPrompt = new BiometricPrompt(
                this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                unlockApp();
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                if (errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                    errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                    if (pinHash != null) {
                        showPinPrompt();
                    } else {
                        showExitOrRetryDialog();
                    }
                } else if (errorCode == BiometricPrompt.ERROR_LOCKOUT ||
                           errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT) {
                    if (pinHash != null) {
                        showPinPrompt();
                    } else {
                        showExitOrRetryDialog();
                    }
                }
            }

            @Override
            public void onAuthenticationFailed() {
            }
        });

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("TNSVT - Bloqueo de App")
                .setSubtitle("Colocá tu huella para continuar")
                .setNegativeButtonText("Usar PIN")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .build();

        biometricPrompt.authenticate(promptInfo);
    }

    private void showPinPrompt() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // Check lockout
        long lockoutUntil = prefs.getLong(KEY_PIN_LOCKOUT_UNTIL, 0);
        if (lockoutUntil > System.currentTimeMillis()) {
            long remaining = (lockoutUntil - System.currentTimeMillis()) / 1000;
            showLockoutDialog((int) remaining);
            return;
        }

        // Rate limit: minimum 1s between attempts
        long now = System.currentTimeMillis();
        if (now - lastPinAttemptMs < 1000) {
            Toast.makeText(this, "Demasiado rápido. Esperá un segundo.", Toast.LENGTH_SHORT).show();
            lastPinAttemptMs = now;
            getWindow().getDecorView().postDelayed(this::showPinPrompt, 1000);
            return;
        }

        int attempts = prefs.getInt(KEY_PIN_ATTEMPTS, 0);
        int remainingAttempts = PIN_LOCKOUT_THRESHOLD - attempts;

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Ingresá tu PIN");
        builder.setMessage("PIN de 4 dígitos. Intentos restantes: " + Math.max(remainingAttempts, 1));

        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        input.setHint("****");
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(40, 10, 40, 10);
        input.setLayoutParams(lp);

        builder.setView(input);
        builder.setCancelable(false);

        builder.setPositiveButton("Desbloquear", (dialog, which) -> {
            lastPinAttemptMs = System.currentTimeMillis();
            String pin = input.getText().toString().trim();
            if (verifyPin(pin)) {
                // Success: reset attempts
                prefs.edit().remove(KEY_PIN_ATTEMPTS).remove(KEY_PIN_LOCKOUT_UNTIL).apply();
                unlockApp();
            } else {
                int newAttempts = attempts + 1;
                prefs.edit().putInt(KEY_PIN_ATTEMPTS, newAttempts).apply();
                if (newAttempts >= PIN_LOCKOUT_THRESHOLD) {
                    long lockUntil = System.currentTimeMillis() + PIN_LOCKOUT_DURATION_MS;
                    prefs.edit().putLong(KEY_PIN_LOCKOUT_UNTIL, lockUntil).apply();
                    Toast.makeText(this, "PIN incorrecto. App bloqueada 30s.", Toast.LENGTH_SHORT).show();
                    showLockoutDialog(30);
                } else {
                    Toast.makeText(this, "PIN incorrecto (" + newAttempts + "/" + PIN_LOCKOUT_THRESHOLD + ")", Toast.LENGTH_SHORT).show();
                    showPinPrompt();
                }
            }
        });

        builder.setNegativeButton("Salir", (dialog, which) -> finishAffinity());
        builder.show();
    }

    private void showLockoutDialog(int seconds) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("🔒 App bloqueada");
        builder.setMessage("Demasiados intentos fallidos. Esperá " + seconds + " segundos.");
        builder.setCancelable(false);
        builder.setPositiveButton("Esperar", (dialog, which) -> {
            getWindow().getDecorView().postDelayed(this::showPinPrompt, seconds * 1000L);
        });
        builder.setNegativeButton("Salir", (dialog, which) -> finishAffinity());
        builder.show();
    }

    private void showExitOrRetryDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("¿Salir de la app?");
        builder.setMessage("No se pudo verificar tu identidad");
        builder.setPositiveButton("Reintentar", (dialog, which) -> showAppLock());
        builder.setNegativeButton("Salir", (dialog, which) -> finishAffinity());
        builder.setCancelable(false);
        builder.show();
    }

    private void unlockApp() {
        appUnlocked = true;
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().setVisibility(View.VISIBLE);
        });
    }

    private boolean verifyPin(String pin) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String storedHash = prefs.getString(KEY_PIN_HASH, null);
        if (storedHash == null || pin == null) return false;
        return storedHash.equals(sha256(pin));
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
