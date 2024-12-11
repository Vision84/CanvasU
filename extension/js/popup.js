const syncedSwitches = ['tab_icons', 'hide_feedback', 'dark_mode', 'remlogo', 'auto_dark', 'assignments_due', 'gpa_calc', 'gradient_cards', 'disable_color_overlay', 'dashboard_grades', 'dashboard_notes', 'condensed_cards'];
const syncedSubOptions = ['device_dark', 'relative_dues', 'card_overdues', 'gpa_calc_prepend', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignment_date_format', 'grade_hover', 'hover_preview'];
const localSwitches = [];


sendFromPopup("getCards");

// refresh the cards if new ones were just recieved
chrome.storage.onChanged.addListener((changes) => {
    if (changes["custom_cards"]) {
        if (Object.keys(changes["custom_cards"].oldValue).length !== Object.keys(changes["custom_cards"].newValue).length) {
            displayAdvancedCards();
        }
    }
});

function displayErrors() {
    chrome.storage.local.get("errors", storage => {
        storage["errors"].forEach(e => {
            document.querySelector("#error_log_output").value += (e + "\n\n");
        })
    });
}

function displayDarkModeFixUrls() {
    let output = document.getElementById("dark-mode-fix-urls");
    output.textContent = "";
    chrome.storage.sync.get("dark_mode_fix", sync => {
        sync["dark_mode_fix"].forEach(url => {
            let div = makeElement("div", "customization-button", output, url);
            div.classList.add("fixed-url");
            let btn = makeElement("button", "dd", div, "x");
            btn.addEventListener("click", () => {
                chrome.storage.sync.get("dark_mode_fix", sync => {
                    for (let i = 0; i < sync["dark_mode_fix"].length; i++) {
                        if (sync["dark_mode_fix"][i] === url) {
                            sync["dark_mode_fix"].splice(i);
                            chrome.storage.sync.set({ "dark_mode_fix": sync["dark_mode_fix"] }).then(() => div.remove());
                        }
                    }
                });
            })
        })
    })
}

document.addEventListener("DOMContentLoaded", setup);

function setupAssignmentsSlider(initial) {
    let el = document.querySelector('#numAssignmentsSlider');
    el.value = initial;
    document.querySelector('#numAssignments').textContent = initial;
    el.addEventListener('input', function () {
        document.querySelector('#numAssignments').textContent = this.value;
        chrome.storage.sync.set({ "num_assignments": this.value });
    });
}


function setupAutoDarkInput(initial, time) {
    let el = document.querySelector('#' + time);
    el.value = initial.hour + ":" + initial.minute;
    el.addEventListener('change', function () {
        let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
        time === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
    });
}

function setup() {

    const menu = {
        "switches": syncedSwitches,
        "checkboxes": ['show_updates', 'device_dark', 'relative_dues', 'card_overdues', 'gpa_calc_prepend', 'auto_dark', 'assignment_date_format', 'grade_hover', 'hover_preview'],
        "tabs": {
            "advanced-settings": { "setup": displayAdvancedCards, "tab": ".advanced" },
            "gpa-bounds-btn": { "setup": displayGPABounds, "tab": ".gpa-bounds-container" },
            "custom-font-btn": { "setup": displayCustomFont, "tab": ".custom-font-container" },
            "card-colors-btn": { "setup": null, "tab": ".card-colors-container" },
            "customize-dark-btn": { "setup": displayDarkModeFixUrls, "tab": ".customize-dark" },
            "import-export-btn": { "setup": displayThemeList, "tab": ".import-export" },
            "report-issue-btn": { "setup": displayErrors, "tab": ".report-issue-container" },
            "updates-btn": { "setup": null, "tab": ".updates-container" }
        },
        "special": [
            { "identifier": "auto_dark_start", "setup": (initial) => setupAutoDarkInput(initial, "auto_dark_start") },
            { "identifier": "auto_dark_end", "setup": (initial) => setupAutoDarkInput(initial, "auto_dark_end") },
            { "identifier": "num_assignments", "setup": (initial) => setupAssignmentsSlider(initial) },
        ],
    }

    chrome.storage.sync.get(menu.switches, sync => {
        menu.switches.forEach(option => {
            let optionSwitch = document.getElementById(option);
            let status = sync[option] === true ? "#on" : "#off";
            optionSwitch.querySelector(status).checked = true;
            optionSwitch.querySelector(status).classList.add('checked');

            optionSwitch.querySelector(".slider").addEventListener("mouseup", () => {
                let status = !optionSwitch.querySelector("#on").checked;
                optionSwitch.querySelector("#on").checked = status;
                optionSwitch.querySelector("#on").classList.toggle("checked");
                optionSwitch.querySelector("#off").classList.toggle("checked");
                chrome.storage.sync.set({ [option]: status });
                if (option === "auto_dark") {
                    toggleDarkModeDisable(status);
                }
            });
        });
    });

    chrome.storage.sync.get(menu.checkboxes, sync => {
        menu.checkboxes.forEach(option => {
            try {
                document.querySelector("#" + option).addEventListener("change", function (e) {
                    let status = this.checked;
                    chrome.storage.sync.set(JSON.parse(`{"${option}": ${status}}`));
                });
                document.querySelector("#" + option).checked = sync[option];
            } catch {

            }

        });
        /*
        document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
        document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
        document.querySelector("#assignment_date_format").checked = result.assignment_date_format == true;
        document.querySelector("#todo_hr24").checked = result.todo_hr24 == true;
        */
        toggleDarkModeDisable(sync.auto_dark);
    });

    const specialOptions = menu.special.map(obj => obj.identifier);
    chrome.storage.sync.get(specialOptions, sync => {
        menu.special.forEach(option => {
            if (option.setup !== null) option.setup(sync[option.identifier]);
        });
    })

    /*
    // checkboxes
    menu.checkboxes.forEach(checkbox => {
        document.querySelector("#" + checkbox).addEventListener('change', function () {
            let status = this.checked;
            chrome.storage.sync.set(JSON.parse(`{"${checkbox}": ${status}}`));
        });
    });
    */

    // activate tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (menu.tabs[btn.id].setup !== null) menu.tabs[btn.id].setup();
            document.querySelector(".main").style.display = "none";
            document.querySelector(menu.tabs[btn.id].tab).style.display = "block";
            window.scrollTo(0, 0);
        });
    });

    // activate the back buttons on each tab
    document.querySelectorAll(".back-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tab").forEach(tab => {
                tab.style.display = "none";
            });
            document.querySelector(".main").style.display = "block";
        });
    });

    // give everything the appropirate i18n text
    document.querySelectorAll('[data-i18n]').forEach(text => {
        text.innerText = chrome.i18n.getMessage(text.dataset.i18n);
    });

    // activate dark mode inspector button
    document.querySelector("#inspector-btn").addEventListener("click", async function () {
        document.querySelector("#inspector-output").textContent = (await sendFromPopup("inspect"))["selectors"];
    });

    // activate dark mode fixer button
    document.querySelector("#fix-dm-btn").addEventListener("click", async function () {
        let output = await sendFromPopup("fixdm");
        if (output.path === "bettercanvas-none" || output.path === "bettercanvas-darkmode_off") return;
        let rating = "bad";
        if (output.time < 100) {
            rating = "good";
        } else if (output.time < 250) {
            rating = "ok";
        }
        document.getElementById("fix-dm-output").textContent = "Fix took " + Math.round(output.time) + "ms (rating: " + rating + ")";
        chrome.storage.sync.get("dark_mode_fix", sync => {
            if (sync["dark_mode_fix"].includes(output.path)) return;
            sync["dark_mode_fix"].push(output.path);
            chrome.storage.sync.set({ "dark_mode_fix": sync["dark_mode_fix"] }).then(() => displayDarkModeFixUrls());
        })
    });

    // activate storage dump button
    document.querySelector("#rk_btn").addEventListener("click", () => {
        chrome.storage.local.get(null, local => {
            chrome.storage.sync.get(null, sync => {
                document.querySelector("#rk_output").value = JSON.stringify(local) + JSON.stringify(sync);
            })
        })
    });

    // activate custom url input
    document.querySelector('#customDomain').addEventListener('input', function () {
        let domains = this.value.split(",");
        domains.forEach((domain, index) => {
            let val = domain.replace(" ", "");
            if (val === "") return;
            //if (!val.includes("https://") && !val.includes("http://")) val = "https://" + val;
            try {
                let url = new URL(val);
                domains[index] = url.hostname;
                clearAlert();
            } catch (e) {
                domains[index] = val;
                displayAlert("The URL you entered appears to be invalid, so it might not work.");
            }
        });
        chrome.storage.sync.set({ custom_domain: domains });
    });

    // setup custom url
    chrome.storage.sync.get(["custom_domain"], storage => {
        document.querySelector("#customDomain").value = storage.custom_domain ? storage.custom_domain : "";
    });

    // activate import input box
    document.querySelector("#import-input").addEventListener("input", (e) => {
        const obj = JSON.parse(e.target.value);
        importTheme(obj);
    });

    // activate export checkbox
    document.querySelectorAll(".export-details input").forEach(input => {
        input.addEventListener("change", () => {
            chrome.storage.sync.get(syncedSwitches.concat(syncedSubOptions).concat(["dark_preset", "custom_cards", "custom_font", "gpa_calc_bounds"]), async storage => {
                //chrome.storage.local.get(["dark_preset"], async local => {
                let final = {};
                for await (item of document.querySelectorAll(".export-details input")) {
                    if (item.checked) {
                        switch (item.id) {
                            case "export-toggles":
                                final = { ...final, ...(await getExport(storage, syncedSwitches.concat(syncedSubOptions))) };
                                break;
                            case "export-dark":
                                final = { ...final, ...(await getExport(storage, ["dark_preset"])) };
                                break;
                            case "export-cards":
                                final = { ...final, ...(await getExport(storage, ["custom_cards"])) };
                                break;
                            case "export-font":
                                final = { ...final, ...(await getExport(storage, ["custom_font"])) };
                                break;
                            case "export-colors":
                                final = { ...final, ...(await getExport(storage, ["card_colors"])) }
                                break;
                            case "export-gpa":
                                final = { ...final, ...(await getExport(storage, ["gpa_calc_bounds"])) }
                                break;
                        }
                    }
                }
                document.querySelector("#export-output").value = JSON.stringify(final);
                //});
            });
        });
    });

    // activate revert to original button
    document.querySelector("#theme-revert").addEventListener("click", () => {
        chrome.storage.local.get("previous_theme", local => {
            if (local["previous_theme"] !== null) {
                importTheme(local["previous_theme"]);
            }
        });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    });

    document.querySelector("#alert").addEventListener("click", clearAlert);

    document.querySelectorAll(".preset-button.customization-button").forEach(btn => btn.addEventListener("click", changeToPresetCSS));

    // activate card color inputs
    document.querySelector("#singleColorInput").addEventListener("change", e => document.querySelector("#singleColorText").value = e.target.value);
    document.querySelector("#singleColorText").addEventListener("change", e => document.querySelector("#singleColorInput").value = e.target.value);
    document.querySelector("#gradientColorFrom").addEventListener("change", e => document.querySelector("#gradientColorFromText").value = e.target.value);
    document.querySelector("#gradientColorFromText").addEventListener("change", e => document.querySelector("#gradientColorFrom").value = e.target.value);
    document.querySelector("#gradientColorTo").addEventListener("change", e => document.querySelector("#gradientColorToText").value = e.target.value);
    document.querySelector("#gradientColorToText").addEventListener("change", e => document.querySelector("#gradientColorTo").value = e.target.value);
    document.querySelector("#setSingleColor").addEventListener("click", () => {
        let colors = [document.querySelector("#singleColorInput").value];;
        sendFromPopup("setcolors", colors);
    });
    document.querySelector("#setGradientColor").addEventListener("click", () => {
        chrome.storage.sync.get("custom_cards", sync => {
            length = 0;
            Object.keys(sync["custom_cards"]).forEach(key => {
                if (sync["custom_cards"][key].hidden !== true) length++;
            });
            let colors = [];
            let from = document.querySelector("#gradientColorFrom").value;
            let to = document.querySelector("#gradientColorTo").value;
            for (let i = 1; i <= length; i++) {
                colors.push(getColorInGradient(i / length, from, to));
            }
            sendFromPopup("setcolors", colors);
        });
    });

    // activate revert to original card colors button
    document.querySelector("#revert-colors").addEventListener("click", () => {
        chrome.storage.local.get("previous_colors", local => {
            if (local["previous_colors"] !== null) {
                sendFromPopup("setcolors", local["previous_colors"].colors);
            }
        })
    })

    // activate every card color palette button
    document.querySelectorAll(".preset-button.colors-button").forEach(btn => {
        const colors = getPalette(btn.querySelector("p").textContent);
        let preview = btn.querySelector(".colors-preview");
        colors.forEach(color => {
            let div = makeElement("div", "color-preview", preview);
            div.style.background = color;
        });
        btn.addEventListener("click", () => {
            sendFromPopup("setcolors", colors);
        })
    });

    /*
    ['autodark_start', 'autodark_end'].forEach(function (timeset) {
        document.querySelector('#' + timeset).addEventListener('change', function () {
            let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
            timeset === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
        });
    });
    */

    // activate sidebar tool radio
    ["#radio-sidebar-image", "#radio-sidebar-gradient", "#radio-sidebar-solid"].forEach(radio => {
        document.querySelector(radio).addEventListener("click", () => {
            chrome.storage.sync.get(["dark_preset"], storage => {
                let mode = radio === "#radio-sidebar-image" ? "image" : radio === "#radio-sidebar-gradient" ? "gradient" : "solid";
                displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
            });
        })
    });

    // activate left/right theme page buttons
    document.getElementById("premade-themes-left").addEventListener("click", () => displayThemeList(-1));
    document.getElementById("premade-themes-right").addEventListener("click", () => displayThemeList(1));

    // activate theme sort buttons
    document.getElementById("theme-sort-score").addEventListener("click", () => sortThemes("score"));
    document.getElementById("theme-sort-new").addEventListener("click", () => sortThemes("new"));
    document.getElementById("theme-sort-old").addEventListener("click", () => sortThemes("old"));
}

