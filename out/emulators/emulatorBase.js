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
exports.EmulatorBase = void 0;
const application = require("../application");
const filesystem = require("../filesystem");
class EmulatorBase {
    constructor(id, name, folderOrPath) {
        this.CustomFolderOrPath = false;
        this.FolderOrPath = "";
        this.Args = "";
        this.FileName = "";
        this.Id = id;
        this.Name = name;
        this.DefaultFolderOrPath = folderOrPath;
    }
    dispose() {
        console.log('debugger:EmulatorBase.dispose');
    }
    RunGameAsync(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set
            this.FileName = fileName;
            // Process
            let result = yield this.InitialiseAsync();
            if (!result) {
                return false;
            }
            return yield this.ExecuteEmulatorAsync();
        });
    }
    InitialiseAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:EmulatorBase.InitiaiseAsync');
            // Configuration
            let result = yield this.LoadConfigurationAsync();
            if (!result) {
                return false;
            }
            // Result
            return true;
        });
    }
    RepairFilePermissionsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    LoadConfigurationAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('debugger:EmulatorBase.LoadConfigurationAsync');
            // Reset
            this.CustomFolderOrPath = false;
            this.FolderOrPath = this.DefaultFolderOrPath;
            this.Args = "";
            // (Re)load
            // It appears you need to reload this each time in case of changes
            this.Configuration = application.GetConfiguration();
            // Emulator
            let userEmulatorPath = this.Configuration.get(`emulator.${this.Id.toLowerCase()}.path`);
            if (userEmulatorPath) {
                // Validate (user provided)
                let result = yield filesystem.FileExistsAsync(userEmulatorPath);
                if (!result) {
                    // Notify
                    let message = `Warning: Your chosen ${this.Name} emulator path '${userEmulatorPath} cannot be found.\nReverting to the default emultaor...`;
                    application.WriteToCompilerTerminal(message);
                    application.WriteToCompilerTerminal("");
                    application.ShowWarningPopup(message);
                }
                else {
                    // Set
                    this.FolderOrPath = userEmulatorPath;
                    this.CustomFolderOrPath = true;
                }
            }
            // Emulator (Other)
            this.Args = this.Configuration.get(`emulator.${this.Id.toLowerCase()}.args`, "");
            // Result
            return true;
        });
    }
}
exports.EmulatorBase = EmulatorBase;
//# sourceMappingURL=emulatorBase.js.map