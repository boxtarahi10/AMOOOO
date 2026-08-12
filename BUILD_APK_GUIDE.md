# راهنمای ساخت APK — ابومیرزا

## پیش‌نیازها
1. **Node.js** نسخه 18+ نصب باشه
2. **Android Studio** با Android SDK نصب باشه
3. **Java JDK 17** نصب باشه
4. متغیر محیطی `ANDROID_HOME` تنظیم باشه

## مراحل ساخت APK

### ۱. نصب وابستگی‌ها
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard
```

### ۲. حذف vite-plugin-singlefile (مهم!)
فایل `vite.config.ts` رو باز کن و خط `viteSingleFile()` رو از plugins حذف کن:

```ts
// vite.config.ts — نسخه بدون singlefile
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Optimize for mobile
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove all console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'levels': ['./src/data/levels.ts'],
          'dictionary': ['./src/data/dictionary.ts', './src/data/commonWords.ts'],
        },
      },
    },
  },
});
```

### ۳. بیلد وب
```bash
npm run build
```

### ۴. اضافه کردن پلتفرم اندروید
```bash
npx cap add android
npx cap sync
```

### ۵. تنظیمات اندروید (یکبار)
فایل `android/app/src/main/AndroidManifest.xml` رو باز کن و این ویژگی‌ها رو به `<application>` اضافه کن:
```xml
android:hardwareAccelerated="true"
android:usesCleartextTraffic="false"
```

فایل `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">ابومیرزا</string>
<string name="title_activity_main">ابومیرزا</string>
<string name="package_name">com.pixelprofix.abumirza</string>
```

### ۶. فشرده‌سازی تصاویر
قبل از sync، تصاویر رو فشرده کن:
```bash
# macOS/Linux
find dist -name "*.png" -exec pngquant --force --quality=65-80 --ext .png {} \;
find dist -name "*.jpg" -exec jpegoptim --max=75 {} \;
```
یا از ابزار آنلاین مثل TinyPNG استفاده کن.

### ۷. ساخت APK (Debug برای تست)
```bash
npx cap open android
```
در Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK در مسیر: `android/app/build/outputs/apk/debug/app-debug.apk`

### ۸. ساخت APK Release (برای انتشار)

#### ساخت Keystore (یکبار):
```bash
keytool -genkey -v -keystore abumirza-release.keystore -alias abumirza -keyalg RSA -keysize 2048 -validity 10000
```
رمز رو یادداشت کن!

#### تنظیم signing در Gradle:
فایل `android/app/build.gradle` → بخش `android {}`:
```gradle
signingConfigs {
    release {
        storeFile file('../../abumirza-release.keystore')
        storePassword 'YOUR_PASSWORD'
        keyAlias 'abumirza'
        keyPassword 'YOUR_PASSWORD'
        v1SigningEnabled true
        v2SigningEnabled true
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
}
```

#### بیلد Release:
```bash
cd android
./gradlew assembleRelease
```
APK نهایی: `android/app/build/outputs/apk/release/app-release.apk`

#### ساخت AAB (برای Google Play):
```bash
cd android
./gradlew bundleRelease
```
AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### ۹. تست نهایی
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## بهینه‌سازی‌های اعمال‌شده

| بهینه‌سازی | توضیح |
|------------|--------|
| حذف singlefile | فایل‌های جدا = لود موازی سریع‌تر |
| حذف blur() متحرک | GPU-friendly: فقط transform/opacity |
| کاهش orbs از ۱۸ به ۶ | کمتر DOM node متحرک |
| حذف gridfloor | یک لایه سنگین کمتر |
| React.memo | جلوگیری از re-render غیرضروری |
| will-change | هینت GPU برای انیمیشن‌ها |
| حذف console.log | کد تمیزتر و سریع‌تر |
| فشرده‌سازی تصاویر | حجم اپ کمتر |
| Code splitting | levels و dictionary جدا لود میشن |
| drop_console | حذف خودکار لاگ‌ها در production |

## حجم تخمینی APK نهایی
- وب بیلد: ~300-400 KB (JS+CSS بدون تصاویر)
- تصاویر فشرده: ~200-300 KB
- APK نهایی: **~5-8 مگابایت** (با WebView runtime)