async function getExport(storage, options) {
    let final = {};
    for (const option of options) {
        switch (option) {
            case "custom_cards":
                let arr = [];
                Object.keys(storage["custom_cards"]).forEach(key => {
                    if (storage["custom_cards"][key].img !== "") arr.push(storage["custom_cards"][key].img);
                });
                if (arr.length === 0) {
                    arr = ["none"];
                }
                final["custom_cards"] = arr;
                break;
            case "card_colors":
                final["card_colors"] = [];
                try {
                    final["card_colors"] = await sendFromPopup("getcolors");
                } catch (e) {
                    console.log(e);
                }
                break;
            default:
                final[option] = storage[option];
        }
    }
    return final;
}

function themeSortFn(method) {
    let themes = getTheme("all");
    switch (method) {
        case "new":
            return themes.reverse();
        case "old":
            return themes;
        default:
            return shuffle(themes).sort((a, b) => {
                a = a.score + "";
                b = b.score + "";
                a = parseInt(a.charAt(0)) + parseInt(a.charAt(1)) + parseInt(a.charAt(2)) + parseInt(a.charAt(3));
                b = parseInt(b.charAt(0)) + parseInt(b.charAt(1)) + parseInt(b.charAt(2)) + parseInt(b.charAt(3));
                return b - a;
            });
    }
}

