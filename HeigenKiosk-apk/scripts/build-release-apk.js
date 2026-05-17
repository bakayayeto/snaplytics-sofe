/**
 * Full release APK build from a temp directory (paths with "!" break Kotlin/Android tooling).
 * Copies project → %LOCALAPPDATA%\Temp\heigen-kiosk-apk-build, npm install, gradlew assembleRelease,
 * copies HeigenStudioKiosk-release.apk back to ./dist/
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const tempRoot = path.join(
  process.env.LOCALAPPDATA || process.env.TEMP || "/tmp",
  "heigen-kiosk-apk-build",
);
const tempProject = path.join(tempRoot, "HeigenKiosk-apk");

/** RN/AGP 8.2 needs JDK 17; Gradle on JDK 22+ breaks com.facebook.react.settings (error shows Java version e.g. > 25.0.2). */
function tryJdk17Home(candidateHome) {
  if (!candidateHome || !fs.existsSync(candidateHome)) {
    return null;
  }
  const java =
    process.platform === "win32"
      ? path.join(candidateHome, "bin", "java.exe")
      : path.join(candidateHome, "bin", "java");
  if (!fs.existsSync(java)) {
    return null;
  }
  const r = spawnSync(java, ["-version"], { encoding: "utf8" });
  const out = `${r.stderr || ""}${r.stdout || ""}`;
  return /version "17[\d.]*/.test(out) ? candidateHome : null;
}

function findJdk17Home() {
  const fromEnv = tryJdk17Home(process.env.JAVA_HOME);
  if (fromEnv) {
    return fromEnv;
  }
  if (process.platform === "win32" && process.env.ProgramFiles) {
    const adoptium = path.join(process.env.ProgramFiles, "Eclipse Adoptium");
    if (fs.existsSync(adoptium)) {
      const dirs = fs
        .readdirSync(adoptium)
        .filter((d) => /^jdk-17/i.test(d))
        .sort();
      for (let i = dirs.length - 1; i >= 0; i--) {
        const h = tryJdk17Home(path.join(adoptium, dirs[i]));
        if (h) {
          return h;
        }
      }
    }
  }
  if (process.platform === "darwin") {
    const r = spawnSync("/usr/libexec/java_home", ["-v", "17"], {
      encoding: "utf8",
    });
    if (r.status === 0) {
      const home = (r.stdout || "").trim();
      if (home) {
        const h = tryJdk17Home(home);
        if (h) {
          return h;
        }
      }
    }
  }
  return null;
}

/** Windows uses `Path`; Unix uses `PATH`. Prepend dir without dropping the rest. */
function prependToPathEnv(env, dir) {
  const sep = process.platform === "win32" ? ";" : ":";
  const keys = Object.keys(env);
  const pathKey = keys.find((k) => k.toLowerCase() === "path") || "PATH";
  env[pathKey] = `${dir}${sep}${env[pathKey] || ""}`;
}

function envWithJdk17(baseEnv = process.env) {
  const jdk17 = findJdk17Home();
  if (!jdk17) {
    console.error(
      [
        "JDK 17 not found (Gradle needs it; Java 21+ often breaks RN 0.74 plugin resolution).",
        "Install Temurin 17, or set JAVA_HOME to a JDK 17 folder, then retry.",
        'PowerShell: $env:JAVA_HOME = "C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot"',
      ].join("\n"),
    );
    process.exit(1);
  }
  const out = { ...baseEnv, JAVA_HOME: jdk17 };
  prependToPathEnv(out, path.join(jdk17, "bin"));
  if (baseEnv.JAVA_HOME !== jdk17) {
    console.error(`Using JDK 17 for this step: ${jdk17}`);
  }
  return out;
}

function resolveAndroidSdkRoot() {
  const fromEnv =
    process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const guessed = path.join(
      process.env.LOCALAPPDATA,
      "Android",
      "Sdk",
    );
    if (fs.existsSync(guessed)) {
      return guessed;
    }
  }
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const unixGuess = path.join(home, "Android", "Sdk");
    if (fs.existsSync(unixGuess)) {
      return unixGuess;
    }
  }
  return null;
}

