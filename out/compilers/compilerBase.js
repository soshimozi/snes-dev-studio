"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerBase = void 0;
const vscode = require("vscode");
const path = require("path");
const application = require("../application");
const filesystem = require("../filesystem");
const execute = require("../execute");
class CompilerBase {
    constructor(id, name, extensions, compiledExtensions, folderOrPath, emulator) {
        // Features
        this.IsRunning = false;
        // Note: these need to be in reverse order compared to how they are read
        this.DebuggerExtensions = new Map([["-s", ".sym"], ["-l", ".lst"]]);
        this.CustomFolderOrPath = false;
        this.FolderOrPath = "";
        this.Args = "";
        this.Emulator = "";
        this.FileName = "";
        this.CompiledSubFolder = "";
        this.CompiledSubFolderName = "bin";
        this.GenerateDebuggerFiles = false;
        this.CleanUpCompilationFiles = false;
        this.WorkspaceFolder = "";
        this.Id = id;
        this.Name = name;
        this.Extensions = extensions;
        this.CompiledExtensions = compiledExtensions;
        this.DefaultFolderOrPath = folderOrPath;
        this.DefaultEmulator = emulator;
    }
    dispose() {
        console.log('debugger:CompilerBase.dispose');
    }
    BuildGameAsync(document) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set
            this.Document = document;
            // Initialise
            let result = yield this.InitialiseAsync();
            if (!result) {
                return false;
            }
            // Execute
            return yield this.ExecuteCompilerAsync();
        });
    }
    BuildGameAndRunAsync(document) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Process
            let result = yield this.BuildGameAsync(document);
            if (!result) {
                return false;
            }
            // Does compiler have/use an emulator?
            if (this.Emulator === '') {
                return true;
            }
            try {
                // Get emulator
                for (var _b = __asyncValues(application.Emulators), _c; _c = yield _b.next(), !_c.done;) {
                    let emulator = _c.value;
                    if (emulator.Id === this.Emulator) {
                        // Note: first extension should be the one which is to be launched
                        let compiledFileName = `${this.FileName}${this.CompiledExtensions[0]}`;
                        return yield emulator.RunGameAsync(path.join(this.CompiledSubFolder, compiledFileName));
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Not found
            application.WriteToCompilerTerminal(`Unable to find emulator '${this.Emulator}' to launch game.`);
            return false;
        });
    }
    InitialiseAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:CompilerBase.InitialiseAsync');
            // Prepare
            let result = true;
            // (Re)load
            // It appears you need to reload this each time incase of change
            this.Configuration = application.GetConfiguration();
            // Clear output content?
            // Note: need to do this here otherwise otuput from configuration is lost
            if (this.Configuration.get(`editor.clearPreviousOutput`)) {
                application.CompilerOutputChannel.clear();
            }
            // Already running?
            if (this.IsRunning) {
                // Notify
                application.WriteToCompilerTerminal(`The ${this.Name} compiler is already running!  If you need to cancel the compilation process use the 'ads: Kill build process' option from the Command Palette.`);
                return false;
            }
            // Configuration
            result = yield this.LoadConfigurationAsync();
            if (!result) {
                return false;
            }
            // Activate output window?
            if (!this.Configuration.get(`editor.preserveCodeEditorFocus`)) {
                application.CompilerOutputChannel.show();
            }
            // Save files?
            if (this.Configuration.get(`editor.saveAllFilesBeforeRun`)) {
                result = yield vscode.workspace.saveAll();
            }
            else if (this.Configuration.get(`editor.saveFileBeforeRun`)) {
                if (this.Document) {
                    result = yield this.Document.save();
                }
            }
            if (!result) {
                return false;
            }
            // Remove old debugger files before build
            yield this.RemoveDebuggerFilesAsync(this.CompiledSubFolder);
            //  Result
            return true;
        });
    }
    RepairFilePermissionsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    LoadConfigurationAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugge:CompilerBase.LoadConfigurationAsync');
            // Reset
            this.CustomFolderOrPath = false;
            this.FolderOrPath = this.DefaultFolderOrPath;
            this.Args = "";
            this.Emulator = this.DefaultEmulator;
            // System
            this.WorkspaceFolder = this.GetWorkspaceFolder();
            this.FileName = path.basename(this.Document.fileName);
            // Validate compilers
            let defaultCompiler = this.Configuration.get(`compiler.${this.Id}.defaultCompiler`);
            // Compiler (Other)
            this.Args = this.Configuration.get(`compiler.${this.Id}.args`, "");
            // Compilation
            this.GenerateDebuggerFiles = this.Configuration.get(`compiler.options.generateDebuggerFiles`, true);
            this.CleanUpCompilationFiles = this.Configuration.get(`compiler.options.cleanupCompilationsFiles`, true);
            // System
            this.CompiledSubFolder = path.join(this.WorkspaceFolder, this.CompiledSubFolder);
            // Result
            return true;
        });
    }
    VerifyCompiledFileSizeAsync() {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:CompilerBase.VerifyCompiledSize');
            // Verify created files(s)
            application.WriteToCompilerTerminal(`Verifying compiled file(s)...`);
            try {
                for (var _b = __asyncValues(this.CompiledExtensions), _c; _c = yield _b.next(), !_c.done;) {
                    let extension = _c.value;
                    // Prepare
                    let compiledFileName = `${this.FileName}${extension}`;
                    let compiledFilePath = path.join(this.WorkspaceFolder, compiledFileName);
                    // Validate
                    let fileStats = yield filesystem.GetFileStatsAsync(compiledFilePath);
                    if (fileStats && fileStats.size > 0) {
                        continue;
                    }
                    // Failed
                    application.WriteToCompilerTerminal(`ERROR: Failed to create compiled file '${compiledFileName}'.`);
                    return false;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // Result
            return true;
        });
    }
    MoveFilesToBinFolderAsync() {
        var e_3, _a, e_4, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:CompilerBase.MovefilesToBinFolder');
            // Create directory?
            let result = yield filesystem.MkDirAsync(this.CompiledSubFolder);
            if (!result) {
                // Notify
                application.WriteToCompilerTerminal(`ERROR: Failed to create folder '${this.CompiledSubFolderName}'`);
                return false;
            }
            // Move compiled file(s)
            application.WriteToCompilerTerminal(`MOving compiled file(s) to '${this.CompiledSubFolderName}' folder...`);
            try {
                for (var _c = __asyncValues(this.CompiledExtensions), _d; _d = yield _c.next(), !_d.done;) {
                    let extension = _d.value;
                    // Prepare
                    let compiledFileName = `${this.FileName}${extension}`;
                    let oldPath = path.join(this.WorkspaceFolder, compiledFileName);
                    let newPath = path.join(this.CompiledSubFolderName, compiledFileName);
                    // Move compiled file
                    result = yield filesystem.RenameFileAsync(oldPath, newPath);
                    if (!result) {
                        // Notify
                        application.WriteToCompilerTerminal(`ERROR: Failed tomove file from '${compiledFileName}' to ${this.CompiledSubFolderName}`);
                        return false;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_3) throw e_3.error; }
            }
            // Process?
            if (this.GenerateDebuggerFiles) {
                // Move all debugger files?
                application.WriteToCompilerTerminal(`Moving debugger file(s) to '${this.CompiledSubFolderName}'`);
                try {
                    for (var _e = __asyncValues(this.DebuggerExtensions), _f; _f = yield _e.next(), !_f.done;) {
                        let [arg, extension] = _f.value;
                        // Prepare
                        let debuggerFile = `${this.FileName}${extension}`;
                        let oldPath = path.join(this.WorkspaceFolder, debuggerFile);
                        let newPath = path.join(this.CompiledSubFolderName, debuggerFile);
                        // Move compiled file?
                        if (yield filesystem.FileExistsAsync(oldPath)) {
                            result = yield filesystem.RenameFileAsync(oldPath, newPath);
                            if (!result) {
                                // Notify
                                application.WriteToCompilerTerminal(`ERROR: Failed to move file '${debuggerFile}' to '${this.CompiledSubFolderName}' folder`);
                            }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            // Return
            return true;
        });
    }
    RemoveDebuggerFilesAsync(folder) {
        var e_5, _a;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:CompilerBase.RemoveDebuggerFilesAsync');
            try {
                // Process
                for (var _b = __asyncValues(this.DebuggerExtensions), _c; _c = yield _b.next(), !_c.done;) {
                    let [arg, extension] = _c.value;
                    // Prepare
                    let debuggerFile = `${this.FileName}${extension}`;
                    let debuggerFilePath = path.join(folder, debuggerFile);
                    // Process
                    if (yield filesystem.FileExistsAsync(debuggerFilePath)) {
                        yield filesystem.RemoveFileAsync(debuggerFilePath);
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
            // Result
            return true;
        });
    }
    Kill() {
        console.log('debugger:CompilerBase.Kill');
        // Validate
        if (this.IsRunning) {
            // Notify
            application.WriteToCompilerTerminal(`Attempting to kill running ${this.Name} compilation process...`);
            // Process
            this.IsRunning = false;
            execute.KillSpawnProcess();
        }
    }
    GetWorkspaceFolder() {
        console.log('debugger:CompilerBase.getWorkspaceFolder');
        // Issue: Get actual document first as the workspace
        //        is not the best option when file is in a subfolder
        //        of the chosen workspace    
        // Document
        if (this.Document) {
            return path.dirname(this.Document.fileName);
        }
        // Workspace (last resort)
        if (vscode.workspace.workspaceFolders) {
            if (this.Document) {
                let workspaceFolder = vscode.workspace.getWorkspaceFolder(this.Document.uri);
                if (workspaceFolder) {
                    return workspaceFolder.uri.fsPath;
                }
            }
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        return "";
    }
}
exports.CompilerBase = CompilerBase;
//# sourceMappingURL=compilerBase.js.map