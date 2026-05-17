let recordingTabId = null;


// ============================================
// LISTEN FOR MESSAGES
// ============================================

chrome.runtime.onMessage.addListener(

    async (message, sender, sendResponse) => {

        // ========================================
        // START RECORDING
        // ========================================

        if (message.action === "START_RECORDING") {

            const tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

            const activeTab = tabs[0];

            recordingTabId = activeTab.id;

            console.log(
                "🎥 Recording Started:",
                recordingTabId
            );

            // SAVE RECORDING STATE
            chrome.storage.local.set({
                isRecording: true
            });

            // ENABLE RECORDING
            chrome.tabs.sendMessage(
                recordingTabId,
                {
                    action: "ENABLE_RECORDING"
                }
            );

            // SAVE OPEN_URL STEP
            fetch("http://localhost:8080/record-step", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    action: "OPEN_URL",

                    locator: "",

                    data: activeTab.url,

                    description: "Open URL"
                })
            });
        }


        // ========================================
        // STOP RECORDING
        // ========================================

        if (message.action === "STOP_RECORDING") {

            chrome.storage.local.set({
                isRecording: false
            });

            if (recordingTabId) {

                chrome.tabs.sendMessage(
                    recordingTabId,
                    {
                        action: "DISABLE_RECORDING"
                    }
                );

                console.log(
                    "🛑 Recording Stopped"
                );
            }
        }


        sendResponse({
            success: true
        });

        return true;
    }
);


// ============================================
// RE-ENABLE RECORDING AFTER PAGE NAVIGATION
// ============================================

chrome.tabs.onUpdated.addListener(

    async (tabId, changeInfo, tab) => {

        // PAGE FULLY LOADED
        if (changeInfo.status === "complete") {

            // CHECK RECORDING STATE
            const result =
                await chrome.storage.local.get(
                    "isRecording"
                );

            // IF RECORDING ACTIVE
            if (result.isRecording) {

                console.log(
                    "🔄 Re-enabling recording on new page"
                );

                // WAIT FOR CONTENT SCRIPT
                setTimeout(() => {

                    chrome.tabs.sendMessage(
                        tabId,
                        {
                            action: "ENABLE_RECORDING"
                        }
                    );

                }, 1000);
            }
        }
    }
);