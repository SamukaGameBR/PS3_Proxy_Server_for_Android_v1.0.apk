plugins {
    id("com.android.application")
}

android {
    namespace = "com.dadi590.ps3proxyserverforandroid"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.dadi590.ps3proxyserverforandroid"
        minSdk = 15
        targetSdk = 35
        versionCode = 6
        versionName = "2.3-ptBR"
        multiDexEnabled = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.multidex:multidex:2.0.1")
    implementation("com.google.android.material:material:1.11.0")
}