function themeScoreTranslate(score) {
    score = score + "";
    return parseInt(score.charAt(0)) + parseInt(score.charAt(1)) + parseInt(score.charAt(2)) + parseInt(score.charAt(3));
}

function sortThemes(method) {
    allThemes = themeSortFn(method);
    document.querySelectorAll(".theme-sort-btn").forEach(btn => {
        if (btn.id.includes(method)) {
            btn.style.color = "#fff";
            btn.style.background = "var(--inputbg)"
        } else {
            btn.style.color = "#adadad";
            btn.style.background = "none"
        }
    });
    current_page_num = 1;
    displayThemeList(0);
}

// shuffle function for the score sorting so theres no order bias
function shuffle (arr) {
    var j, x, index;
    for (index = arr.length - 1; index > 0; index--) {
        j = Math.floor(Math.random() * (index + 1));
        x = arr[index];
        arr[index] = arr[j];
        arr[j] = x;
    }
    return arr;
}

let current_page_num = 1;
let current_sort = "score";
let allThemes;
sortThemes(current_sort);

function displayThemeList(pageDir = 0) {
    //const keys = Object.keys(themes);
    const perPage = 24;
    const maxPage = Math.ceil(allThemes.length / perPage);
    if (pageDir === -1 && current_page_num > 1) current_page_num--;
    if (pageDir === 1 && current_page_num < maxPage) current_page_num++;
    let container = document.getElementById("premade-themes");
    container.textContent = "";
    let start = (current_page_num - 1) * perPage, end = start + perPage;
    allThemes.forEach((theme, index) => {
        if (index < start || index >= end) return;
        let themeBtn = makeElement("button", "theme-button", container);
        themeBtn.classList.add("customization-button");
        //themeBtn.dataset.theme = theme.title;
        if (!themeBtn.style.background) themeBtn.style.backgroundImage = "linear-gradient(#00000070, #00000070), url(" + theme.preview + ")";
        let split = theme.title.split(" by ");
        makeElement("p", "theme-button-title", themeBtn, split[0]);
        makeElement("p", "theme-button-creator", themeBtn, split[1]);
        //themeBtn.textContent = theme.title.replace(" by ", "");
        themeBtn.addEventListener("click", () => {

            const allOptions = syncedSwitches.concat(syncedSubOptions).concat(["dark_preset", "custom_cards", "custom_font", "gpa_calc_bounds", "card_colors"]);
            chrome.storage.sync.get(allOptions, sync => {
                chrome.storage.local.get(["previous_theme"], async local => {
                    if (local["previous_theme"] === null) {
                        let previous = await getExport(sync, allOptions);
                        chrome.storage.local.set({ "previous_theme": previous });
                    }
                    importTheme(theme.exports);
                });
            });
        });
    });
    document.getElementById("premade-themes-pagenum").textContent = current_page_num + " of " + maxPage;
}

