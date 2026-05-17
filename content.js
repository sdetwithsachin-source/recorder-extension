console.log(
    "Recorder Extension Loaded"
);


// ========================================
// GLOBAL RECORDING FLAG
// ========================================

window.isRecording = false;


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
// GENERATE STABLE LOCATOR
// ========================================

function generateLocator(element) {

    // data-testid

    if (
        element.getAttribute(
            "data-testid"
        )
    ) {

        return `[data-testid="${element.getAttribute("data-testid")}"]`;
    }

    // aria-label

    if (
        element.getAttribute(
            "aria-label"
        )
    ) {

        return `getByLabel('${element.getAttribute("aria-label")}')`;
    }

    // placeholder

    if (
        element.getAttribute(
            "placeholder"
        )
    ) {

        return `getByPlaceholder('${element.getAttribute("placeholder")}')`;
    }

    // name

    if (
        element.getAttribute("name")
    ) {

        return `[name="${element.getAttribute("name")}"]`;
    }

    // id

    if (element.id) {

        return `#${element.id}`;
    }

    // BUTTON
    if (
        element.tagName === "BUTTON" &&
        element.innerText.trim().length > 0
    ) {

        return `getByRole('button', { name: '${element.innerText.trim()}' })`;
    }

    // LINK
    if (
        element.tagName === "A" &&
        element.innerText.trim().length > 0
    ) {

        return `getByRole('link', { name: '${element.innerText.trim()}' })`;
    }

    // FALLBACK TEXT
    if (
        element.innerText &&
        element.innerText.trim().length > 0
    ) {

        return `getByText('${element.innerText.trim()}')`;
    }

    // type selector

    if (element.type) {

        return `${element.tagName.toLowerCase()}[type="${element.type}"]`;
    }

    // fallback

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