/** Expo/RN Gradle requires sdk.dir in android/local.properties (or ANDROID_HOME at configure time). */
function ensureAndroidSdkForTempBuild() {
  const androidDir = path.join(tempProject, "android");
  const srcLp = path.join(projectRoot, "android", "local.properties");
  const dstLp = path.join(androidDir, "local.properties");

  if (fs.existsSync(srcLp)) {
    fs.copyFileSync(srcLp, dstLp);
    console.error("Copied android/local.properties into temp build tree.");
    return;
  }

  const sdkRoot = resolveAndroidSdkRoot();
  if (!sdkRoot) {
    console.error(
      [
        "Android SDK not found.",
        "Fix one of:",
        "  1) Install Android Studio SDK (default path on Windows: %LOCALAPPDATA%\\Android\\Sdk)",
        "  2) Set ANDROID_HOME or ANDROID_SDK_ROOT to the SDK root, then re-run this script",
        "  3) Create HeigenKiosk-apk/android/local.properties with one line:",
        "       sdk.dir=C:\\\\Users\\\\You\\\\AppData\\\\Local\\\\Android\\\\Sdk",
        "     (use your path; forward slashes also work: sdk.dir=C:/Users/.../Android/Sdk)",
      ].join("\n"),
    );
    process.exit(1);
  }

  const sdkDirProp = sdkRoot.replace(/\\/g, "/");
  fs.writeFileSync(dstLp, `sdk.dir=${sdkDirProp}\n`, "utf8");
  console.error(
    `Wrote android/local.properties (sdk.dir) for temp build:\n  ${sdkDirProp}`,
  );
}

/** Repo .gitignore has *.keystore — debug.keystore is not committed. Gradle release uses it for signing. */
function ensureDebugKeystore() {
  const appDir = path.join(tempProject, "android", "app");
  const dest = path.join(appDir, "debug.keystore");
  const src = path.join(projectRoot, "android", "app", "debug.keystore");
  if (fs.existsSync(dest)) {
    return;
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.error("Copied android/app/debug.keystore into temp build tree.");
    return;
  }
  const jdk17 = findJdk17Home();
  const javaHome = jdk17 || process.env.JAVA_HOME;
  const keytool =
    javaHome && process.platform === "win32"
      ? path.join(javaHome, "bin", "keytool.exe")
      : javaHome
        ? path.join(javaHome, "bin", "keytool")
        : "keytool";
  const args = [
    "-genkey",
    "-v",
    "-keystore",
    dest,
    "-storepass",
    "android",
    "-alias",
    "androiddebugkey",
    "-keypass",
    "android",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-dname",
    "CN=Android Debug,O=Android,C=US",
  ];
  console.error(
    "\n>> Creating android/app/debug.keystore (not in git — *.keystore ignored)\n",
  );
  const r = spawnSync(keytool, args, {
    stdio: "inherit",
    env: jdk17 ? envWithJdk17() : { ...process.env },
    shell: false,
  });
  if (r.status !== 0) {
    console.error(
      [
        "keytool failed — release APK needs a keystore.",
        "Set JAVA_HOME to JDK 17, or create HeigenKiosk-apk/android/app/debug.keystore manually:",
        '  keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"',
        "(run from android/app directory)",
      ].join("\n"),
    );
    process.exit(r.status ?? 1);
  }
  console.error("Created debug.keystore for this temp build.");
}

function run(label, command, cwd, shell = true, env = process.env) {
  console.error(`\n>> ${label}\n`);
  const r = spawnSync(command, {
    cwd,
    shell,
    stdio: "inherit",
    env,
  });
  if (r.status !== 0) {
    console.error(`\nFailed: ${label} (exit ${r.status})\n`);
    process.exit(r.status ?? 1);
  }
}

fs.rmSync(tempProject, { recursive: true, force: true });
fs.mkdirSync(tempRoot, { recursive: true });

const robocopyCmd = `robocopy "${projectRoot}" "${tempProject}" /E /XD node_modules android\\.gradle android\\app\\build android\\build /NFL /NDL /NJH /NJS`;
const rc = spawnSync(robocopyCmd, { shell: true, encoding: "utf8" });
// Robocopy: 0 = nothing, 1-7 = success with copies, >=8 = error
if (rc.status != null && rc.status >= 8) {
  console.error("robocopy failed:", rc.status, rc.stderr || rc.stdout);
  process.exit(1);
}

const envSrc = path.join(projectRoot, ".env");
const envDst = path.join(tempProject, ".env");
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDst);
  console.error("Copied .env into temp build tree.");
} else {
  console.error(
    "No .env in project root — build continues; set EXPO_PUBLIC_SUPABASE_* in .env for embedded config.",
  );
}

ensureAndroidSdkForTempBuild();
ensureDebugKeystore();

run("npm install", "npm install", tempProject);

const gradlew =
  process.platform === "win32"
    ? "gradlew.bat assembleRelease --no-daemon"
    : "./gradlew assembleRelease --no-daemon";
run(
  "Gradle assembleRelease",
  gradlew,
  path.join(tempProject, "android"),
  true,
  envWithJdk17(),
);

const apkSrc = path.join(
  tempProject,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk",
);
if (!fs.existsSync(apkSrc)) {
  console.error("Release APK not found:\n ", apkSrc);
  process.exit(1);
}

const distDir = path.join(projectRoot, "dist");
const apkDest = path.join(distDir, "HeigenStudioKiosk-release.apk");
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(apkSrc, apkDest);
const abs = path.resolve(apkDest);
console.error("\n=== APK ready ===\n" + abs + "\n");
