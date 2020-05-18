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
exports.WelcomePage = void 0;
const vscode = require("vscode");
const path = require("path");
const filesystem = require("../filesystem");
const application = require("../application");
class WelcomePage {
    dispose() {
    }
    openPage(context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:WelcomePage.openPage');
            // Prepare
            let contentPath = path.join(context.extensionPath, 'out', 'content', 'pages', 'welcome');
            let columnToShowIn = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;
            //  Open or create panel?
            if (this.currentPanel) {
                // Open
                this.currentPanel.reveal(columnToShowIn);
            }
            else {
                // Create
                this.currentPanel = vscode.window.createWebviewPanel('webpage', `${application.DisplayName}`, columnToShowIn || vscode.ViewColumn.One, {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(contentPath)]
                });
                // Content
                let startPagePath = vscode.Uri.file(path.join(contentPath.toString(), 'index.html'));
                let content = yield filesystem.ReadFileAsync(startPagePath.fsPath);
                let nonce = this.getNonce();
                // Script
                let scriptJsPath = vscode.Uri.file(path.join(contentPath.toString(), 'script.js'));
                let scriptJsUri = scriptJsPath.with({ scheme: 'vscode-resource' });
                // Style
                let styleCssPath = vscode.Uri.file(path.join(contentPath.toString(), 'style.css'));
                let styleCssUri = styleCssPath.with({ scheme: 'vscode-resource' });
                // Update tags in content
                content = this.replaceContentTag(content, "APPDISPLAYNAME", application.DisplayName);
                content = this.replaceContentTag(content, "APPDESCRIPTION", application.Description);
                content = this.replaceContentTag(content, 'APPVERSION', application.Version);
                content = this.replaceContentTag(content, "NONCE", nonce);
                content = this.replaceContentTag(content, "SCRIPTJSURI", scriptJsUri);
                content = this.replaceContentTag(content, "STYLECSSURI", styleCssUri);
                // Set
                this.currentPanel.webview.html = content;
            }
        });
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    replaceContentTag(content, tag, tagContent) {
        tag = `%${tag}%`;
        return content.replace(new RegExp(tag, 'g'), tagContent);
    }
}
exports.WelcomePage = WelcomePage;
//# sourceMappingURL=welcome.js.map