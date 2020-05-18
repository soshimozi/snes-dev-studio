"use strict";
import * as vscode from 'vscode';
import * as path from 'path';
import * as application from '../application';
import * as filesystem from '../filesystem';
import * as execute from '../execute';

export abstract class CompilerBase implements vscode.Disposable {

    // Features
    public IsRunning: boolean = false;

    public readonly Id: string;
    public readonly Name: string;
    public readonly Extensions: string[];
    public readonly CompiledExtensions: string[];

    // Note: these need to be in reverse order compared to how they are read
    public DebuggerExtensions: Map<string, string> = new Map([["-s", ".sym"], ["-l", ".lst"]]);
    public CustomFolderOrPath: boolean = false;
    public DefaultFolderOrPath: string;
    public FolderOrPath: string = "";
    public Args: string = "";
    public Emulator: string = "";
    protected DefaultEmulator: string;
    protected Configuration: vscode.WorkspaceConfiguration | undefined;
    public Document: vscode.TextDocument | undefined;

    public FileName: string = "";
    public CompiledSubFolder: string = "";
    public CompiledSubFolderName: string = "bin";

    protected GenerateDebuggerFiles: boolean = false;
    protected CleanUpCompilationFiles: boolean = false;
    protected WorkspaceFolder: string = "";

    constructor(id: string, name: string, extensions: string[], compiledExtensions: string[], folderOrPath: string, emulator: string) {
        this.Id = id;
        this.Name = name;
        this.Extensions = extensions;
        this.CompiledExtensions = compiledExtensions;
        this.DefaultFolderOrPath = folderOrPath;
        this.DefaultEmulator = emulator;
    }

    public dispose(): void {
        console.log('debugger:CompilerBase.dispose');
    }

    public async BuildGameAsync(document: vscode.TextDocument): Promise<boolean> {
        // Set
        this.Document = document;

        // Initialise
        let result = await this.InitialiseAsync();
        if (!result) { return false; }

        // Execute
        return await this.ExecuteCompilerAsync();
    }

    public async BuildGameAndRunAsync(document: vscode.TextDocument): Promise<boolean> {
        // Process
        let result = await this.BuildGameAsync(document);
        if (!result) { return false; }

        // Does compiler have/use an emulator?
        if(this.Emulator === '') { return true; }

        // Get emulator
        for await (let emulator of application.Emulators) {
            if (emulator.Id === this.Emulator) {
                // Note: first extension should be the one which is to be launched
                let compiledFileName = `${this.FileName}${this.CompiledExtensions[0]}`;
                return await emulator.RunGameAsync(path.join(this.CompiledSubFolder, compiledFileName));
            }
        }

        // Not found
        application.WriteToCompilerTerminal(`Unable to find emulator '${this.Emulator}' to launch game.`);
        return false;
    }

    protected abstract ExecuteCompilerAsync(): Promise<boolean>; 

    protected async InitialiseAsync(): Promise<boolean> {
        console.log('debugger:CompilerBase.InitialiseAsync');

        // Prepare
        let result = true;

        // (Re)load
        // It appears you need to reload this each time incase of change
        this.Configuration = application.GetConfiguration();

        // Clear output content?
        // Note: need to do this here otherwise otuput from configuration is lost
        if (this.Configuration.get<boolean>(`editor.clearPreviousOutput`)) {
            application.CompilerOutputChannel.clear();
        }

        // Already running?
        if (this.IsRunning) {
            // Notify
            application.WriteToCompilerTerminal(`The ${this.Name} compiler is already running!  If you need to cancel the compilation process use the 'ads: Kill build process' option from the Command Palette.`);
            return false;
        }

        // Configuration
        result = await this.LoadConfigurationAsync();
        if (!result) { return false; }

        // Activate output window?
        if (!this.Configuration.get<boolean>(`editor.preserveCodeEditorFocus`)) {
            application.CompilerOutputChannel.show();
        }

        // Save files?
        if (this.Configuration.get<boolean>(`editor.saveAllFilesBeforeRun`)) {
            result = await vscode.workspace.saveAll();
        } else if (this.Configuration.get<boolean>(`editor.saveFileBeforeRun`)) {
            if (this.Document) { result = await this.Document.save(); }
        }

        if (!result) { return false; }

        // Remove old debugger files before build
        await this.RemoveDebuggerFilesAsync(this.CompiledSubFolder);

        //  Result
        return true;
    }

    protected async RepairFilePermissionsAsync(): Promise<boolean> {
        return true;
    }

