if (!window.playwrightRecorderInjected) {

    window.playwrightRecorderInjected = true;

    let isRecording = false;

    let listenersAttached = false;

    let lastStep = "";

    let previousValues = {};



    // =======================================
    // MESSAGE LISTENER
    // =======================================

    chrome.runtime.onMessage.addListener(

        (message) => {

            if (
                message.action ===
                "ENABLE_RECORDING"
            ) {

                if (isRecording)
                    return;

                isRecording = true;

                console.log(
                    "✅ Recording Enabled"
                );

                attachListeners();
            }


            if (
                message.action ===
                "DISABLE_RECORDING"
            ) {

                isRecording = false;

                console.log(
                    "🛑 Recording Disabled"
                );

                removeListeners();
            }
        }
    );



    // =======================================
    // IGNORE RECORDER PANEL
    // =======================================

    function isRecorderElement(element) {

        return element.closest(
            "#playwright-recorder-panel"
        );
    }



    // =======================================
    // SAVE STEP
    // =======================================

    function saveStep(step) {

        const currentStep =

            JSON.stringify(step);

        if (
            currentStep === lastStep
        ) {

            return;
        }

        lastStep = currentStep;

        chrome.runtime.sendMessage({

            action: "SAVE_STEP",

            step: step
        });
    }



    // =======================================
    // UNIQUE SELECTOR CHECK
    // =======================================

    function isUniqueSelector(selector) {

        try {

            return document
                .querySelectorAll(selector)
                .length === 1;

        } catch {

            return false;
        }
    }



    // =======================================
    // GENERATE CSS SELECTOR
    // =======================================

    function generateCssSelector(element) {

        if (element.id) {

            return `#${element.id}`;
        }

        let path = [];

        while (
            element &&
            element.nodeType === 1
        ) {

            let selector =

                element.nodeName
                    .toLowerCase();

            if (element.className) {

                const classes =

                    element.className
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean);

                if (classes.length) {

                    selector +=
                        "." +
                        classes.join(".");
                }
            }

            path.unshift(selector);

            const fullPath =
                path.join(" > ");

            if (
                isUniqueSelector(fullPath)
            ) {

                return fullPath;
            }

            element =
                element.parentElement;
        }

        return path.join(" > ");
    }



    // =======================================
    // GENERATE XPATH
    // =======================================

    function generateXPath(element) {

        if (element.id) {

            return `//*[@id="${element.id}"]`;
        }

        return `//${element.tagName.toLowerCase()}`;
    }



    // =======================================
    // GET ALL LOCATORS
    // =======================================

    function getLocators(element) {

        return {

            id:
                element.id
                    ? `#${element.id}`
                    : "",

            name:
                element.name
                    ? `[name="${element.name}"]`
                    : "",

            placeholder:
                element.placeholder
                    ? `[placeholder="${element.placeholder}"]`
                    : "",

            dataTestId:
                element.getAttribute(
                    "data-testid"
                )
                    ? `[data-testid="${element.getAttribute("data-testid")}"]`
                    : "",

            css:
                generateCssSelector(element),

            xpath:
                generateXPath(element)
        };
    }



    // =======================================
    // GET BEST LOCATOR
    // =======================================

    function getBestLocator(element) {

        if (
            element.id &&
            isUniqueSelector(
                `#${element.id}`
            )
        ) {

            return {

                type: "id",

                value:
                    `#${element.id}`
            };
        }


        if (
            element.name &&
            isUniqueSelector(
                `[name="${element.name}"]`
            )
        ) {

            return {

                type: "name",

                value:
                    `[name="${element.name}"]`
            };
        }


        if (
            element.placeholder &&
            isUniqueSelector(
                `[placeholder="${element.placeholder}"]`
            )
        ) {

            return {

                type: "placeholder",

                value:
                    `[placeholder="${element.placeholder}"]`
            };
        }


        const dataTestId =

            element.getAttribute(
                "data-testid"
            );

        if (
            dataTestId &&
            isUniqueSelector(
                `[data-testid="${dataTestId}"]`
            )
        ) {

            return {

                type: "data-testid",

                value:
                    `[data-testid="${dataTestId}"]`
            };
        }


        const css =
            generateCssSelector(element);

        if (
            css &&
            isUniqueSelector(css)
        ) {

            return {

                type: "css",

                value: css
            };
        }


        return {

            type: "xpath",

            value:
                generateXPath(element)
        };
    }



    // =======================================
    // CLICK
    // =======================================

    function handleClick(event) {

        if (!isRecording)
            return;

        const element =
            event.target;

        if (
            !element ||
            isRecorderElement(element)
        ) {

            return;
        }


        // IGNORE INPUT CLICK

        if (

            element.tagName ===
            "INPUT"

            ||

            element.tagName ===
            "TEXTAREA"

            ||

            element.tagName ===
            "SELECT"
        ) {

            return;
        }


        const locators =
            getLocators(element);

        const bestLocator =
            getBestLocator(element);


        saveStep({

            action: "CLICK",

            data: "",

            locators: locators,

            locatorType:
                bestLocator.type,

            locatorValue:
                bestLocator.value,

            description:
                `Clicked on <${element.tagName}>`
        });
    }



    // =======================================
    // INPUT BLUR
    // =======================================

    function handleBlur(event) {

        if (!isRecording)
            return;

        const element =
            event.target;

        if (
            !element ||
            isRecorderElement(element)
        ) {

            return;
        }


        if (

            element.tagName !==
            "INPUT"

            &&

            element.tagName !==
            "TEXTAREA"
        ) {

            return;
        }


        const value =
            element.value?.trim();

        if (!value)
            return;


        const bestLocator =
            getBestLocator(element);

        const key =
            bestLocator.value;


        // PREVENT DUPLICATE INPUTS

        if (
            previousValues[key] === value
        ) {

            return;
        }

        previousValues[key] =
            value;


        const locators =
            getLocators(element);


        saveStep({

            action: "SET_DATA",

            data: value,

            locators:
                locators,

            locatorType:
                bestLocator.type,

            locatorValue:
                bestLocator.value,

            description:
                `Entered ${value}`
        });
    }



    // =======================================
    // SELECT DROPDOWN
    // =======================================

    function handleSelect(event) {

        if (!isRecording)
            return;

        const element =
            event.target;

        if (
            !element ||
            isRecorderElement(element)
        ) {

            return;
        }


        if (
            element.tagName !==
            "SELECT"
        ) {

            return;
        }


        const locators =
            getLocators(element);

        const bestLocator =
            getBestLocator(element);


        saveStep({

            action:
                "SELECT_DROPDOWN",

            data:
                element.value,

            locators:
                locators,

            locatorType:
                bestLocator.type,

            locatorValue:
                bestLocator.value,

            description:
                `Selected ${element.value}`
        });
    }



    // =======================================
    // ATTACH LISTENERS
    // =======================================

    function attachListeners() {

        if (listenersAttached)
            return;

        listenersAttached = true;


        document.addEventListener(
            "click",
            handleClick,
            true
        );


        document.addEventListener(
            "blur",
            handleBlur,
            true
        );


        document.addEventListener(
            "change",
            handleSelect,
            true
        );
    }



    // =======================================
    // REMOVE LISTENERS
    // =======================================

    function removeListeners() {

        if (!listenersAttached)
            return;

        listenersAttached = false;


        document.removeEventListener(
            "click",
            handleClick,
            true
        );


        document.removeEventListener(
            "blur",
            handleBlur,
            true
        );


        document.removeEventListener(
            "change",
            handleSelect,
            true
        );
    }
}