function getTheme(name) {

    const themes = []

    if (name === "all") return themes;
    for (const theme in themes) if (theme.title === name) return theme
    return {};
}

function importTheme(theme) {
    try {
        let keys = Object.keys(theme);
        let final = {};
        chrome.storage.sync.get("custom_cards", sync => {
            keys.forEach(key => {
                switch (key) {
                    case "dark_preset":
                        changeToPresetCSS(null, theme["dark_preset"]);
                        break;
                    case "card_colors":
                        sendFromPopup("setcolors", theme["card_colors"]);
                        break;
                    case "custom_cards":
                        if (theme["custom_cards"].length > 0) {
                            let pos = 0;
                            Object.keys(sync["custom_cards"]).forEach(key => {
                                sync["custom_cards"][key].img = theme["custom_cards"][pos];
                                pos = (pos === theme["custom_cards"].length - 1) ? 0 : pos + 1;
                            });
                        }
                        final["custom_cards"] = sync["custom_cards"];
                        break;
                    default:
                        final[key] = theme[key];
                        break;
                }
            });
            chrome.storage.sync.set(final);
        });
    } catch (e) {
        console.log(e);
    }
}

function updateCards(key, value) {
    chrome.storage.sync.get(["custom_cards"], result => {
        chrome.storage.sync.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } }, () => {
            if (chrome.runtime.lastError) {
                displayAlert("The data you're entering is exceeding the storage limit, so it won't save. Try using shorter links, and make sure to press \"copy image address\" and not \"copy image\" for links.");
            }
        })
    });
}