    protected async LoadConfigurationAsync(): Promise<boolean> {
        console.log('debugge:CompilerBase.LoadConfigurationAsync');

        // Reset
        this.CustomFolderOrPath = false;
        this.FolderOrPath = this.DefaultFolderOrPath;
        this.Args = "";
        this.Emulator = this.DefaultEmulator;
        

        // System
        this.WorkspaceFolder = this.GetWorkspaceFolder();
        this.FileName = path.basename(this.Document!.fileName);

        // Validate compilers
        let defaultCompiler = this.Configuration!.get<string>(`compiler.${this.Id}.defaultCompiler`);
        
        // Compiler (Other)
        this.Args = this.Configuration!.get<string>(`compiler.${this.Id}.args`, "");

        // Compilation
        this.GenerateDebuggerFiles = this.Configuration!.get<boolean>(`compiler.options.generateDebuggerFiles`, true);
        this.CleanUpCompilationFiles = this.Configuration!.get<boolean>(`compiler.options.cleanupCompilationsFiles`, true);

        // System
        this.CompiledSubFolder = path.join(this.WorkspaceFolder, this.CompiledSubFolder);

        // Result
        return true;
    }

    protected async VerifyCompiledFileSizeAsync(): Promise<boolean> {
        console.log('debugger:CompilerBase.VerifyCompiledSize');

        // Verify created files(s)
        application.WriteToCompilerTerminal(`Verifying compiled file(s)...`);
        for await(let extension of this.CompiledExtensions) {
            // Prepare
            let compiledFileName = `${this.FileName}${extension}`;
            let compiledFilePath = path.join(this.WorkspaceFolder, compiledFileName);

            // Validate
            let fileStats = await filesystem.GetFileStatsAsync(compiledFilePath);
            if (fileStats && fileStats.size > 0) { continue ;}

            // Failed
            application.WriteToCompilerTerminal(`ERROR: Failed to create compiled file '${compiledFileName}'.`);
            return false;
        }

        // Result
        return true;
    }

    protected async MoveFilesToBinFolderAsync(): Promise<boolean> {
        console.log('debugger:CompilerBase.MovefilesToBinFolder');

        // Create directory?
        let result = await filesystem.MkDirAsync(this.CompiledSubFolder);
        if (!result) {
            // Notify
            application.WriteToCompilerTerminal(`ERROR: Failed to create folder '${this.CompiledSubFolderName}'`);
            return false;
        }

        // Move compiled file(s)
        application.WriteToCompilerTerminal(`MOving compiled file(s) to '${this.CompiledSubFolderName}' folder...`);
        for await (let extension of this.CompiledExtensions) {
            // Prepare
            let compiledFileName = `${this.FileName}${extension}`;
            let oldPath = path.join(this.WorkspaceFolder, compiledFileName);
            let newPath = path.join(this.CompiledSubFolderName, compiledFileName);

            // Move compiled file
            result = await filesystem.RenameFileAsync(oldPath, newPath);
            if (!result) {
                // Notify
                application.WriteToCompilerTerminal(`ERROR: Failed tomove file from '${compiledFileName}' to ${this.CompiledSubFolderName}`);
                return false;
            }
        }

        // Process?
        if (this.GenerateDebuggerFiles) {
            // Move all debugger files?
            application.WriteToCompilerTerminal(`Moving debugger file(s) to '${this.CompiledSubFolderName}'`);
            for await (let [arg, extension] of this.DebuggerExtensions) {
                // Prepare
                let debuggerFile: string = `${this.FileName}${extension}`;
                let oldPath = path.join(this.WorkspaceFolder, debuggerFile);
                let newPath = path.join(this.CompiledSubFolderName, debuggerFile);

                // Move compiled file?
                if (await filesystem.FileExistsAsync(oldPath)) {
                    result = await filesystem.RenameFileAsync(oldPath, newPath);
                    if (!result) {
                        // Notify
                        application.WriteToCompilerTerminal(`ERROR: Failed to move file '${debuggerFile}' to '${this.CompiledSubFolderName}' folder`);
                    }
                }
            }
            
        }

        // Return
        return true;
    }

    protected async RemoveDebuggerFilesAsync(folder: string): Promise<boolean> {
        console.log('debugger:CompilerBase.RemoveDebuggerFilesAsync');

        // Process
        for await (let [arg, extension] of this.DebuggerExtensions) {
            // Prepare
            let debuggerFile: string = `${this.FileName}${extension}`;
            let debuggerFilePath = path.join(folder, debuggerFile);

            // Process
            if (await filesystem.FileExistsAsync(debuggerFilePath)) {
                await filesystem.RemoveFileAsync(debuggerFilePath);
            }
        }

        // Result
        return true;
    }

    public Kill() {
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

    private GetWorkspaceFolder(): string {
        console.log('debugger:CompilerBase.getWorkspaceFolder');

        // Issue: Get actual document first as the workspace
        //        is not the best option when file is in a subfolder
        //        of the chosen workspace    

        // Document
        if (this.Document) { return path.dirname(this.Document.fileName); }

        // Workspace (last resort)
        if (vscode.workspace.workspaceFolders) {
            if (this.Document) {
                let workspaceFolder = vscode.workspace.getWorkspaceFolder(this.Document!.uri);
                if (workspaceFolder) {
                    return workspaceFolder.uri.fsPath;
                }
            }

            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }

        return "";
    }
   
}