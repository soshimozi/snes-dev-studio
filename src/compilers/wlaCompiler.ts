
"use strict";
import * as path from 'path';
import * as application from '../application';
import * as filesystem from '../filesystem';
import * as execute from '../execute';
import { CompilerBase } from "./compilerBase";

export class WlaCompiler extends CompilerBase {

    // Features
    public Format: string = "";
    public Verboseness: string = "";

    constructor() {
        super("wla",
                "wla",
                [".wla", ".asm", ".a", ".s", ".i"],
                [".bin"],
                path.join(application.Path, "out", "bin", "compilers", "wla_dx"),
                "bsnes");
    }

    protected async ExecuteCompilerAsync(): Promise<boolean> {
        console.log('debugger:WlaCompiler.ExecuteCompilerAsync');

        // Permissions
        await this.RepairFilePermissionsAsync();

        // Command
        let command = `${this.FolderOrPath}`;

        // Args
        let args = [
            `"${this.FileName}"`,
            `-o"${this.FileName}${this.CompiledExtensions[0]}"`
        ];
        if (this.Verboseness) { args.push(`${"-v"}${this.Verboseness}`); }
        if (this.GenerateDebuggerFiles) {
            this.DebuggerExtensions.forEach((extension: string, arg: string) => {
                args.push(`${arg}"${this.FileName}${extension}`);
            });
        }

        if (this.Args) { args.push(`${this.Args}`); }

        // Environment
        let env: { [key: string]: string | null } = {};

        // Notify
        application.CompilerOutputChannel.appendLine(`Starting build of ${this.FileName}...`);

        // Process
        this.IsRunning = true;
        let executeResult = await execute.Spawn(command, args, env, this.WorkspaceFolder,
            (stdout: string) => {
                // Prepare
                let result = true;

                // Validate
                if (stdout.includes("Parse error:") || stdout.includes("error:")) {
                    // Potential messages received (so far):
                    // Parse error
                    // Error: 
                    
                    // Failed
                    result = false;                    
                }

                // Result
                application.CompilerOutputChannel.appendLine('' + stdout);
                return result;
            },
            (stderr: string) => {
                // Prepare
                let result = true;

                // Validat
                if (stderr.includes("Permission denied")) {
                    // Potential messages received (so far):
                    // Permission denied
                    
                    // Failed
                    result = false;                    
                }

                // Result 
                application.CompilerOutputChannel.appendLine('' + stderr);
                return result;
            });

        this.IsRunning = false;

        // Finalize
        if (executeResult) { executeResult = await this.VerifyCompiledFileSizeAsync(); }
        await this.RemoveCompilationFilesAsync(executeResult);
        if (executeResult) { executeResult = await this.MoveFilesToBinFolderAsync(); }

        // Result
        return executeResult;

    }

    protected async LoadConfigurationAsync(): Promise<boolean> {
        console.log('debugger:WlaCompiler.LoadConfigurationAsync');

        // Base
        let result = await super.LoadConfigurationAsync();
        if (!result) { return false; }

        // Default compiler
        if (!this.CustomFolderOrPath) {
            let wlaName = "wla-65816.exe";

            if(application.IsLinux) {
                wlaName = "wla-65816";
            } else if(application.IsMacOS) {
                wlaName = "wla-65816";
            }

            this.FolderOrPath = path.join(this.DefaultFolderOrPath, application.OSPlatform, application.OSArch, wlaName);
        }

        // Compiler (other)
        this.Verboseness = this.Configuration!.get<string>(`compiler.${this.Id}.verboseness`, "0");

        // Emulator
        // User can select required emulator from settings
        let userDefaultEmulator = this.Configuration!.get<string>(`compiler.${this.Id}.defaultEmulator`);
        if (userDefaultEmulator) {
            this.Emulator = userDefaultEmulator;
        }

        // Result
        return true;
    }

    protected async ValidateCustomCompilerLocationAsync() : Promise<void> {
        console.log('debugger:DasmCompiler.ValidateCustomCompilerLocationAsync');  

        // Validate for a folder
        let customCompilerPath = this.Configuration!.get<string>(`compiler.${this.Id}.path`);
        if (!customCompilerPath) {
            // No custom compiler provided, revert
            let message = `WARNING: You have chosen to use a custom ${this.Name} compiler but have not provided the location.\nReverting to the default compiler...`;
            application.WriteToCompilerTerminal(message);
            application.ShowWarningPopup(message);

        } else {
            // Validate custom compiler path exists
            let result = await filesystem.FileExistsAsync(customCompilerPath);
            if (!result) {
                // Failed, revert
                let message = `WARNING: Your custom ${this.Name} compiler location '${customCompilerPath}' cannot be found.\nReverting to the default compiler...`;
                application.WriteToCompilerTerminal(message);
                application.ShowWarningPopup(message);

            } else {
                // Ok
                application.WriteToCompilerTerminal(`Building using your custom ${this.Name} compiler.`);               
                application.WriteToCompilerTerminal(`Location: ${customCompilerPath}`);  

                // Set
                this.FolderOrPath = customCompilerPath;
                this.CustomFolderOrPath = true;
            }
        }

        // Finalise
        application.WriteToCompilerTerminal("");
    }    

    protected async RepairFilePermissionsAsync(): Promise<boolean> {
        console.log('debugger:DasmCompiler.RepairFilePermissionsAsync'); 

        // Validate
        if (this.CustomFolderOrPath || application.IsWindows) { return true; }

        // Process
        let result = await filesystem.ChModAsync(this.FolderOrPath);
        return result;
    }

    protected async RemoveCompilationFilesAsync(result: boolean): Promise<boolean> {
        console.log('debugger:DasmCompiler.RemoveCompilationFiles');

        // Language specific files
        if (!result)  {
            // Process
            await filesystem.RemoveFileAsync(path.join(this.WorkspaceFolder,`${this.FileName}.bin`));
        }

        // Result
        return true;
    }    

}