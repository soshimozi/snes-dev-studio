"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BNESEmulator = void 0;
const application = require("../application");
const emulatorBase_1 = require("./emulatorBase");
const path = require("path");
class BNESEmulator extends emulatorBase_1.EmulatorBase {
    constructor() {
        super("BNES", "BNES", path.join(application.Path, "out", "bin", "emulators", "bnes"));
        // Features
        this.AutoCloseExistingInstances = true;
    }
    ExecuteEmulatorAsync() {
        throw new Error("Method not implemented.");
    }
}
exports.BNESEmulator = BNESEmulator;
//# sourceMappingURL=bnesEmulator.js.map