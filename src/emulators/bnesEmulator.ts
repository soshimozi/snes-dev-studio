"use strict";
import * as vscode from 'vscode';
import * as application from '../application';
import * as filesystem from '../filesystem';
import { EmulatorBase } from './emulatorBase';
import * as path from 'path';

export class BNESEmulator extends EmulatorBase {

    // Features
    protected AutoCloseExistingInstances:boolean = true;

    constructor() {
        super("BNES", "BNES", path.join(application.Path, "out", "bin", "emulators", "bnes"));
    }
    
    protected ExecuteEmulatorAsync(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}