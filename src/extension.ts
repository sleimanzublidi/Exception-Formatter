import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) 
{
    console.log('Stack Trace Formatter Activated.');

    vscode.commands.registerCommand('extension.formatStackTrace', () => {
        const {activeTextEditor} = vscode.window;
    
        if (activeTextEditor && activeTextEditor.document.languageId === 'plaintext') {
            const {document} = activeTextEditor;
            const unformattedStackTrace = document.getText();

            const formattedStackTrace = StackTraceFormatter.format(unformattedStackTrace);

            const edit = new vscode.WorkspaceEdit();
            edit.delete(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(unformattedStackTrace.length)));
            edit.insert(document.uri, document.positionAt(0), formattedStackTrace)
            vscode.workspace.applyEdit(edit)
            activeTextEditor.selection = new vscode.Selection(document.positionAt(0), document.positionAt(0));
        }
    });
}

export class StackTraceFormatter
{
    // TODO: Format stack trace using regular expressions
    public static regexFormat(stackTraceMessage: string): string
    {
        if(!stackTraceMessage)
            return '';

        var result = this.removeNewLines(stackTraceMessage);
        const stackTraceRegex = /(Unhandled Exception:.*?)(--->.*?)*(( at .*? in .*?:line \d+)+(\s*--- End of inner exception stack trace ---\s*?)?)+/;

        var match = stackTraceRegex.exec(result);

        return result;
    }

    public static format(stackTraceMessage: string): string{
        // Return empty string on null input.
        if(!stackTraceMessage)
            return '';

        // Start off with all new lines removed.
        var result = this.removeNewLines(stackTraceMessage);

        // The list of tokens to find and prepend new lines.
        const replacementTokens = [
            {
                original: /---\s*at/g,
                replacement: '---\n    at'
            },
            {
                original: /\s+at /g,
                replacement: '\n    at '
            },
            {
                original: /--- End of inner exception stack trace ---/g, 
                replacement: '\n    --- End of inner exception stack trace ---'
            },
            {
              original: /--->/g,
              replacement: '\n  --->'
            },
            {
                original: /Caused by:/g,
                replacement: '\nCaused by:'
            },
            {
                original: /   \.\.\. /g,
                replacement: '\n   ... '
            },
            {
                // This rule should be last. Removes extra whitespace at the end of the lines.
                original: /\s+\n/g, 
                replacement: '\n'
            },
        ]

        replacementTokens.forEach(token => {
            result = result.replace(token.original, token.replacement);
        });

        var lines = result.split('\n');
        result = '';

        lines.forEach(line =>
        {
            if(line.indexOf('at System.Runtime.CompilerServices.TaskAwaiter') < 0)
            {
                var start = line.indexOf('\\n-');
                if (start > 0)
                {
                    line = line.substring(0, start);
                }

                result = result + line + '\n';
            }
        });
    
        return result;
    };

    private static removeNewLines(input: string): string
    {
        return input.replace(/(\r\n|\r|\n)/g, '');
    }
}