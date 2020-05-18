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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowStartupMessagesAsync = exports.GetConfiguration = exports.ShowErrorPopup = exports.ShowInformationPopup = exports.ShowWarningPopup = exports.WriteToCompilerTerminal = exports.KillBuildGame = exports.BuildGameAndRunAsync = exports.BuildGameAsync = exports.Emulators = exports.Compilers = exports.CompilerOutputChannel = exports.ChangeLogUri = exports.PreferencesSettingsExtensionPath = exports.Description = exports.DisplayName = exports.Version = exports.Publisher = exports.Name = exports.Path = exports.Id = exports.Is64Bit = exports.Is32Bit = exports.IsMacOS = exports.IsLinux = exports.IsWindows = exports.OSArch = exports.OSPlatform = void 0;
const vscode = require("vscode");
const filesystem = require("./filesystem");
const os = require("os");
const wlaCompiler_1 = require("./compilers/wlaCompiler");
const bnesEmulator_1 = require("./emulators/bnesEmulator");
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
// -------------------------------------------------------------------------------------------
// Compilers
// Register compilers here and in order of preference
// -------------------------------------------------------------------------------------------
exports.Compilers = [
    new wlaCompiler_1.WlaCompiler()
];
// -------------------------------------------------------------------------------------------
// Compilers
// Register emulators here and in order of preference
// -------------------------------------------------------------------------------------------
exports.Emulators = [
    new bnesEmulator_1.BNESEmulator()
];
function BuildGameAsync(fileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get document
        let document = yield filesystem.GetDocumentAsync(fileUri);
        if (!document || document.uri.scheme !== "file") {
            return false;
        }
        // Find compiler
        let compiler = getChosenCompiler(document);
        if (compiler) {
            return yield compiler.BuildGameAsync(document);
        }
        // Result
        return false;
    });
}
exports.BuildGameAsync = BuildGameAsync;
function BuildGameAndRunAsync(fileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get document
        let document = yield filesystem.GetDocumentAsync(fileUri);
        if (!document || document.uri.scheme !== "file") {
            return false;
        }
        // Find compiler
        let compiler = getChosenCompiler(document);
        if (compiler) {
            return yield compiler.BuildGameAndRunAsync(document);
        }
        // Result
        return false;
    });
}
exports.BuildGameAndRunAsync = BuildGameAndRunAsync;
function KillBuildGame() {
    // Process all compilers
    for (let compiler of exports.Compilers) {
        if (compiler.IsRunning) {
            compiler.Kill();
        }
    }
}
exports.KillBuildGame = KillBuildGame;
function WriteToCompilerTerminal(message, writeToLog = false) {
    exports.CompilerOutputChannel.appendLine(message);
    if (writeToLog) {
        console.log(`debugger:${message}`);
    }
}
exports.WriteToCompilerTerminal = WriteToCompilerTerminal;
function ShowWarningPopup(message) {
    vscode.window.showWarningMessage(message);
}
exports.ShowWarningPopup = ShowWarningPopup;
function ShowInformationPopup(message) {
    vscode.window.showInformationMessage(message);
}
exports.ShowInformationPopup = ShowInformationPopup;
function ShowErrorPopup(message) {
    vscode.window.showErrorMessage(message);
}
exports.ShowErrorPopup = ShowErrorPopup;
function GetConfiguration() {
    return vscode.workspace.getConfiguration(exports.Name, null);
}
exports.GetConfiguration = GetConfiguration;
function getChosenCompiler(document) {
    // Prepare
    let configuration = GetConfiguration();
    // Find compiler (based on language of chosen file)
    for (let compiler of exports.Compilers) {
        if (compiler.Id === document.languageId) {
            return compiler;
        }
    }
    // Activate output window?
    if (configuration.get(`editor.preserveCodeEditorFocus`)) {
        exports.CompilerOutputChannel.show();
    }
    // Clear output content?
    if (configuration.get(`editor.clearPreviousOutput`)) {
        exports.CompilerOutputChannel.clear();
    }
    // Not found
    return undefined;
}
function ShowStartupMessagesAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        // Prepare
        let configuration = GetConfiguration();
        // Load settings
        let showNewVersionMessage = configuration.get(`application.configuration.showNewVersionMessage`);
        let latestVersion = configuration.get(`application.configuration.latestVersion`);
        // Process?
        if (!showNewVersionMessage || latestVersion === exports.Version) {
            return;
        }
        // Update latest version
        configuration.update(`application.configuration.latestVersion`, exports.Version, vscode.ConfigurationTarget.Global);
        // buttons
        let latestChanges = "Learn more about the latest changes";
        let dontShowMeThisMessage = "Don't show me this message again";
        // Show prompt
        yield vscode.window.showInformationMessage(`Welcome to the new version ${exports.DisplayName}`, latestChanges, dontShowMeThisMessage)
            .then(selection => {
            if (selection === undefined) {
                // Dismissed
            }
            else if (selection === latestChanges) {
                // Show changelog
                vscode.env.openExternal(exports.ChangeLogUri);
            }
            else if (selection === dontShowMeThisMessage) {
                // Disable
                configuration.update(`application.configuration.showNewVersionMessage`, false, vscode.ConfigurationTarget.Global);
            }
        });
    });
}
exports.ShowStartupMessagesAsync = ShowStartupMessagesAsync;
//# sourceMappingURL=application.js.map