function displayCustomFont() {
    chrome.storage.sync.get(["custom_font"], storage => {
        let el = document.querySelector(".custom-font");
        let linkContainer = document.querySelector(".custom-font-flex") || makeElement("div", "custom-font-flex", el);
        linkContainer.innerHTML = '<span>https://fonts.googleapis.com/css2?family=</span><input class="card-input" id="custom-font-link"></input>';
        let link = linkContainer.querySelector("#custom-font-link");
        link.value = storage.custom_font.link;

        link.addEventListener("change", function (e) {
            let linkVal = e.target.value.split(":")[0];
            let familyVal = linkVal.replace("+", " ");
            linkVal += linkVal === "" ? "" : ":wght@400;700";
            familyVal = linkVal === "" ? "" : "'" + familyVal + "'";
            chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": familyVal } });
            link.value = linkVal;
        });

        const popularFonts = ["Arimo", "Barriecito", "Barlow", "Caveat", "Cinzel", "Comfortaa", "Corben", "DM Sans", "Expletus Sans", "Happy Monkey", "Inconsolata", "Inria Sans", "Jost", "Kanit", "Karla", "Lobster", "Lora", "Montserrat", "Nanum Myeongjo", "Open Sans", "Oswald", "Permanent Marker", "Playfair Display", "Poppins", "Quicksand", "Rakkas", "Redacted Script", "Roboto Mono", "Rubik", "Silkscreen", "Tektur"];
        let quickFonts = document.querySelector("#quick-fonts");
        quickFonts.textContent = "";
        let noFont = makeElement("button", "customization-button", quickFonts, "None");
        noFont.addEventListener("click", () => {
            chrome.storage.sync.set({ "custom_font": { "link": "", "family": "" } });
            link.value = "";
        })
        popularFonts.forEach(font => {
            let btn = makeElement("button", "customization-button", quickFonts, font);
            btn.addEventListener("click", () => {
                let linkVal = font.replace(" ", "+") + ":wght@400;700";
                chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": "'" + font + "'" } });
                link.value = linkVal;
            });
        });
    });
}

function displayGPABounds() {
    chrome.storage.sync.get(["gpa_calc_bounds"], storage => {
        const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
        const el = document.querySelector(".gpa-bounds");
        el.textContent = "";
        order.forEach(key => {
            let inputs = makeElement("div", "gpa-bounds-item", el);
            inputs.innerHTML += '<div><span class="gpa-bounds-grade"></span><input class="gpa-bounds-input gpa-bounds-cutoff" type="text"></input><span style="margin-left:6px;margin-right:6px;">%</span><input class="gpa-bounds-input gpa-bounds-gpa" type="text" value=></input><span style="margin-left:6px">GPA</span></div>';
            inputs.querySelector(".gpa-bounds-grade").textContent = key;
            inputs.querySelector(".gpa-bounds-cutoff").value = storage["gpa_calc_bounds"][key].cutoff;
            inputs.querySelector(".gpa-bounds-gpa").value = storage["gpa_calc_bounds"][key].gpa;

            inputs.querySelector(".gpa-bounds-cutoff").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "cutoff": parseFloat(e.target.value) } } });
                });
            });

            inputs.querySelector(".gpa-bounds-gpa").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "gpa": parseFloat(e.target.value) } } });
                });
            });
        });
    });
}

let removeAlert = null;

function clearAlert() {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "-400px";
}

function displayAlert(msg) {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "0";
    document.querySelector("#alert").textContent = msg;
    removeAlert = setTimeout(() => {
        clearAlert();
    }, 15000);
}

function setCustomImage(key, val) {
    if (val !== "" && val !== "none") {
        let test = new Image();
        test.onerror = () => {
            displayAlert("It seems that the image link you provided isn't working. Make sure to right click on any images you want to use and select \"copy image address\" to get the correct link.");

            // ensures storage limit error will override previous error
            updateCards(key, { "img": val });
        }
        test.onload = clearAlert;
        test.src = val;
    }
    updateCards(key, { "img": val });
}

