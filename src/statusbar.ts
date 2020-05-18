"use strict";
import * as vscode from 'vscode';
import * as application from './application';

class StatusBar {
    constructor() {
        this.Initialize();
    }

    private Initialize(): void {
        // Prepare
        let configuration = application.GetConfiguration();

        // Prepare
        let command = (configuration.get<string>('editor.statusBarCommands', 'Full'));
        if (command === "None") { return; }

        // Spacer
        let itemOptions = [
            { text: `   `},
        ];

        itemOptions.forEach(option => this.createItem(option));

        // Name and version
        if (command === "Full") {
            let itemOptions = [
                { text: `${application.DisplayName} (v${application.Version})`},
            ];
            itemOptions.forEach(option => this.createItem(option));
        }

        // Buttons
        if (command === "Full" || command === "Minimum") {
            let itemOptions = [
                { tooltip: 'Welcome', text: '$(home)', command: 'extension.openWelcomePage'},
                { tooltip: 'Sprite Editor', text: '$(screen-normal)', command: 'extension.openSpriteEditorPage'},
                { tooltip: 'Compile soiurce code (Shift+F5)', text: '$(triangle-right)', command: 'extension.buildGameAndRun'}
            ];
            itemOptions.forEach(option => this.createItem(option));
        }
    }

    private createItem(option:any, alignment?: vscode.StatusBarAlignment | undefined, priority?: number | undefined): void {
        // Create
        let item = vscode.window.createStatusBarItem(alignment, priority);
        item.command = option.command;
        item.text = option.text;
        item.tooltip = option.tooltip;

        // Display
        item.show();
    }
}

const statusbar = new StatusBar();
export default statusbar;