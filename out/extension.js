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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const application = require("./application");
const welcome_1 = require("./pages/welcome");
require("./statusbar");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('activate!');
        // Pages
        let welcomePage = new welcome_1.WelcomePage();
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        console.log(`Extension ${application.DisplayName} (${application.Version}) is now active!`);
        ;
        console.log(`- Installation path: '${application.Path}'`);
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with registerCommand
        // The commandId parameter must match the command field in package.json
        // Welcome
        const openWelcomePage = vscode.commands.registerCommand('extension.openWelcomePage', () => {
            console.log('User activated command "extension.openWelcomePage"');
            welcomePage.openPage(context);
        });
        // Build
        const buildGame = vscode.commands.registerCommand('extension.buildGame', (fileUri) => __awaiter(this, void 0, void 0, function* () {
            console.log('User activated command "extension.buildGame"');
            yield application.BuildGameAsync(fileUri);
        }));
        const buildGameAndRun = vscode.commands.registerCommand('extension.buildGameAndRun', (fileUri) => __awaiter(this, void 0, void 0, function* () {
            console.log('User activated command "extension.buildGameAndRun');
            yield application.BuildGameAndRunAsync(fileUri);
        }));
        const killBuildGame = vscode.commands.registerCommand('extension.killBuildGame', () => {
            console.log('User activated command "extension.killBuildGame"');
            application.KillBuildGame();
        });
        // Subscriptions (register)
        context.subscriptions.push(openWelcomePage);
        context.subscriptions.push(buildGame);
        context.subscriptions.push(buildGameAndRun);
        context.subscriptions.push(killBuildGame);
        // Show welcome messages
        yield application.ShowStartupMessagesAsync();
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map