function displayAdvancedCards() {
    sendFromPopup("getCards");
    chrome.storage.sync.get(["custom_cards", "custom_cards_2"], storage => {
        document.querySelector(".advanced-cards").innerHTML = '<div id="advanced-current"></div><div id="advanced-past"><h2>Past Courses</h2></div>';
        const keys = storage["custom_cards"] ? Object.keys(storage["custom_cards"]) : [];
        if (keys.length > 0) {
            let currentEnrollment = keys.reduce((max, key) => storage["custom_cards"][key]?.eid > max ? storage["custom_cards"][key].eid : max, -1);
            keys.forEach(key => {
                let term = document.querySelector("#advanced-past");
                if (storage["custom_cards"][key].eid === currentEnrollment) {
                    term = document.querySelector("#advanced-current");
                }
                let card = storage["custom_cards"][key];
                let card_2 = storage["custom_cards_2"][key] || {};
                if (!card || !card_2 || !card_2["links"] || card_2["links"]["custom"]) {
                    console.log(key + " error...");
                    console.log("card = ", card, "card_2", card_2, "links", card_2["links"]);
                } else {
                    let container = makeElement("div", "custom-card", term);
                    container.classList.add("option-container");
                    container.innerHTML = '<div class="custom-card-header"><p class="custom-card-title"></p><div class="custom-card-hide"><p class="custom-key">Hide</p></div></div><div class="custom-card-inputs"><div class="custom-card-left"><div class="custom-card-image"><span class="custom-key">Image</span></div><div class="custom-card-name"><span class="custom-key">Name</span></div><div class="custom-card-code"><span class="custom-key">Code</span></div></div><div class="custom-links-container"><p class="custom-key">Links</p><div class="custom-links"></div></div></div>';
                    let imgInput = makeElement("input", "card-input", container.querySelector(".custom-card-image"));
                    let nameInput = makeElement("input", "card-input", container.querySelector(".custom-card-name"));
                    let codeInput = makeElement("input", "card-input", container.querySelector(".custom-card-code"));
                    let hideInput = makeElement("input", "card-input-checkbox", container.querySelector(".custom-card-hide"));
                    imgInput.placeholder = "Image url";
                    nameInput.placeholder = "Custom name";
                    codeInput.placeholder = "Custom code";
                    hideInput.type = "checkbox";
                    imgInput.value = card.img;
                    nameInput.value = card.name;
                    codeInput.value = card.code;
                    hideInput.checked = card.hidden;
                    if (card.img && card.img !== "") container.style.background = "linear-gradient(155deg, #1e1e1eeb 20%, #1e1e1ecc), url(\"" + card.img + "\") center / cover no-repeat";
                    imgInput.addEventListener("change", e => {
                        setCustomImage(key, e.target.value);
                        container.style.background = e.target.value === "" ? "var(--containerbg)" : "linear-gradient(155deg, #1e1e1eeb 20%, #1e1e1ecc), url(\"" + e.target.value + "\") center / cover no-repeat";
                    });
                    nameInput.addEventListener("change", function (e) { updateCards(key, { "name": e.target.value }) });
                    codeInput.addEventListener("change", function (e) { updateCards(key, { "code": e.target.value }) });
                    hideInput.addEventListener("change", function (e) { updateCards(key, { "hidden": e.target.checked }) });
                    container.querySelector(".custom-card-title").textContent = card.default;

                    for (let i = 0; i < 4; i++) {
                        let customLink = makeElement("input", "card-input", container.querySelector(".custom-links"));
                        customLink.value = card_2.links[i].is_default ? "default" : card_2.links[i].path;
                        customLink.addEventListener("change", function (e) {
                            chrome.storage.sync.get("custom_cards_2", storage => {
                                let newLinks = storage.custom_cards_2[key].links;
                                if (e.target.value === "" || e.target.value === "default") {
                                    console.log("this value is empty....")
                                    //newLinks[i] = { "type": storage.custom_cards_2[key].links.default[i].type, "default": true };
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": true, "path": newLinks[i].default };
                                    customLink.value = "default";
                                } else {
                                    //newLinks[i] = { "type": getLinkType(e.target.value), "path": e.target.value, "default": false };
                                    let val = e.target.value;
                                    if (!e.target.value.includes("https://") && e.target.value !== "none") val = "https://" + val;
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": false, "path": val };
                                    customLink.value = val;
                                }
                                chrome.storage.sync.set({ "custom_cards_2": { ...storage.custom_cards_2, [key]: { ...storage.custom_cards_2[key], "links": newLinks } } })
                            });
                        });
                    }
                };
            });
        } else {
            document.querySelector(".advanced-cards").innerHTML = `<div class="option-container"><h3>Couldn't find your cards!<br/>You may need to refresh your Canvas page and/or this menu page.<br/><br/>If you're having issues please contact me - ksucpea@gmail.com</h3></div>`;
        }
    });
}

/*
chrome.runtime.onMessage.addListener(message => {
    if (message === "getCardsComplete") {
        displayAdvancedCards();
    }
});
*/

/*
syncedSwitches.forEach(function (option) {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.sync.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });

    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;
        chrome.storage.sync.set({ [option]: status });
        if (option === "auto_dark") {
            toggleDarkModeDisable(status);
        }
    });
});
*/

/*
localSwitches.forEach(option => {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.local.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });
    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;
        chrome.storage.local.set({ [option]: status });

        /*
        switch (option) {
            case 'dark_mode': chrome.storage.local.set({ dark_mode: status }); sendFromPopup("darkmode"); break;
        }
        /
    });
});
*/

function toggleDarkModeDisable(disabled) {
    let darkSwitch = document.querySelector('#dark_mode');
    if (disabled === true) {
        darkSwitch.classList.add('switch_disabled');
        darkSwitch.style.pointerEvents = "none";
    } else {
        darkSwitch.classList.remove('switch_disabled');
        darkSwitch.style.pointerEvents = "auto";
    }
}

// customization tab

