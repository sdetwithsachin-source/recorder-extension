document
    .getElementById("start")
    .addEventListener(

        "click",

        () => {

            chrome.runtime.sendMessage({

                action: "START_RECORDING"
            });

            console.log(
                "🎥 Recording Started"
            );
        }
    );


document
    .getElementById("stop")
    .addEventListener(

        "click",

        () => {

            chrome.runtime.sendMessage({

                action: "STOP_RECORDING"
            });

            console.log(
                "🛑 Recording Stopped"
            );
        }
    );