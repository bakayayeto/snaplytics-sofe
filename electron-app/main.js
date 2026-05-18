const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

let djangoProcess;
let mainWindow;
let splashWindow;
let djangoReady = false;
const DJANGO_READY_TIMEOUT_MS = 2000;
/** Keep splash visible at least this long so the intro animation reads. */
const SPLASH_MIN_VISIBLE_MS = 900;
const DJANGO_READY_MARKERS = [
    "Starting development server",
    "Watching for file changes",
    "Quit the server with CTRL-BREAK",
];
const MAIN_WINDOW_BOUNDS = {
    width: 1400,
    height: 900,
};
const MAIN_WINDOW_WEB_PREFERENCES = {
    nodeIntegration: false,
    contextIsolation: true,
    /** Lets Web Audio / AudioContext run without a user gesture — booking chime otherwise silent until first click. */
    autoplayPolicy: "no-user-gesture-required",
};
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || "python";

let splashShownAt = 0;

// Used to avoid an arbitrary startup delay; resolved once Django reports it's ready.
let resolveDjangoReady;
const djangoReadyPromise = new Promise((resolve) => {
    resolveDjangoReady = resolve;
});

function startDjango() {
    // Path to Django project (Snaplytics backend - sibling folder)
    const snaplyticsRoot = path.join(__dirname, "../Snaplytics");
    djangoProcess = spawn(
        PYTHON_EXECUTABLE,
        [path.join(snaplyticsRoot, "manage.py"), "runserver"],
        { cwd: snaplyticsRoot },
    );

    djangoProcess.stdout.on("data", (data) => {
        const text = data.toString();
        console.log(`Django: ${text}`);

        // Django's default dev server logs include one of these lines when ready.
        // Keep this heuristic narrow to prevent false positives.
        if (
            !djangoReady &&
            DJANGO_READY_MARKERS.some((marker) => text.includes(marker))
        ) {
            djangoReady = true;
            resolveDjangoReady();
        }
    });

    djangoProcess.stderr.on("data", (data) => {
        console.error(`Django stderr: ${data.toString()}`);
    });

    djangoProcess.on("exit", (code, signal) => {
        console.log(`Django exited (code=${code}, signal=${signal || "none"})`);
    });
}

function stopDjango() {
    if (djangoProcess && !djangoProcess.killed) {
        try {
            djangoProcess.kill();
        } catch {
            // Swallow errors if the process already exited.
        }
    }
}

function createSplashWindow() {
    splashShownAt = Date.now();
    splashWindow = new BrowserWindow({
        width: 580,
        height: 380,
        frame: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        backgroundColor: "#608291",
        alwaysOnTop: true,
        show: true,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    splashWindow.loadFile(path.join(__dirname, "splash.html"));
    splashWindow.on("closed", () => {
        splashWindow = null;
    });
}

let splashRevealScheduled = false;

function closeSplashAndShowMain() {
    if (splashRevealScheduled) return;
    splashRevealScheduled = true;
    const elapsed = Date.now() - splashShownAt;
    const pad = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.openDevTools(); // Remove in production
        }
    }, pad);
}

function createWindow() {
    splashRevealScheduled = false;
    mainWindow = new BrowserWindow({
        ...MAIN_WINDOW_BOUNDS,
        show: false,
        webPreferences: MAIN_WINDOW_WEB_PREFERENCES,
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));

    const finishSplash = () => closeSplashAndShowMain();
    mainWindow.webContents.once("did-finish-load", finishSplash);
    mainWindow.webContents.once("did-fail-load", finishSplash);

    // If anything goes wrong, never trap the user on splash forever.
    setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
            finishSplash();
        }
    }, 25000);
}

app.whenReady().then(() => {
    createSplashWindow();
    startDjango();

    // Wait for Django to be ready, but keep the existing max startup time behavior.
    // This avoids creating the window too early and removes unnecessary delay when Django starts faster.
    Promise.race([
        djangoReadyPromise,
        new Promise((resolve) => setTimeout(resolve, DJANGO_READY_TIMEOUT_MS)),
    ]).then(() => {
        createWindow();
    });
});

app.on("window-all-closed", () => {
    stopDjango();
    app.quit();
});

app.on("before-quit", () => {
    stopDjango();
});
