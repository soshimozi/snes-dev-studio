"use strict";
import * as vscode from 'vscode';
import * as application from './application';
import * as fs from 'fs';

export async function GetFileUriAsync(fileUri: vscode.Uri) {
    // Validate
    if (fileUri) { return fileUri; }

    // Prepare
    let document: vscode.TextDocument;

    // Document not open?
    // Note: this really shouldn't happen
    let editor = vscode.window.activeTextEditor;
    if(!editor) {
        document = await vscode.workspace.openTextDocument(fileUri);
    } else {
        document = editor.document;
    }

    // Result
    return document!.uri;
}

export async function GetDocumentAsync(fileUri: vscode.Uri) {
    // Validate
    if (IsRunFromExplorer(fileUri)) {
        // Make sure document exists
        let result = await FileExistsAsync(fileUri.fsPath);
        if (result) { return await vscode.workspace.openTextDocument(fileUri); }

        // Not found
        vscode.window.showInformationMessage("Error: File cannot be found");
    }

    // Try current document
    let editor = vscode.window.activeTextEditor;
    if (editor) { return editor.document; }
    return null;
}

export function IsRunFromExplorer(fileUri: vscode.Uri) {
    let editor = vscode.window.activeTextEditor;
    if (!fileUri || !fileUri.fsPath) {
        return false;
    }
    if(!editor) {
        return true;
    }
    if (fileUri.fsPath === editor.document.uri.fsPath) { 
        return false;
    }
    return true;
}

export function FileExistsAsync(path: string): Promise<boolean> {
    console.log('debuffer.filesystem.FileExistsAsync');

    return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.F_OK, err => {
            resolve(!err);
        });
    });
}

export function RenameFileAsync(oldName: string, newName: string): Promise<boolean> {
    console.log('debugger:filesystem.RenameFileAsync');

    return new Promise((resolve, reject) => {
        fs.rename(oldName, newName, err => {
            resolve(!err);
        });
    });
}

export function GetFileStatsAsync(path: string) : Promise<fs.Stats> {
    console.log('debugger.filesystem.GetFileStatsAsync');

    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (!err) { return resolve(stats); }
            resolve(undefined);
        });
    });
}

export function RemoveFileAsync(path: string): Promise<boolean> {
    console.log('debugger:filesystem.RemoveFileAsync');

    return new Promise((resolve, reject) => {
        fs.unlink(path, err => {
            resolve(!err);
        });
    });
}

export function FolderExistsAsync(folder: string): Promise<boolean> {
    console.log('debugger:filesystem.folderExistsAsync');

    return new Promise((resolve, reject) => {
        fs.access(folder, fs.constants.F_OK, err => {
            resolve(!err);
        });
    });
}

export function MkDirAsync(folder: string): Promise<boolean> {
    console.log('debugger:filesystem.MkDirAsync');

    return new Promise((resolve, reject) => {
        fs.mkdir(folder, err => {
            if (err && err.code === 'EEXIST') { return resolve(true); }
            resolve(!err);
        });
    });
}

export function ChModAsync(path: string, mode: string = '777'): Promise<boolean> {
    console.log('debugger:filesystem.ChModAsync');

    return new Promise((resolve, reject) => {
        fs.chmod(path, mode, err => {
            if (err) { application.WriteToCompilerTerminal(`- fialed to set chmod permissions: ${err.message}`);}
            resolve(!err);
        });
    });
}

export function ReadFileAsync(path: string): Promise<any> {
    console.log('debugger:filesystem.ReadFileAsync');

    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (!err) { return resolve(data); }
            resolve(undefined);
        });
    });
}

export function WriteFileAsync(path: string, data: any): Promise<boolean> {
    console.log('debugger:filesystem.WritefileAsync');

    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, err => {
            resolve(!err);
        });
    });
}

export function WorkspaceFolder(): string {
    // Workspace
    if (vscode.workspace.workspaceFolders) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }

    return "";
}
