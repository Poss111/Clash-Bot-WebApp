import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

let win: BrowserWindow;

function createWindow() {
  win = new BrowserWindow({ width: 800, height: 600 });

  win.loadFile(`../../dist/Clash-Bot/index.html`);

  win.webContents.openDevTools();

  win.on("closed", () => {
    win.destroy();
  });
}

app.on("ready", createWindow);

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});


function getImages() {
  const cwd = process.cwd();
  fs.readdir('.', {withFileTypes: true}, (err, files) => {
    if (!err) {
      const re = /(?:\.([^.]+))?$/;
      const images = files
        .filter(file => {
          let response = re.exec(file.name);
          if (response) {
            return file.isFile() && ['jpg', 'png'].includes(response[1])
          }
          return false;
        })
        .map(file => `file://${cwd}/${file.name}`);
      win.webContents.send("getImagesResponse", images);
    }
  });
}

function isRoot() {
  return path.parse(process.cwd()).root == process.cwd();
}

function getDirectory() {
  fs.readdir('.', {withFileTypes: true}, (err, files) => {
    if (!err) {
      const directories = files
        .filter(file => file.isDirectory())
        .map(file => file.name);
      if (!isRoot()) {
        directories.unshift('..');
      }
      win.webContents.send("getDirectoryResponse", directories);
    }
  });
}

ipcMain.on("navigateDirectory", (event, path) => {
  process.chdir(path);
  getImages();
  getDirectory();
});
