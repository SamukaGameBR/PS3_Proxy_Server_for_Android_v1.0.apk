package com.dadi590.ps3proxyserverforandroid;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;

public class MainActivity extends AppCompatActivity {
    public static final String ACTION_STATUS = "com.dadi590.ps3proxy.STATUS";

    private TextView txtStatus;
    private TextView txtLogs;
    private EditText editIp;
    private EditText editPort;
    private Button btnToggle;

    private final BroadcastReceiver statusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            updateUi();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        txtStatus = findViewById(R.id.txt_status);
        txtLogs = findViewById(R.id.txt_logs);
        editIp = findViewById(R.id.edit_ip);
        editPort = findViewById(R.id.edit_port);
        btnToggle = findViewById(R.id.btn_toggle);
        Button btnUpdateIp = findViewById(R.id.btn_update_ip);

        editIp.setText(getLocalIpAddress());

        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        101
                );
            }
        }

        btnUpdateIp.setOnClickListener(v -> editIp.setText(getLocalIpAddress()));

        btnToggle.setOnClickListener(v -> {
            if (ProxyServerService.isRunning) {
                Intent stopIntent = new Intent(this, ProxyServerService.class);
                stopIntent.setAction(ProxyServerService.ACTION_STOP);
                startService(stopIntent);
                return;
            }

            int port;
            try {
                port = Integer.parseInt(editPort.getText().toString().trim());
            } catch (NumberFormatException e) {
                port = -1;
            }
            if (port < 1024 || port > 65535) {
                Toast.makeText(this, R.string.invalid_port, Toast.LENGTH_LONG).show();
                return;
            }

            String ip = editIp.getText().toString().trim();
            if (ip.isEmpty()) {
                ip = "0.0.0.0";
            }

            Intent startIntent = new Intent(this, ProxyServerService.class);
            startIntent.setAction(ProxyServerService.ACTION_START);
            startIntent.putExtra("ip", ip);
            startIntent.putExtra("port", port);
            ContextCompat.startForegroundService(this, startIntent);
        });

        updateUi();
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter(ACTION_STATUS);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statusReceiver, filter);
        }
        updateUi();
    }

    @Override
    protected void onPause() {
        super.onPause();
        unregisterReceiver(statusReceiver);
    }

    private void updateUi() {
        boolean running = ProxyServerService.isRunning;
        txtStatus.setText(running ? R.string.status_on : R.string.status_off);
        txtStatus.setTextColor(running ? 0xFF008A05 : 0xFFCC0000);
        btnToggle.setText(running ? R.string.btn_stop : R.string.btn_start);
        txtLogs.setText(ProxyServerService.getLogsText());
    }

    private String getLocalIpAddress() {
        try {
            for (NetworkInterface nif : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                for (InetAddress addr : Collections.list(nif.getInetAddresses())) {
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }
}
