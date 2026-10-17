
const languageSelect = document.getElementById("language");
const codeEditor = document.getElementById("code");
const stdinEditor = document.getElementById("stdin");
const output = document.getElementById("output");
const status = document.getElementById("status");
const runBtn = document.getElementById("runBtn");

const examples = {
    python: `print("Hello, World!")\n\nname = input("Enter your name: ")\nprint("Welcome,", name)`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
};

const languageNames = {
    python: "PYTHON",
    c: "C",
    java: "JAVA"
};

const versions = {
    python: "3.10.0",
    c: "10.2.0",
    java: "15.0.2"
};

// Change the example when the language changes.
languageSelect.addEventListener("change", () => {
    const language = languageSelect.value;

    codeEditor.value = examples[language];
    document.getElementById("languageLabel").textContent =
        languageNames[language];

    output.textContent = "Your output will appear here...";
    status.textContent = "Ready";
});

// Run the selected program.
runBtn.addEventListener("click", async () => {
    const language = languageSelect.value;
    const code = codeEditor.value;

    if (!code.trim()) {
        output.textContent = "Please enter some code first.";
        status.textContent = "No code to run";
        return;
    }

    runBtn.disabled = true;
    runBtn.textContent = "Running...";
    output.textContent = "Compiling and executing your code...";
    status.textContent = "Processing";

    try {
        const response = await fetch(
            "https://emkc.org/api/v2/piston/execute",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: language,
                    version: versions[language],
                    files: [
                        {
                            name: language === "java"
                                ? "Main.java"
                                : language === "c"
                                    ? "main.c"
                                    : "main.py",
                            content: code
                        }
                    ],
                    stdin: stdinEditor.value
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Compiler service returned HTTP ${response.status}`
            );
        }

        const result = await response.json();

        const compileOutput = result.compile?.output || "";
        const compileError = result.compile?.stderr || "";
        const stdout = result.run?.stdout || "";
        const stderr = result.run?.stderr || "";
        const exitCode = result.run?.code;

        const messages = [
            compileOutput,
            compileError,
            stdout,
            stderr
        ].filter(Boolean);

        output.textContent = messages.join("\n") ||
            "Program executed successfully with no output.";

        if (result.message) {
            output.textContent = result.message;
        }

        status.textContent =
            exitCode === 0
                ? "Execution completed"
                : exitCode == null
                    ? "Execution finished"
                    : `Program exited with code ${exitCode}`;

    } catch (error) {
        output.textContent =
            "Unable to execute the program.\n\n" +
            error.message +
            "\n\nThe compiler API may be unavailable or may " +
            "require a backend or different access settings.";

        status.textContent = "Execution failed";
    } finally {
        runBtn.disabled = false;
        runBtn.textContent = "▶ Run Code";
    }
});

// Clear the code editor.
document.getElementById("clearBtn").addEventListener("click", () => {
    codeEditor.value = "";
    status.textContent = "Editor cleared";
    codeEditor.focus();
});

// Clear the output console.
document.getElementById("clearOutputBtn").addEventListener("click", () => {
    output.textContent = "";
    status.textContent = "Output cleared";
});

// Allow Tab to insert indentation inside the editor.
codeEditor.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
        event.preventDefault();

        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;

        codeEditor.setRangeText("    ", start, end, "end");
    }
});
