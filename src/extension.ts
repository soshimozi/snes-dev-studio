// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as application from './application';
import { WelcomePage } from './pages/welcome';
import './statusbar';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	console.log('activate!');
	
	// Pages
	let welcomePage = new WelcomePage();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(`Extension ${application.DisplayName} (${application.Version}) is now active!`);;
	console.log(`- Installation path: '${application.Path}'`);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	
	// Welcome
	const openWelcomePage = vscode.commands.registerCommand('extension.openWelcomePage', () => {
		console.log('User activated command "extension.openWelcomePage"');
		welcomePage.openPage(context);
	});


	// Build
	const buildGame = vscode.commands.registerCommand('extension.buildGame', async (fileUri: vscode.Uri) => {
		console.log('User activated command "extension.buildGame"');
		await application.BuildGameAsync(fileUri);
	});

	const buildGameAndRun = vscode.commands.registerCommand('extension.buildGameAndRun', async (fileUri: vscode.Uri) => {
		console.log('User activated command "extension.buildGameAndRun');
		await application.BuildGameAndRunAsync(fileUri);
	});

	const killBuildGame = vscode.commands.registerCommand('extension.killBuildGame', () => {
		console.log('User activated command "extension.killBuildGame"');
		application.KillBuildGame();		
	});


	// Subscriptions (register)
	context.subscriptions.push(openWelcomePage);
	context.subscriptions.push(buildGame);
	context.subscriptions.push(buildGameAndRun);
	context.subscriptions.push(killBuildGame);

	// Show welcome messages
	await application.ShowStartupMessagesAsync();
}

// this method is called when your extension is deactivated
export function deactivate() {}
