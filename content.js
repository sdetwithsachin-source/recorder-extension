if (window.recorderInitialized) {
    console.log("Recorder already initialized");
} else {

    window.recorderInitialized = true;

    console.log("Recorder initialized");

    console.log(
        "Recorder Extension Loaded"
    );


    // ========================================
    // GLOBAL RECORDING FLAG
    // ========================================

    window.isRecording = false;

    // LOAD RECORDING STATE
    chrome.storage.local.get(
        ["isRecording"],
        (result) => {

            if (result.isRecording) {

                window.isRecording = true;

                console.log(
                    "🎥 Recording Restored"
                );
            }
        }
    );


    // ========================================
    // START / STOP RECORDING
    // ========================================

    chrome.runtime.onMessage.addListener(

        (message, sender, sendResponse) => {

            // START RECORDING
            if (message.action === "ENABLE_RECORDING") {

                window.isRecording = true;

                console.log(
                    "🎥 Recording Started"
                );

                sendResponse({
                    success: true
                });

                return true;
            }

            // STOP RECORDING
            if (message.action === "DISABLE_RECORDING") {

                window.isRecording = false;

                console.log(
                    "🛑 Recording Stopped"
                );

                sendResponse({
                    success: true
                });

                return true;
            }

            sendResponse({
                success: true
            });

            return true;
        }
    );


    // ========================================
    // HIGHLIGHT ELEMENT
    // ========================================

    function highlightElement(element) {

        element.style.outline =
            "3px solid red";

        setTimeout(() => {

            element.style.outline = "";

        }, 1000);
    }

    // ========================================
    // Automatic locator type detection
    // ========================================

    function detectLocatorType(locator) {

        if (
            locator.startsWith("getBy")
        ) {

            return "playwright";
        }

        if (
            locator.startsWith("//") ||
            locator.startsWith("(//")
        ) {

            return "xpath";
        }

        return "css";
    }


    // ========================================
    // CHECK UNIQUE LOCATOR
    // ========================================

    function isUnique(locator) {

        try {

            return document.querySelectorAll(locator).length === 1;

        } catch {

            return false;
        }
    }


    // ========================================
    // GENERATE STABLE LOCATOR
    // ========================================

    function generateLocator(element) {

        // ====================================
        // ID
        // ====================================

        if (

            element.id &&
            element.id.trim() !== ""

        ) {

            const locator = `#${element.id}`;

            if (isUnique(locator)) {
                return locator;
            }
        }


        // ====================================
        // DATA TESTID
        // ====================================

        const testId =
            element.getAttribute("data-testid");

        if (testId) {

            const locator =
                `[data-testid="${testId}"]`;

            if (isUnique(locator)) {
                return locator;
            }
        }


        // ====================================
        // NAME
        // ====================================

        const name =
            element.getAttribute("name");

        if (name) {

            const locator =
                `[name="${name}"]`;

            if (isUnique(locator)) {
                return locator;
            }
        }


        // ====================================
        // PLACEHOLDER
        // ====================================

        const placeholder =
            element.getAttribute("placeholder");

        if (placeholder) {

            return `getByPlaceholder('${placeholder}')`;
        }


        // ====================================
        // ARIA LABEL
        // ====================================

        const aria =
            element.getAttribute("aria-label");

        if (aria) {

            return `getByLabel('${aria}')`;
        }


        // ====================================
        // BUTTON
        // ====================================

        if (

            element.tagName === "BUTTON" &&
            element.innerText.trim()

        ) {

            return `getByRole('button', { name: '${element.innerText.trim()}' })`;
        }


        // ====================================
        // LINK
        // ====================================

        if (

            element.tagName === "A" &&
            element.innerText.trim()

        ) {

            return `getByRole('link', { name: '${element.innerText.trim()}' })`;
        }


        // ====================================
        // INPUT TYPES
        // ====================================

        if (element.tagName === "INPUT") {

            // EMAIL

            if (element.type === "email") {

                const locator =
                    `input[type="email"]`;

                if (isUnique(locator)) {
                    return locator;
                }
            }

            // PASSWORD

            if (element.type === "password") {

                const locator =
                    `input[type="password"]`;

                if (isUnique(locator)) {
                    return locator;
                }
            }

            // SEARCH

            if (element.type === "search") {

                const locator =
                    `input[type="search"]`;

                if (isUnique(locator)) {
                    return locator;
                }
            }
        }


        // ====================================
        // STABLE CLASS
        // ====================================

        if (

            element.className &&
            typeof element.className === "string"

        ) {

            const classList =

                element.className
                    .trim()
                    .split(" ")
                    .filter(c => {

                        return (

                            c.length > 2 &&

                            // DYNAMIC FRAMEWORK CLASSES
                            !c.includes("css-") &&
                            !c.includes("Mui") &&
                            !c.includes("chakra") &&

                            // DYNAMIC STATE CLASSES
                            !c.includes("focus") &&
                            !c.includes("active") &&
                            !c.includes("selected") &&
                            !c.includes("disabled") &&
                            !c.includes("hover") &&
                            !c.includes("error") &&
                            !c.includes("opened") &&
                            !c.includes("hidden") &&
                            !c.includes("visible") &&

                            // AVOID GENERATED CLASSES
                            !/\d/.test(c)

                        );
                    });

            for (const cls of classList) {

                const locator = `.${cls}`;

                if (isUnique(locator)) {
                    return locator;
                }
            }
        }


        // ====================================
        // FALLBACK TEXT
        // ====================================

        if (

            element.innerText &&
            element.innerText.trim().length > 0

        ) {

            return `getByText('${element.innerText.trim()}')`;
        }


        // ====================================
        // TEXTBOX FALLBACK
        // ====================================

        if (element.tagName === "INPUT") {

            const allInputs =

                Array.from(
                    document.querySelectorAll("input")
                );

            const index =
                allInputs.indexOf(element);

            if (index >= 0) {

                return `getByRole('textbox').nth(${index})`;
            }
        }

        return element.tagName.toLowerCase();
    }

    // ========================================
    // SEND STEP TO BACKEND
    // ========================================

    async function sendStep(step) {

        try {

            await fetch(

                "http://localhost:8080/record-step",

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(step)
                }
            );

        } catch (err) {

            console.error(
                "Failed to send step:",
                err
            );
        }
    }


    // ========================================
    // CLICK LISTENER
    // ========================================

    document.addEventListener(

        "click",

        async function (e) {

            // RECORD ONLY IF ENABLED

            if (!window.isRecording)
                return;

            const element = e.target;

            highlightElement(element);

            const locatorValue =
                generateLocator(element);

            const locatorType =
                detectLocatorType(locatorValue);


            const step = {

                action: "CLICK",

                locator: locatorValue,

                locatorType: locatorType,

                locatorValue: locatorValue,

                data: "",

                description:
                    `Click on ${element.tagName}`
            };

            console.log(
                "Captured CLICK Step:",
                step
            );

            await sendStep(step);

        },

        true
    );


    // ========================================
    // TYPE LISTENER
    // ========================================

    const fieldValues = new Map();


    // STORE VALUE WHILE TYPING

    document.addEventListener(

        "input",

        function (e) {

            if (!window.isRecording)
                return;

            const element = e.target;

            if (

                element.tagName !== "INPUT" &&
                element.tagName !== "TEXTAREA"

            ) {

                return;
            }

            fieldValues.set(

                element,

                element.value
            );

        },

        true
    );


    // RECORD ONLY WHEN USER LEAVES FIELD

    document.addEventListener(

        "blur",

        async function (e) {

            if (!window.isRecording)
                return;

            const element = e.target;

            if (

                element.tagName !== "INPUT" &&
                element.tagName !== "TEXTAREA"

            ) {

                return;
            }

            const finalValue =
                fieldValues.get(element);

            if (

                finalValue === undefined ||
                finalValue.trim() === ""

            ) {

                return;
            }

            const locatorValue =
                generateLocator(element);


            const locatorType =
                detectLocatorType(locatorValue);

            const step = {

                action: "TYPE",

                locator: locatorValue,

                locatorType: locatorType,

                locatorValue: locatorValue,

                data: finalValue,

                description:
                    `Type '${finalValue}'`
            };

            console.log(
                "Captured TYPE Step:",
                step
            );

            await sendStep(step);

            fieldValues.delete(element);

        },

        true
    );


    // ========================================
    // DROPDOWN LISTENER
    // ========================================

    document.addEventListener(

        "change",

        async function (e) {

            if (!window.isRecording)
                return;

            const element = e.target;

            // ONLY SELECT

            if (
                element.tagName !== "SELECT"
            ) {
                return;
            }

            const locatorValue =
                generateLocator(element);

            const locatorType =
                detectLocatorType(locatorValue);

            const step = {

                action: "SELECT",

                locator: locatorValue,

                locatorType: locatorType,

                locatorValue: locatorValue,

                data: element.value,

                description:
                    `Select '${element.value}'`
            };

            console.log(
                "Captured SELECT Step:",
                step
            );

            await sendStep(step);

        },

        true
    );

}