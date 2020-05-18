"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConfiguration = exports.WriteToCompilerTerminal = exports.CompilerOutputChannel = exports.ChangeLogUri = exports.PreferencesSettingsExtensionPath = exports.Description = exports.DisplayName = exports.Version = exports.Publisher = exports.Name = exports.Path = exports.Id = exports.Is64Bit = exports.Is32Bit = exports.IsMacOS = exports.IsLinux = exports.IsWindows = exports.OSArch = exports.OSPlatform = void 0;
const vscode = require("vscode");
const os = require("os");
// -------------------------------------------------------------------------------------
// Operating System
// -------------------------------------------------------------------------------------
exports.OSPlatform = os.platform();
exports.OSArch = os.arch();
exports.IsWindows = (os.platform() === 'win32');
exports.IsLinux = (os.platform() === 'linux');
exports.IsMacOS = (os.platform() === 'darwin');
exports.Is32Bit = (os.arch() === 'x32');
exports.Is64Bit = (os.arch() === 'x64');
// -------------------------------------------------------------------------------------
// Extension
// -------------------------------------------------------------------------------------
exports.Id = "bitwisemobile-games.snes-dev-studio";
exports.Path = vscode.extensions.getExtension(exports.Id).extensionPath;
exports.Name = vscode.extensions.getExtension(exports.Id).packageJSON.name;
exports.Publisher = vscode.extensions.getExtension(exports.Id).packageJSON.publisher;
exports.Version = vscode.extensions.getExtension(exports.Id).packageJSON.version;
exports.DisplayName = vscode.extensions.getExtension(exports.Id).packageJSON.displayName;
exports.Description = vscode.extensions.getExtension(exports.Id).packageJSON.description;
exports.PreferencesSettingsExtensionPath = `${(exports.IsMacOS ? "Code" : "File")} -> Preferences -> Settings -> Extensions -> ${exports.DisplayName}`;
exports.ChangeLogUri = vscode.Uri.parse(`https://marketplace.visualstudio.com/items/${exports.Id}/changelog`);
exports.CompilerOutputChannel = vscode.window.createOutputChannel("Compiler");
function WriteToCompilerTerminal(message, writeToLog = false) {
    exports.CompilerOutputChannel.appendLine(message);
    if (writeToLog) {
        console.log(`debugger:${message}`);
    }
}
exports.WriteToCompilerTerminal = WriteToCompilerTerminal;
function GetConfiguration() {
    return vscode.workspace.getConfiguration(exports.Name, null);
}
exports.GetConfiguration = GetConfiguration;
//# sourceMappingURL=application.js.map