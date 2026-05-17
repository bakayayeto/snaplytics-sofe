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

function run(label, command, cwd, shell = true) {
  console.error(`\n>> ${label}\n`);
  const r = spawnSync(command, {
    cwd,
    shell,
    stdio: "inherit",
    env: { ...process.env },
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

run("npm install", "npm install", tempProject);

const gradlew =
  process.platform === "win32"
    ? "gradlew.bat assembleRelease --no-daemon"
    : "./gradlew assembleRelease --no-daemon";
run("Gradle assembleRelease", gradlew, path.join(tempProject, "android"));

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
