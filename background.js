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

            const tabs =
                await chrome.tabs.query({

                    active: true,
                    currentWindow: true
                });

            const activeTab = tabs[0];

            recordingTabId =
                activeTab.id;

            console.log(
                "🎥 Recording Started:",
                recordingTabId
            );


            // ====================================
            // ENABLE RECORDING
            // ====================================

            setTimeout(() => {

                chrome.tabs.sendMessage(

                    recordingTabId,

                    {
                        action:
                            "ENABLE_RECORDING"
                    }
                );

            }, 500);

            // ====================================
            // SAVE OPEN_URL STEP
            // ====================================

            fetch(
                "http://localhost:8080/record-step",

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        action: "OPEN_URL",

                        locator: "",

                        data: activeTab.url,

                        description:
                            "Open URL"
                    })
                }
            );
        }


        // ========================================
        // STOP RECORDING
        // ========================================

        if (message.action === "STOP_RECORDING") {

            if (recordingTabId) {

                chrome.tabs.sendMessage(

                    recordingTabId,

                    {
                        action:
                            "DISABLE_RECORDING"
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