console.log(
    "Recorder UI Injected"
);


// =======================================
// PREVENT DUPLICATE PANEL
// =======================================

if (

    document.getElementById(
        "playwright-recorder-panel"
    )

) {

    console.log(
        "Recorder already exists"
    );

} else {

    createRecorderUI();
}


// =======================================
// CREATE UI
// =======================================

function createRecorderUI() {

    const panel =
        document.createElement("div");

    panel.id =
        "playwright-recorder-panel";

    panel.innerHTML = `

        <div id="recorder-header">

            <span>
                🎥 Playwright Recorder
            </span>

            <div>

                <button id="minimize-btn">
                    —
                </button>

                <button id="close-btn">
                    ✖
                </button>

            </div>

        </div>

        <div id="recorder-body">

            <div id="button-container">

                <button id="start-recording">
                    ▶ Start Recording
                </button>

                <button id="stop-recording">
                    ⏹ Stop Recording
                </button>

            </div>

            <div id="table-wrapper">

                <table id="steps-table">

                    <thead>

                        <tr>

                            <th>Action</th>

                            <th>Data</th>

                            <th>Locator Type</th>

                            <th>Locator Value</th>

                            <th>Description</th>

                            <th>Delete</th>

                        </tr>

                    </thead>

                    <tbody id="steps-body">

                    </tbody>

                </table>

            </div>

        </div>
    `;

    document.body.appendChild(
        panel
    );


    // ===================================
    // START RECORDING
    // ===================================

    document
        .getElementById(
            "start-recording"
        )
        .onclick = async () => {

            chrome.runtime.sendMessage({

                action:
                    "START_RECORDING"
            });

            console.log(
                "🎥 Recording Started"
            );
        };

    // ===================================
    // STOP
    // ===================================

    document
        .getElementById(
            "stop-recording"
        )
        .onclick = () => {

            chrome.runtime.sendMessage({

                action:
                    "STOP_RECORDING"
            });
        };


    // ===================================
    // CLOSE
    // ===================================

    document
        .getElementById(
            "close-btn"
        )
        .onclick = async () => {

            chrome.runtime.sendMessage({

                action: "STOP_RECORDING"
            });

            chrome.runtime.sendMessage({

                action: "CLEAR_RECORDER"
            });

            panel.remove();

            console.log(
                "❌ Recorder Closed"
            );
        };


    // ===================================
    // MINIMIZE
    // ===================================

    let minimized = false;

    document
        .getElementById(
            "minimize-btn"
        )
        .onclick = () => {

            minimized =
                !minimized;

            document
                .getElementById(
                    "recorder-body"
                )
                .style.display =

                minimized
                    ? "none"
                    : "block";
        };


    makeDraggable(panel);

    loadSteps();
}


// =======================================
// LOAD STEPS
// =======================================

function loadSteps() {

    const tableBody =

        document.getElementById(
            "steps-body"
        );

    setInterval(async () => {

        const result =

            await chrome.storage.local.get([
                "steps"
            ]);

        const steps =
            result.steps || [];

        tableBody.innerHTML = "";


        steps.forEach((step, index) => {

            const row =
                document.createElement("tr");


            const locatorOptions =

                Object.keys(
                    step.locators || {}
                )

                    .filter(key =>
                        step.locators[key]
                    )

                    .map(locator => `

                        <option
                            value="${locator}"

                            ${locator === step.locatorType
                            ? "selected"
                            : ""}

                        >

                            ${locator}

                        </option>

                    `).join("");


            row.innerHTML = `

                <td>
                    ${step.action}
                </td>

                <td>
                    ${step.data || ""}
                </td>

                <td>

                    ${step.action === "OPEN_URL"

                    ? ""

                    :

                    `

                    <select
                        class="locator-dropdown"
                        data-index="${index}"
                    >

                        ${locatorOptions}

                    </select>

                    `
                }

                </td>

                <td class="locator-cell">

                    ${step.action === "OPEN_URL"

                    ?

                    `<a href="${step.data}"
                        target="_blank">

                        ${step.data}

                    </a>`

                    :

                    step.locatorValue || ""
                }

                </td>

                <td>
                    ${step.description}
                </td>

                <td>

                    <button
                        class="delete-btn"
                        data-index="${index}"
                    >

                        Delete

                    </button>

                </td>
            `;

            tableBody.appendChild(row);
        });


        // DELETE

        document
            .querySelectorAll(".delete-btn")

            .forEach((btn) => {

                btn.onclick =
                    async () => {

                        const index =
                            btn.dataset.index;

                        steps.splice(index, 1);

                        await chrome.storage.local.set({
                            steps
                        });
                    };
            });


        // LOCATOR CHANGE

        document
            .querySelectorAll(".locator-dropdown")

            .forEach((dropdown) => {

                dropdown.onchange =
                    async (e) => {

                        const index =
                            e.target.dataset.index;

                        const locatorType =
                            e.target.value;

                        steps[index].locatorType =
                            locatorType;

                        steps[index].locatorValue =
                            steps[index]
                                .locators[
                            locatorType
                            ];

                        await chrome.storage.local.set({
                            steps
                        });
                    };
            });

    }, 500);
}


// =======================================
// DRAG PANEL
// =======================================

function makeDraggable(panel) {

    const header =

        document.getElementById(
            "recorder-header"
        );

    let isDragging = false;

    let offsetX = 0;

    let offsetY = 0;


    header.addEventListener(

        "mousedown",

        (e) => {

            isDragging = true;

            offsetX =
                e.clientX -
                panel.offsetLeft;

            offsetY =
                e.clientY -
                panel.offsetTop;
        }
    );


    document.addEventListener(

        "mousemove",

        (e) => {

            if (!isDragging)
                return;

            panel.style.left =

                `${e.clientX - offsetX}px`;

            panel.style.top =

                `${e.clientY - offsetY}px`;
        }
    );


    document.addEventListener(

        "mouseup",

        () => {

            isDragging = false;
        }
    );
}