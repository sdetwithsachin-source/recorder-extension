let recordingTabId = null;


// ============================================
// SAVE STEP
// ============================================

async function saveStep(step) {

    try {

        const result =
            await chrome.storage.local.get([
                "steps"
            ]);

        const steps =
            result.steps || [];

        steps.push(step);

        await chrome.storage.local.set({
            steps
        });

        console.log("✅ Step Saved:", step);

    } catch (err) {

        console.error(
            "❌ Failed to save step:",
            err
        );
    }
}


// ============================================
// CLEAR RECORDER
// ============================================

async function clearRecorder() {

    await chrome.storage.local.set({

        steps: [],

        isRecording: false,

        recorderOpen: false
    });
}


// ============================================
// INJECT RECORDER
// ============================================

async function injectRecorder(tabId) {

    try {

        await chrome.scripting.insertCSS({

            target: { tabId },

            files: ["styles.css"]
        });

        await chrome.scripting.executeScript({

            target: { tabId },

            files: [
                "content.js",
                "recorder-ui.js"
            ]
        });

        console.log(
            "✅ Recorder Injected"
        );

    } catch (err) {

        console.error(
            "❌ Injection Failed:",
            err
        );
    }
}


// ============================================
// AUTO RE-INJECT AFTER NAVIGATION
// ============================================

chrome.tabs.onUpdated.addListener(

    async (tabId, changeInfo, tab) => {

        if (
            changeInfo.status !== "complete"
        ) {
            return;
        }

        const result =
            await chrome.storage.local.get([
                "recorderOpen",
                "isRecording"
            ]);

        if (!result.recorderOpen) {
            return;
        }

        if (
            !tab.url ||
            tab.url.startsWith("chrome://")
        ) {
            return;
        }

        recordingTabId = tabId;

        await injectRecorder(tabId);

        if (result.isRecording) {

            setTimeout(() => {

                chrome.tabs.sendMessage(

                    tabId,

                    {
                        action:
                            "ENABLE_RECORDING"
                    }
                );

            }, 1000);
        }
    }
);


// ============================================
// MESSAGE LISTENER
// ============================================

chrome.runtime.onMessage.addListener(

    async (message, sender, sendResponse) => {

        // ========================================
        // SAVE STEP
        // ========================================

        if (message.action === "SAVE_STEP") {

            await saveStep(message.step);

            sendResponse({
                success: true
            });

            return true;
        }


        // ========================================
        // START RECORDING
        // ========================================

        if (message.action === "START_RECORDING") {

            console.log(
                "🎥 START_RECORDING"
            );

            await chrome.storage.local.set({

                isRecording: true
            });

            const tabs =
                await chrome.tabs.query({

                    active: true,

                    currentWindow: true
                });

            const activeTab =
                tabs[0];

            if (!activeTab?.id) {
                return;
            }

            recordingTabId =
                activeTab.id;


            // SAVE URL ONLY FIRST TIME

            const result =
                await chrome.storage.local.get([
                    "steps"
                ]);

            const steps =
                result.steps || [];

            if (steps.length === 0) {

                await saveStep({

                    action: "OPEN_URL",

                    data: activeTab.url,

                    locatorType: "",

                    locatorValue: "",

                    locators: {},

                    description:
                        "Launch application URL"
                });
            }


            chrome.tabs.sendMessage(

                recordingTabId,

                {
                    action:
                        "ENABLE_RECORDING"
                }
            );

            sendResponse({
                success: true
            });

            return true;
        }


        // ========================================
        // STOP RECORDING
        // ========================================

        if (message.action === "STOP_RECORDING") {

            console.log(
                "🛑 STOP_RECORDING"
            );

            await chrome.storage.local.set({

                isRecording: false
            });

            if (recordingTabId) {

                chrome.tabs.sendMessage(

                    recordingTabId,

                    {
                        action:
                            "DISABLE_RECORDING"
                    }
                );
            }

            sendResponse({
                success: true
            });

            return true;
        }


        // ========================================
        // CLEAR RECORDER
        // ========================================

        if (message.action === "CLEAR_RECORDER") {

            await clearRecorder();

            sendResponse({
                success: true
            });

            return true;
        }
    }
);


// ============================================
// OPEN UI WHEN CLICKING EXTENSION
// ============================================

chrome.action.onClicked.addListener(

    async (tab) => {

        if (!tab.id)
            return;

        recordingTabId = tab.id;

        await chrome.storage.local.set({

            recorderOpen: true
        });

        await injectRecorder(tab.id);
    }
);