"use strict";

import { app, protocol, BrowserWindow, ipcMain, dialog } from "electron";
import {
  createProtocol,
  installVueDevtools,
  /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
import AppStore from "./models/AppStore";
import fs, { Dirent } from "fs";
import path from "path";
import trash from "trash";
import IpcResponse from "./models/IpcResponse";
import { configure, getLogger } from "log4js";
import AppConfig from "./models/AppConfig";

configure(AppConfig.LoggerConfigFile);
const logger = getLogger();

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

process.on("uncaughtException", function(err) {
  logger.error("uncaughtException 予期しないエラー");
  logger.error(err);
  logger.error(err.stack);
  //app.quit();
});

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    x: AppStore.instance.get("window.x"),
    y: AppStore.instance.get("window.y"),
    width: AppStore.instance.get("window.width", 800),
    height: AppStore.instance.get("window.height", 600),
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
      //nodeIntegration: true,
    },
    title: AppConfig.AppName,
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("close", () => {
    AppStore.instance.set("window.x", win!.getPosition()[0]);
    AppStore.instance.set("window.y", win!.getPosition()[1]);
    AppStore.instance.set("window.height", win!.getSize()[1]);
    AppStore.instance.set("window.width", win!.getSize()[0]);
  });

  win.on("closed", () => {
    win = null;
  });

  win.setMenuBarVisibility(false); // menuバー消す
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    logger.info("exit", AppConfig.AppName);
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools();
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

ipcMain.handle("ready", (event, data) => {
  // なんか上書きされるのでここで再設定
  win!.setTitle(AppConfig.AppName);
  logger.info("started", AppConfig.AppName);
});

ipcMain.handle("setStore", (event, data) => {
  AppStore.instance.set(data);
});

ipcMain.handle("getStore", (event, key) => {
  return AppStore.instance.get(key);
});

ipcMain.handle("openDialogDirectory", (event, data) => {
  return dialog
    .showOpenDialog(win!, {
      properties: ["openDirectory"],
    })
    .then(ret => {
      return ret.filePaths[0];
    });
});

ipcMain.handle("searchDirectory", async (event, dirpath) => {
  // フォルダ存在チェック
  try {
    const dirstats = await fs.promises.stat(dirpath);
    if (!dirstats.isDirectory()) throw new Error("not directory");
  } catch (e) {
    return new IpcResponse(e);
  }

  // 検索時にパスを保存
  AppStore.instance.set("searchDirectory", dirpath);

  const dirents = await fs.promises.readdir(dirpath, { withFileTypes: true });
  return new IpcResponse(
    dirents.filter(dirent => {
      if (!dirent.isDirectory()) return false;
      const filepath = path.join(dirpath, dirent.name);
      const files = fs.readdirSync(filepath);
      return files.length == 0;
    })
  );
});

ipcMain.handle("deleteDirectory", async (event, dirPath, directories: string[]) => {
  const succesDirectories: string[] = [];

  for (const d of directories) {
    const dirfullpath = path.join(dirPath, d);
    await trash(dirfullpath)
      .then(() => {
        succesDirectories.push(d);
      })
      .catch(() => {
        logger.error("error trash directory.", dirfullpath);
      });
  }

  return succesDirectories;
});
