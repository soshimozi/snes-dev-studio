"use strict";
import * as vscode from 'vscode';
import * as filesystem from './filesystem';
const os = require("os");
import { CompilerBase } from './compilers/compilerBase';
import { WlaCompiler } from './compilers/wlaCompiler';
import { EmulatorBase } from './emulators/emulatorBase';
import { BNESEmulator } from './emulators/bnesEmulator';

// -------------------------------------------------------------------------------------
// Operating System
// -------------------------------------------------------------------------------------
export const OSPlatform: any = os.platform();
export const OSArch: any = os.arch();
export const IsWindows: boolean = (os.platform() === 'win32');
export const IsLinux: boolean = (os.platform() === 'linux');
export const IsMacOS: boolean = (os.platform() === 'darwin');
export const Is32Bit: boolean = (os.arch() === 'x32');
export const Is64Bit: boolean = (os.arch() === 'x64');

// -------------------------------------------------------------------------------------
// Extension
// -------------------------------------------------------------------------------------
export const Id = "bitwisemobile-games.snes-dev-studio";
export const Path: string = vscode.extensions.getExtension(Id)!.extensionPath;
export const Name: string = vscode.extensions.getExtension(Id)!.packageJSON.name;
export const Publisher: string = vscode.extensions.getExtension(Id)!.packageJSON.publisher;
export const Version: string = vscode.extensions.getExtension(Id)!.packageJSON.version;
export const DisplayName: string = vscode.extensions.getExtension(Id)!.packageJSON.displayName;
export const Description: string = vscode.extensions.getExtension(Id)!.packageJSON.description;
export const PreferencesSettingsExtensionPath: string = `${(IsMacOS ? "Code" : "File")} -> Preferences -> Settings -> Extensions -> ${DisplayName}`;
export const ChangeLogUri: vscode.Uri = vscode.Uri.parse(`https://marketplace.visualstudio.com/items/${Id}/changelog`);

export const CompilerOutputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("Compiler");

// -------------------------------------------------------------------------------------------
// Compilers
// Register compilers here and in order of preference
// -------------------------------------------------------------------------------------------
export const Compilers:CompilerBase[] = [
    new WlaCompiler()
];

// -------------------------------------------------------------------------------------------
// Compilers
// Register emulators here and in order of preference
// -------------------------------------------------------------------------------------------
export const Emulators:EmulatorBase[] = [
    new BNESEmulator()
];

export async function BuildGameAsync(fileUri: vscode.Uri): Promise<boolean> {
    // Get document
    let document = await filesystem.GetDocumentAsync(fileUri);
    if (!document || document!.uri.scheme !== "file") { return false; }

    // Find compiler
    let compiler = getChosenCompiler(document);
    if (compiler) { return await compiler.BuildGameAsync(document); }

    // Result
    return false;
}

export async function BuildGameAndRunAsync(fileUri: vscode.Uri): Promise<boolean> {
    // Get document
    let document = await filesystem.GetDocumentAsync(fileUri);
    if (!document || document!.uri.scheme !== "file") { return false; }

    // Find compiler
    let compiler = getChosenCompiler(document);
    if (compiler) { return await compiler.BuildGameAndRunAsync(document); }

    // Result
    return false;
}

export function KillBuildGame(): void {
    // Process all compilers
    for (let compiler of Compilers) {
        if (compiler.IsRunning) {
            compiler.Kill();
        }
    }
}

export function WriteToCompilerTerminal(message: string, writeToLog: boolean = false): void {
    CompilerOutputChannel.appendLine(message);
    if (writeToLog) { console.log(`debugger:${message}`); }    
}

export function ShowWarningPopup(message: string): void {
    vscode.window.showWarningMessage(message);
}

export function ShowInformationPopup(message: string): void {
    vscode.window.showInformationMessage(message);
}

export function ShowErrorPopup(message:string): void {
    vscode.window.showErrorMessage(message);
}

export function GetConfiguration() : vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(Name, null);
}

function getChosenCompiler(document: vscode.TextDocument): CompilerBase | undefined {
	// Prepare
	let configuration = GetConfiguration();

	// Find compiler (based on language of chosen file)
	for (let compiler of Compilers) {
		if (compiler.Id === document.languageId) {
			return compiler;
		}
	}	

	// Activate output window?
	if (configuration!.get<boolean>(`editor.preserveCodeEditorFocus`))  {
		CompilerOutputChannel.show();
	}

	// Clear output content?
	if (configuration!.get<boolean>(`editor.clearPreviousOutput`))  {
		CompilerOutputChannel.clear();
	}

	// Not found
	return undefined;
}

export async function ShowStartupMessagesAsync(): Promise<void> {
    // Prepare
    let configuration = GetConfiguration();

    // Load settings
    let showNewVersionMessage = configuration.get<string>(`application.configuration.showNewVersionMessage`);
    let latestVersion = configuration.get<string>(`application.configuration.latestVersion`);

    // Process?
    if (!showNewVersionMessage || latestVersion === Version) { return; }

    // Update latest version
    configuration.update(`application.configuration.latestVersion`, Version, vscode.ConfigurationTarget.Global);

    // buttons
    let latestChanges = "Learn more about the latest changes";
    let dontShowMeThisMessage = "Don't show me this message again";

    // Show prompt
    await vscode.window.showInformationMessage(`Welcome to the new version ${DisplayName}`,
        latestChanges, dontShowMeThisMessage)
        .then(selection => {
            if (selection === undefined) {
                // Dismissed
            } 
            else if (selection === latestChanges) {
                // Show changelog
                vscode.env.openExternal(ChangeLogUri);
            }
            else if(selection === dontShowMeThisMessage) {
                // Disable
                configuration.update(`application.configuration.showNewVersionMessage`, false, vscode.ConfigurationTarget.Global);
            }
        });
}