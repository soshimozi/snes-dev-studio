"use strict";
import * as vscode from 'vscode';
import * as path from 'path';
import * as filesystem from '../filesystem';
import * as application from '../application';
import opn = require('open');

export class WelcomePage implements vscode.Disposable {
    protected currentPanel: vscode.WebviewPanel | undefined;

    public dispose(): void {

    }

    public async openPage(context: vscode.ExtensionContext) {
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
        } else {
            // Create
            this.currentPanel = vscode.window.createWebviewPanel(
                'webpage',
                `${application.DisplayName}`,
                columnToShowIn || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(contentPath)]
                }
            );

            // Content
            let startPagePath = vscode.Uri.file(path.join(contentPath.toString(), 'index.html'));
            let content = await filesystem.ReadFileAsync(startPagePath.fsPath);
            let nonce = this.getNonce();

            // Script
            let scriptJsPath = vscode.Uri.file(path.join(contentPath.toString(), 'script.js'));
            let scriptJsUri = scriptJsPath.with({ scheme: 'vscode-resource'});

            // Style
            let styleCssPath = vscode.Uri.file(path.join(contentPath.toString(), 'style.css'));
            let styleCssUri = styleCssPath.with({ scheme: 'vscode-resource'});

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
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }            
    
        return text;
    }    

    private replaceContentTag(content: string, tag: string, tagContent: any) {
        tag = `%${tag}%`;
        return content.replace(new RegExp(tag, 'g'), tagContent);
    }
}



