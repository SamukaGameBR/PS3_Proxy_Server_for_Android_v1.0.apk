# Servidor Proxy PS3 para Android (Android 4.0.3 até Android 17)

Este diretório contém a estrutura completa do projeto Gradle pronta para abrir no **Android Studio** e gerar o arquivo `.apk`.

## Compatibilidade configurada
- `minSdk = 15` (Android 4.0.3 Ice Cream Sandwich)
- `targetSdk = 35`
- `compileSdk = 36` (compatível com Android 15, 16 e preview do Android 17)
- `MultiDex` e `AppCompat 1.6.1` para suportar dispositivos antigos (Android 4.x) e modernos (Android 14–17)

## Como gerar o `.apk` no Android Studio
1. Copie a pasta `android-studio-project` para o seu computador.
2. Abra o **Android Studio** e clique em **File > Open...** selecionando a pasta `android-studio-project`.
3. Aguarde a sincronização do Gradle terminar.
4. No menu superior, clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Ao concluir, clique em **locate** na notificação para encontrar o arquivo `app-debug.apk` pronto para instalar no Android.