function getPalette(name) {
    const colors = {
        "Blues": ["#ade8f4", "#90e0ef", "#48cae4", "#00b4d8", "#0096c7"],
        "Reds": ["#e01e37", "#c71f37", "#b21e35", "#a11d33", "#6e1423"],
        "Rainbow": ["#ff0000", "#ff5200", "#efea5a", "#3cf525", "#147df5", "#be0aff"],
        "Candy": ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
        "Purples": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"],
        "Pastels": ["#fff1e6", "#fde2e4", "#fad2e1", "#bee1e6", "#cddafd"],
        "Ocean": ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"],
        "Sunset": ["#eaac8b", "#e56b6f", "#b56576", "#6d597a", "#355070"],
        "Army": ["#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6", "#ddbea9", "#cb997e"],
        "Pinks": ["#ff0a54", "#ff5c8a", "#ff85a1", "#ff99ac", "#fbb1bd"],
        "Watermelon": ["#386641", "#6a994e", "#a7c957", "#f2e8cf", "#bc4749"],
        "Popsicle": ["#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"],
        "Chess": ["#ffffff", "#000000"],
        "Greens": ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#52b788"],
        "Fade": ["#ff69eb", "#ff86c8", "#ffa3a5", "#ffbf81", "#ffdc5e"],
        "Oranges": ["#ffc971", "#ffb627", "#ff9505", "#e2711d", "#cc5803"],
        "Mesa": ["#f6bd60", "#f28482", "#f5cac3", "#84a59d", "#f7ede2"],
        "Berries": ["#4cc9f0", "#4361ee", "#713aed", "#9348c3", "#f72585"],
        "Fade2": ["#f2f230", "#C2F261", "#91f291", "#61F2C2", "#30f2f2"],
        "Muted": ["#E7E6F7", "#E3D0D8", "#AEA3B0", "#827081", "#C6D2ED"],
        "Base": ["#e3b505", "#95190C", "#610345", "#107E7D", "#044B7F"],
        "Fruit": ["#7DDF64", "#C0DF85", "#DEB986", "#DB6C79", "#ED4D6E"],
        "Night": ["#25171A", "#4B244A", "#533A7B", "#6969B3", "#7F86C6"]
    }
    return colors[name] || [];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function getColorInGradient(d, from, to) {
    let pat = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    var exec1 = pat.exec(from);
    var exec2 = pat.exec(to);
    let a1 = [parseInt(exec1[1], 16), parseInt(exec1[2], 16), parseInt(exec1[3], 16)];
    let a2 = [parseInt(exec2[1], 16), parseInt(exec2[2], 16), parseInt(exec2[3], 16)];
    let rgb = a1.map((x, i) => Math.floor(a1[i] + d * (a2[i] - a1[i])));
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

/*
function getColors(preset) {
    console.log(preset)
    Object.keys(preset).forEach(key => {
        try {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = preset[key];
                changer.addEventListener("change", function (e) {
                    changeCSS(key, e.target.value);
                });
            });
        } catch (e) {
            console.log("couldn't get " + key)
            console.log(e);
        }
    });
}
*/

/*
function getColors2(data) {
    const colors = data.split(":root")[1].split("--bcstop")[0];
    const backgroundcolors = document.querySelector("#option-background");
    const textcolors = document.querySelector("#option-text");
    colors.split(";").forEach(function (color) {
        const type = color.split(":")[0].replace("{", "").replace("}", "");
        const currentColor = color.split(":")[1];
        if (type) {
            let container = makeElement("div", "changer-container", type.includes("background") ? backgroundcolors : textcolors);
            let colorChange = makeElement("input", "card-input", container);
            let colorChangeText = makeElement("input", "card-input", container);
            colorChangeText.type = "text";
            colorChangeText.value = currentColor;
            colorChange.type = "color";
            colorChange.value = currentColor;
            [colorChange, colorChangeText].forEach(changer => {
                changer.addEventListener("change", function (e) {
                    changeCSS(type, e.target.value);
                });
            });
        }
    })
}
*/

function displaySidebarMode(mode, style) {
    style = style.replace(" ", "");
    let match = style.match(/linear-gradient\((?<color1>\#\w*),(?<color2>\#\w*)\)/);
    let c1 = c2 = "#000000";

    if (mode === "image") {
        document.querySelector("#radio-sidebar-image").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "flex";
        if (style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1.replace("c7", "");
            if (match.groups.color2) c2 = match.groups.color2.replace("c7", "");
        }
        let url = style.match(/url\(\"(?<url>.*)\"\)/);
        document.querySelector('#sidebar-image input[type="text"]').value = url && url.groups.url ? url.groups.url : "";
    } else if (mode === "gradient") {
        document.querySelector("#radio-sidebar-gradient").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "none";
        if (!style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1;
            if (match.groups.color2) c2 = match.groups.color2;
        }
    } else {
        document.querySelector("#radio-sidebar-solid").checked = true;
        document.querySelector("#sidebar-color2").style.display = "none";
        document.querySelector("#sidebar-image").style.display = "none";
        c1 = match ? "#000000" : style;
    }

    document.querySelector('#sidebar-color1 input[type="text"]').value = c1;
    document.querySelector('#sidebar-color1 input[type="color"]').value = c1;
    document.querySelector('#sidebar-color2 input[type="text"]').value = c2;
    document.querySelector('#sidebar-color2 input[type="color"]').value = c2;
}

let presetChangeTimeout = null;

chrome.storage.sync.get(["dark_preset"], storage => {
    let tab = document.querySelector(".customize-dark");
    Object.keys(storage["dark_preset"]).forEach(key => {
        if (key !== "sidebar") {
            let c = tab.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = storage["dark_preset"][key];
                changer.addEventListener("input", function (e) {
                    clearTimeout(presetChangeTimeout);
                    presetChangeTimeout = setTimeout(() => changeCSS(key, e.target.value), 200);
                });
            });
        } else {
            let mode = storage["dark_preset"][key].includes("url") ? "image" : storage["dark_preset"][key].includes("gradient") ? "gradient" : "solid";
            displaySidebarMode(mode, storage["dark_preset"][key]);
            let changeSidebar = () => {
                let c1 = tab.querySelector('#sidebar-color1 input[type="text"]').value.replace("c7", "");
                let c2 = tab.querySelector('#sidebar-color2 input[type="text"]').value.replace("c7", "");
                let url = tab.querySelector('#sidebar-image input[type="text"]').value;
                if (tab.querySelector("#radio-sidebar-image").checked) {
                    changeCSS(key, `linear-gradient(${c1}c7, ${c2}c7), center url("${url}")`);
                } else if (tab.querySelector("#radio-sidebar-gradient").checked) {
                    changeCSS(key, `linear-gradient(${c1}, ${c2})`);
                } else {
                    changeCSS(key, c1);
                }
            }
            ["#sidebar-color1", "#sidebar-color2"].forEach(group => {
                ['input[type="text"]', 'input[type="color"]'].forEach(input => {
                    document.querySelector(group + " " + input).addEventListener("input", e => {
                        ['input[type="text"]', 'input[type="color"]'].forEach(i => {
                            document.querySelector(group + " " + i).value = e.target.value;
                        });
                        clearTimeout(presetChangeTimeout);
                        presetChangeTimeout = setTimeout(() => changeSidebar(), 200);
                    });
                });
            });
            document.querySelector('#sidebar-image input[type="text"').addEventListener("change", () => changeSidebar());
        }
    });
});

function refreshColors() {
    chrome.storage.sync.get(["dark_preset"], storage => {
        Object.keys(storage["dark_preset"]).forEach(key => {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            color.value = storage["dark_preset"][key];
            text.value = storage["dark_preset"][key];
        });
        let mode = storage["dark_preset"]["sidebar"].includes("url") ? "image" : storage["dark_preset"]["sidebar"].includes("gradient") ? "gradient" : "solid";
        displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
    });
}

function changeCSS(name, color) {
    chrome.storage.sync.get("dark_preset", storage => {
        storage["dark_preset"][name] = color;
        chrome.storage.sync.set({ "dark_preset": storage["dark_preset"] }).then(() => refreshColors());
    });
}

function changeToPresetCSS(e, preset = null) {
    const presets = {
        "dark-lighter": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "sidebar": "#353535", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-light": { "background-0": "#202020", "background-1": "#2e2e2e", "background-2": "#4e4e4e", "borders": "#404040", "sidebar": "#2e2e2e", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-default": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" },
        "dark-dark": { "background-0": "#101010", "background-1": "#121212", "background-2": "#1a1a1a", "borders": "#272727", "sidebar": "#121212", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-darker": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "sidebar": "#000000", "text-0": "#c5c5c5", "text-1": "#c5c5c5", "text-2": "#c5c5c5", "links": "#c5c5c5", "sidebar-text": "#c5c5c5" },
        "dark-blue": { "background-0": "#14181d", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
        "dark-mint": { "background-0": "#0f0f0f", "background-1": "#0c0c0c", "background-2": "#141414", "borders": "#1e1e1e", "sidebar": "#0c0c0c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#7CF3CB", "sidebar-text": "#f5f5f5" },
        "dark-burn": { "background-0": "#ffffff", "background-1": "#ffffff", "background-2": "#ffffff", "borders": "#cccccc", "sidebar": "#ffffff", "text-0": "#cccccc", "text-1": "#cccccc", "text-2": "#cccccc", "links": "#cccccc", "sidebar-text": "#cccccc" },
        "dark-unicorn": { "background-0": "#ff6090", "background-1": "#00C1FF", "background-2": "#FFFF00", "borders": "#FFFF00", "sidebar": "#00C1FF", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff", "links": "#000000", "sidebar-text": "#ffffff" },
        "dark-lightmode": { "background-0": "#ffffff", "background-1": "#f5f5f5", "background-2": "#d4d4d4", "borders": "#c7cdd1", "links": "#04ff00", "sidebar": "#04ff00", "sidebar-text": "#ffffff", "text-0": "#2d3b45", "text-1": "#919191", "text-2": "#a5a5a5" },
        "dark-catppuccin": { "background-0": "#11111b", "background-1": "#181825", "background-2": "#1e1e2e", "borders": "#4f5463", "text-0": "#cdd6f4", "text-1": "#7f849c", "text-2": "#a6e3a1", "links": "#f5c2e7", "sidebar": "#181825", "sidebar-text": "#7f849c" },
        "dark-sage": { "background-0": "#2f3e46", "background-1": "#354f52", "background-2": "#52796f", "borders": "#84a98c", "links": "#d8f5c7", "sidebar": "#354f52", "sidebar-text": "#e2e8de", "text-0": "#e2e8de", "text-1": "#cad2c5", "text-2": "#adb1aa" },
        "dark-pink": { "background-0": "#ffffff", "background-1": "#ffe0ed", "background-2": "#ff0066", "borders": "#ff007b", "links": "#ff0088", "sidebar": "#f490b3", "sidebar-text": "#ffffff", "text-0": "#ff0095", "text-1": "#ff8f8f", "text-2": "#ff5c5c" },
    }
    if (preset === null) preset = presets[e.target.id] || presets["default"];
    applyPreset(preset);
}

function applyPreset(preset) {
    chrome.storage.sync.set({ "dark_preset": preset }).then(() => refreshColors());
}

/*
function setToDefaults() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ "dark_css": result["dark_css"], "dark_preset": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" } }).then(() => refreshColors());
        });
}
*/

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

async function sendFromPopup(message, options = {}) {

    let response = new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true }).then(async tabs => {
            for (let i = 0; i < tabs.length; i++) {
                try {
                    let res = await chrome.tabs.sendMessage(tabs[i].id, { "message": message, "options": options });
                    if (res) resolve(res);
                } catch (e) {
                }
            }
            resolve(null);
        });
    })

    return await response;
}