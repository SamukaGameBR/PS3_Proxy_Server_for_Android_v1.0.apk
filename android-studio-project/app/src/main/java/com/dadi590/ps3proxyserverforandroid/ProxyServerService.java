package com.dadi590.ps3proxyserverforandroid;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProxyServerService extends Service {
    public static final String ACTION_START = "START";
    public static final String ACTION_STOP = "STOP";
    private static final String CHANNEL_ID = "ps3_proxy_channel";
    private static final int NOTIF_ID = 1001;

    public static volatile boolean isRunning = false;
    private static final List<String> LOGS = new ArrayList<>();

    private ServerSocket serverSocket;
    private ExecutorService executor;

    public static synchronized void appendLog(String msg) {
        String ts = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
        LOGS.add("[" + ts + "] " + msg);
        if (LOGS.size() > 150) {
            LOGS.remove(0);
        }
    }

    public static synchronized String getLogsText() {
        StringBuilder sb = new StringBuilder();
        for (String line : LOGS) {
            sb.append(line).append('\n');
        }
        return sb.toString();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopProxy();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        String ip = intent != null ? intent.getStringExtra("ip") : "0.0.0.0";
        int port = intent != null ? intent.getIntExtra("port", 8080) : 8080;

        startForeground(NOTIF_ID, buildNotification(ip, port));
        startProxy(ip, port);
        return START_STICKY;
    }

    private Notification buildNotification(String ip, int port) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.notif_channel),
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.app_name))
                .setContentText(getString(R.string.notif_running) + " (" + ip + ":" + port + ")")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .build();
    }

    private void startProxy(String ip, int port) {
        stopProxy();
        executor = Executors.newCachedThreadPool();
        executor.execute(() -> {
            try {
                InetAddress bindAddr = "0.0.0.0".equals(ip) ? null : InetAddress.getByName(ip);
                serverSocket = new ServerSocket(port, 50, bindAddr);
                isRunning = true;
                appendLog("Servidor Proxy PS3 iniciado em " + ip + ":" + port);
                sendStatusBroadcast();

                while (isRunning && !serverSocket.isClosed()) {
                    Socket client = serverSocket.accept();
                    executor.execute(() -> handleClient(client));
                }
            } catch (IOException e) {
                appendLog("Servidor Proxy PS3 encerrado: " + e.getMessage());
            } finally {
                isRunning = false;
                sendStatusBroadcast();
            }
        });
    }

    private void stopProxy() {
        isRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {
            }
            serverSocket = null;
        }
        if (executor != null) {
            executor.shutdownNow();
            executor = null;
        }
        appendLog("Servidor Proxy PS3 parado.");
        sendStatusBroadcast();
    }

    private void sendStatusBroadcast() {
        Intent intent = new Intent(MainActivity.ACTION_STATUS);
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    private void handleClient(Socket client) {
        try (Socket c = client) {
            InputStream in = c.getInputStream();
            OutputStream out = c.getOutputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(in));
            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) return;
            String method = parts[0];
            String target = parts[1];

            String line;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                // Consume request headers
            }

            if ("CONNECT".equalsIgnoreCase(method)) {
                String[] hp = target.split(":");
                String host = hp[0];
                int port = hp.length > 1 ? Integer.parseInt(hp[1]) : 443;
                appendLog("HTTPS acessado -- https://" + target);
                sendStatusBroadcast();

                try (Socket remote = new Socket(host, port)) {
                    out.write("HTTP/1.1 200 Connection Established\r\n\r\n".getBytes());
                    out.flush();
                    Thread t1 = new Thread(() -> pipe(in, remote));
                    t1.start();
                    pipe(remote.getInputStream(), c);
                    t1.join();
                }
                return;
            }

            appendLog("HTTP acessado -- " + target);
            if (target.contains("ps3-updatelist.txt")) {
                String spoof = "# US\nDest=84;ImageVersion=00000000;SystemSoftwareVersion=9.9900;"
                        + "CDN=http://dus01.ps3.update.playstation.net/update/ps3/image/us/2023_0228_05fe32f5dc8c78acbcd84d36ee7fdc5b/PS3UPDAT.PUP;"
                        + "CDN_Timeout=30;\n";
                byte[] body = spoof.getBytes("UTF-8");
                out.write(("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: "
                        + body.length + "\r\n\r\n").getBytes());
                out.write(body);
                out.flush();
                appendLog("Arquivo ps3-updatelist.txt do PS3 redirecionado");
                sendStatusBroadcast();
                return;
            }

            URL url = new URL(target);
            int port = url.getPort() > 0 ? url.getPort() : 80;
            try (Socket remote = new Socket(url.getHost(), port)) {
                OutputStream rOut = remote.getOutputStream();
                String path = url.getPath().isEmpty() ? "/" : url.getPath();
                if (url.getQuery() != null) path += "?" + url.getQuery();
                rOut.write((method + " " + path + " HTTP/1.1\r\nHost: " + url.getHost() + "\r\nConnection: close\r\n\r\n").getBytes());
                rOut.flush();
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                InputStream rIn = remote.getInputStream();
                while ((n = rIn.read(buf)) != -1) {
                    buffer.write(buf, 0, n);
                }
                out.write(buffer.toByteArray());
                out.flush();
            }
        } catch (Exception ignored) {
        }
    }

    private void pipe(InputStream src, Socket dst) {
        try {
            OutputStream out = dst.getOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = src.read(buf)) != -1) {
                out.write(buf, 0, n);
                out.flush();
            }
        } catch (Exception ignored) {
        }
    }
}
