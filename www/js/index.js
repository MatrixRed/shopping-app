function barcodeScan() {
  resetFunc(activeTab);
  ons.disableDeviceBackButtonHandler();
  cordova.plugins.barcodeScanner.scan(
    async function (result) {
      if (result.cancelled) {
        return;
      }
      await submitSearch(result.text, "barcode");
    },
    function (error) {
      ons.notification.alert(
        "Error scanning object, check app camera permissions."
      );
      showModalSpinner(false);
    },
    {
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false, // Android
      saveHistory: false, //Android
      prompt: "", // Android
      resultDisplayDuration: 0, // Android
      orientation: "portrait", // Android
      disableAnimations: false, // iOS
      disableSuccessBeep: false,
    }
  );
}

//GLOBAL VARIABLES
let debugMode = true;
let fullArray = [];
let dropArray = [];
let instructionsArr = [];
let featuredReady = false;
let cclsReady = false;
let materialsReady = false;
let instructionsReady = false;
let dropListID;
let connErr = false;
let jsonEmpty = false;
let valueTally = 0;
let valueTallyTab = 0;
let globalSearch;
let searchLoaded = false;
let instructionsLoaded = false;
let clicked = 0;
let singleArray = [];
let chosenDropper = "";
let onsenPageID;
let backToResultsPage = false;
let featuredProds = [];
let councilArr = [];
let materialsArr = [];
let linkToSite = "";
let noEntry = false;
let fetchHeaders = "";
let activeTab = "";
let initialBoot = true;
let systemGreen = "rgb(11, 78, 28)";
let systemRed = "rgb(255, 59, 48)";
let systemOrange = "rgb(255, 149, 0)";
let asyncTallyTab = 0;

// Local storage
let storage = window.localStorage;
let regionStorageKey = "region";
let region = storage.getItem(regionStorageKey);

// necessary to delete
delete window.open;

/**
 * Resets all necessary variables.
 * @param  {number} resetSwitch - page to reset. 0 = home page. 1 = region select. 2 = info page.
 */
function resetFunc(resetSwitch) {
  let resetBar;

  switch (resetSwitch) {
    case 0:
      resetBar = "searchBar";
      break;
    case 1:
      resetBar = "searchBar2";
      break;
    case 2:
      resetBar = "searchBar3";
      break;
  }

  toggleDropList("destroy", resetBar);
  let srchBrs = document.getElementsByClassName("searchBars");
  Array.from(srchBrs).forEach((a) => {
    a.value = "";
  });

  fullArray = [];
  dropArray = [];
  jsonEmpty = false;
  connErr = false;
  singleArray = [];
  valueTally = 0;
  globalSearch = "";
  clicked = 0;
  asyncTallyTab = 0;
  searchLoaded = true;
  instructionsLoaded = true;
}

/**
 * Removes focus from (blurs) the selected element.
 * @param  {string} inputToBlur - id of input to blur.
 */
function blurInput(inputToBlur) {
  var chosenBar = document.getElementById(inputToBlur);
  chosenBar.blur();
  chosenBar.value = "";
  var cleanDropper =
    activeTab == 0
      ? "dropdownList"
      : activeTab == 1
      ? "dropdownList2"
      : "dropdownList3";
  document.getElementById(cleanDropper).innerHTML = "";
  dropArray = [];
}

/**
 * Sets the current region and saves it to local storage.
 * @param  {String} newRegion The new region.
 */
function setRegion(newRegion) {
  region = newRegion;
  storage.setItem(regionStorageKey, newRegion);
}

/**
 * Get instructions for region.
 * @param  {String} regionID The region ID that instructions should be fetched for.
 * @param  {String} fromStorage Specifies if the ID is taken from phone storage, or API call.
 */
async function getInstructions(sel, fromStorage) {
  if (document.getElementById("dropdownList2")) {
    document.getElementById("dropdownList2").innerHTML = "";
    dropArray = [];
    asyncTallyTab = 0;
  }

  instructionsLoaded = false;
  if (fromStorage == false) {
    setTimeout(function () {
      if (instructionsLoaded == false) {
        showModalSpinner(false);
        ons.notification.alert(
          "Could not connect, check your connection and try again later."
        );
        noEntry = true;
      }
    }, 10000);

    showModalSpinner(true);
    councilID = sel.id.split("council").join("");
  } else {
    councilID = region;
  }

  await fetch(apiURL, {
    method: "POST",
    mode: "cors",
    headers: fetchHeaders,
    body: JSON.stringify(councilID),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("err");
      }
    })
    .then((json) => {
      if (json.error || json.empty) {
        if (fromStorage == false) {
          instructionsLoaded = true;
          showModalSpinner(false);
          ons.notification.alert(
            "Could not connect, check your connection and try again later."
          );
        }
        if (debugMode == true) {
          if (json.error) {
            console.log("getInstructions json error - " + json.err);
          } else if (json.empty) {
            console.log("getInstructions json is empty - " + json.empty);
          }
        }
        noEntry = true;
      } else {
        instructionsArr = json;
        instructionsLoaded = true;
        if (document.getElementById("council" + region)) {
          document
            .getElementById("council" + region)
            .classList.remove("regionHL");
        }
        let cclArray = councilArr.filter(
          (ccl) => ccl.idCouncils == councilID
        )[0];
        setRegion(cclArray.idCouncils);

        let cclName = cclArray.nameCouncils;
        noEntry = false;
        // below is because SQL sometimes creates a space character that javascript cannot read.
        for (var x = 0; x < instructionsArr.length; x++) {
          for (var objElmt in instructionsArr[x]) {
            if (
              instructionsArr[x][objElmt].includes(String.fromCharCode(160))
            ) {
              instructionsArr[x][objElmt] = instructionsArr[x][objElmt].replace(
                /\u00a0/g,
                String.fromCharCode(32)
              );
            }
          }

          // associate each instruction with the correct material (SQL only connects by ID not name / group string)
          var tempMatArr = materialsArr.filter(
            (inna) => inna.idMaterials == instructionsArr[x].idMaterial
          );
          instructionsArr[x].nameMaterial = tempMatArr[0].nameMaterials;
          instructionsArr[x].groupMaterial = tempMatArr[0].groupMaterials;
        }
        let backToHome = () => {
          setRegion(councilID);
          if (debugMode == true) {
            console.log("getInstructions backToHome region = " + region);
          }
          document.getElementById("navTab").setTabbarVisibility(true);
          document.getElementById("navTab").setActiveTab(0);
          activeTab = 0;
          document.getElementById("selectHeader").classList.add("dispNone");
          document
            .getElementById("searchCon2")
            .classList.add("searchContainer");
          document.getElementById("searchBar2").classList.remove("dispNone");
          document.getElementById("searchButton2").classList.remove("dispNone");
          document.getElementById("img2").classList.remove("dispNone");

          showModalSpinner(false);
        };

        document
          .getElementById(fromStorage == false ? sel.id : "council" + councilID)
          .classList.add("regionHL");

        // IOS by default has 400ms delay for click events
        if (ons.platform.isIOS()) {
          backToHome();
        } else {
          setTimeout(backToHome, 400);
        }
      }
    })
    .catch((err) => {
      if (fromStorage == false) {
        instructionsLoaded = true;
        ons.notification.alert(
          "Could not connect, check your connection and try again later."
        );
      }
      showModalSpinner(false);
      if (debugMode == true) {
        console.log("getInstructions fetch call error - " + err);
      }
      noEntry = true;
    });
}

/**
 * Filters search results based on brand when user clicks corresponding element.
 * @param that - the element that has been clicked.
 */
function brandNarrow(that) {
  document.getElementById("narrow").innerHTML = "";
  let infiniteList = document.getElementById("infinite-list");
  let filtArr = fullArray.filter((el) => el.brand == that.innerHTML);
  infiniteList.delegate = {
    createItemContent: function (index) {
      let fulla = filtArr[index];

      //product image path goes here
      let imageSrc = "PATH-TO-IMAGE";
      return ons.createElement(
        `<ons-list-item onclick="resultsClick(this)" id='${fulla.idProducts}'>
                      <div style="width: 30%">
                        <img src="${imageSrc}" width="100%" style="opacity: 0; border-radius: 4px/3px;" onload="this.style.opacity = '1'">
                      </div>
                      <div style="width: 65%; margin-left: 5%;">
                        <div>${fulla.item}</div>
                        <div class="list-item__subtitle">${fulla.brand}
                        </div>
                      </div>
                    </ons-list-item>`
      );
    },
    countItems: function () {
      return filtArr.length;
    },
  };
  infiniteList.refresh();
}

/**
 * openBrowser will pass a link to cordova inAppBrowser plugin function.
 * @param {string} linkURL - URL of website to open.
 * nested cordova.inAppBrowser.open opens a URL link.
 * @param {string} linkURL - URL of website to open.
 * @param {string} target - options are - "_self": Opens in Cordova WebView if URL is in white list, otherwise in InAppBrowser.
 * "._blank": Opens in the InAppBrowser. "_system": Opens in the system's web browser.
 */
function openBrowser(linkURL) {
  cordova.InAppBrowser.open(linkURL, "_system");
}

/**
 * Opens single product page for the drop-down element that has been clicked.
 * @param that - element that has been clicked.
 */
function dropdownClick(that) {
  if (clicked < 1) {
    fn.load("productPage.html", that);
  }
  clicked += 1;
}

/**
 * Creates or destroys a dropdown list.
 * @param {string} choice - create or destroy the dropdown list.
 * @param listChoice - the element / drop-down list to edit (from home page, region page or info page).
 */
async function toggleDropList(choice, listChoice) {
  switch (listChoice) {
    case "searchBar":
      dropListID = "dropdownList";
      break;
    case "searchBar2":
      dropListID = "dropdownList2";
      break;
    case "searchBar3":
      dropListID = "dropdownList3";
      break;
  }

  if (document.getElementById(dropListID)) {
    chosenDropper = document.getElementById(dropListID);

    if (choice == "destroy") {
      chosenDropper.innerHTML = "";
    } else if (choice == "create") {
      if (valueTallyTab != globalSearch.length) {
        chosenDropper.innerHTML = "";
        await submitSearch(globalSearch, "drop", listChoice);
      }
    }
  }
}

/**
 * Makes an API call to search for products.
 * @param {string} eventValue - the text that has been searched.
 * @param {string} mode - drop-down search, full text search or barcode search.
 * @param {string} dropperID - the element ID of the dropdown list.
 */
async function submitSearch(eventValue, mode, dropperID) {
  var sendEvent = eventValue;
  if (mode == "drop" && valueTallyTab == globalSearch.length) {
    return;
  } else {
    valueTallyTab = globalSearch.length;
    if (mode == "drop") {
      ++asyncTallyTab;
      sendEvent = asyncTallyTab + "sOOb=StraNg2" + eventValue;
    } else {
      asyncTallyTab = 0;
    }
    let url;
    if (mode == "barcode") {
      url = apiURL;
    } else {
      url = "";
      if (mode == "full") {
        url = apiURL;
      } else {
        url = apiURL;
      }
    }
    if (valueTally > 2 || mode == "barcode") {
      if (mode == "full" || mode == "barcode") {
        searchLoaded = false;

        var searchTimeout = setTimeout(function () {
          var timeoutMsg = "";
          if (searchLoaded == false) {
            connErr = true;
            if (mode == "barcode") {
              timeoutMsg = "barcode timeout";
              ons.notification.alert(
                "Could not connect, check your connection and try again later."
              );
            } else {
              fn.load("resultsPage.html");
              timeoutMsg = "full search timeout";
            }
            showModalSpinner(false);
            if (debugMode == true) {
              console.log(timeoutMsg);
            }
          }
        }, 10000);

        showModalSpinner(true);
      }

      await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: fetchHeaders,
        body: JSON.stringify(sendEvent),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("err");
          }
        })
        .then((json) => {
          switch (mode) {
            case "full":
              if (connErr == false) {
                searchLoaded = true;
                clearTimeout(searchTimeout);
                if (json.error) {
                  connErr = true;
                  fn.load("resultsPage.html");
                  showModalSpinner(false);
                  if (debugMode == true) {
                    console.log("submitSearch full json error - " + json.err);
                  }
                  break;
                } else if (json.empty) {
                  jsonEmpty = true;
                  fn.load("resultsPage.html");
                  showModalSpinner(false);
                  if (debugMode == true) {
                    console.log(
                      "submitSearch full json empty - " + JSON.stringify(json)
                    );
                  }
                  break;
                } else {
                  fullArray = json;
                  fn.load("resultsPage.html");
                  if (debugMode == true) {
                    console.log(
                      "submitSearch full json - " + JSON.stringify(json)
                    );
                  }
                }
              }
              break;
            case "drop":
              if (json.error || json.empty) {
                if (asyncTallyTab == json.asyncChecker) {
                  toggleDropList("destroy", dropperID);
                  dropArray = [];
                }
                if (debugMode == true) {
                  console.log(
                    "submitSearch drop json error/empty - " +
                      JSON.stringify(json)
                  );
                }
                break;
              } else {
                if (asyncTallyTab == json[json.length - 1].asyncChecker) {
                  toggleDropList("destroy", dropperID);
                  dropArray = json;
                  dropArray.forEach((dropped, index) => {
                    if (
                      chosenDropper.children.length < 5 &&
                      index != dropArray.length - 1
                    ) {
                      let onsItem = document.createElement("div");
                      onsItem.id = index + "drop";
                      onsItem.innerHTML = `<ons-list-item class="whiteTop" onclick="dropdownClick(this)">
                        <div class="right whiteTop" id='${dropped.idProducts}'>
                        <ons-icon icon='fa-search' size="16px" style="color: rgb(60, 60, 60);"></ons-icon>
                        </div>
                        <div class="row">
                          <small>
                          <span class="bold textColor">${dropped.item}</span>
                          ${
                            dropped.showBrand == "Yes"
                              ? `<br> - ` + dropped.brand + `</small>`
                              : `<br> </small>`
                          }
                        </div>
                      </ons-list-item>`;
                      return chosenDropper.appendChild(onsItem);
                    }
                  });
                  var focusDiv = "scrollToHome";
                  switch (activeTab) {
                    case 0:
                      focusDiv = "scrollToHome";
                      break;
                    case 1:
                      focusDiv = "scrollToRegion";
                      break;
                    case 2:
                      focusDiv = "scrollToInfo";
                      break;
                    default:
                  }
                  document
                    .getElementById(focusDiv)
                    .scrollIntoView({ behavior: "smooth", block: "end" });
                }
              }
              if (debugMode == true) {
                console.log("submitSearch json - " + JSON.stringify(json));
              }
              break;
            case "barcode":
              if (connErr == false) {
                searchLoaded = true;
                clearTimeout(searchTimeout);
                if (json.error) {
                  if (debugMode == true) {
                    console.log(
                      "submitSearch barcode json error - " + json.err
                    );
                  }
                  ons.notification.alert(
                    "Could not connect, check your connection and try again later."
                  );
                  showModalSpinner(false);
                  break;
                } else if (json.empty) {
                  ons.notification.alert("Sorry, no result found.");
                  showModalSpinner(false);
                  if (debugMode == true) {
                    console.log(
                      "submitSearch barcode json empty - " +
                        JSON.stringify(json)
                    );
                  }
                  break;
                } else {
                  singleArray = Array.from(json).filter(
                    (el) => el.barcode == eventValue
                  );
                  if (singleArray.length > 0) {
                    document
                      .getElementById("myNavigator")
                      .pushPage("productPage.html");
                  }
                  if (debugMode == true) {
                    console.log(
                      "singleArray barcode json - " + JSON.stringify(json)
                    );
                  }
                }
              }
              break;
            default:
              fullArray = json;
          }
          clicked = 0;
          if (mode == "full" || mode == "barcode") {
            showModalSpinner(false);
          }
        })
        .catch((err) => {
          if (mode != "barcode") {
            toggleDropList("destroy", dropperID);
          } else {
            ons.notification.alert(
              "Could not connect, check your connection and try again later."
            );
          }
          if (debugMode == true) {
            console.log("submitSearch fetch call error - " + err);
          }
          connErr = true;
          if (mode == "full") {
            fn.load("resultsPage.html");
            clicked = 0;
          }
          if (mode == "full" || mode == "barcode") {
            showModalSpinner(false);
          }
        });
    }
  }
}

/**
 * Opens the product page for the element that has been clicked.
 * @param that - element that has been clicked.
 */
function resultsClick(that) {
  backToResultsPage = true;
  fn.load("productPage.html", that);
}

document.addEventListener(
  "backbutton",
  function (e) {
    if (backToResultsPage == true) {
      backToResultsPage = false;
    } else if (noEntry == true && region == null) {
      document.getElementById("myNavigator").popPage({
        times: 2,
      });
    } else {
      resetFunc(activeTab);
    }
  },
  false
);

document.addEventListener("deviceready", onDeviceReady, false);

/**
 * Fires when cordova deviceready event is ready.
 */
function onDeviceReady() {
  fetchHeaders = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (ons.platform.isIOS()) {
    fetchHeaders.append("X-Requested-With", "XmlHttpRequest");
  }

  navigator.splashscreen.show();

  featuredReady = false;
  cclsReady = false;
  materialsReady = false;
  instructionsReady = false;

  fetch(apiURL, {
    method: "POST",
    mode: "cors",
    headers: fetchHeaders,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("err");
      }
    })
    .then((json) => {
      if (json.error || json.empty) {
        if (debugMode == true) {
          if (json.error) {
            console.log("getCouncils json error - " + json.err);
          } else if (json.empty) {
            console.log("getCouncils json is empty - " + json.empty);
          }
        }
        return;
      } else {
        if (debugMode == true) {
          console.log("onDeviceReady current region: " + region);
        }

        // Format the data
        councilArr = json;
        for (var x = 0; x < councilArr.length; x++) {
          for (var objElmt in councilArr[x]) {
            if (councilArr[x][objElmt].includes(String.fromCharCode(160))) {
              councilArr[x][objElmt] = councilArr[x][objElmt].replace(
                /\u00a0/g,
                String.fromCharCode(32)
              );
            }
          }
        }

        // Clear regionScroll
        document.getElementById("regionScroll").innerHTML = "";

        // Populate regionScroll with councils
        let currentRegionInList = false;
        councilArr.forEach((ccl) => {
          let cclID = "council" + ccl.idCouncils;
          let rgScrollDiv = document.createElement("div");
          rgScrollDiv.classList.add("pad10", "regionSel");
          rgScrollDiv.onclick = function () {
            getInstructions(this, false);
          };
          if (ccl.idCouncils == region) {
            rgScrollDiv.classList.add("regionHL");
            currentRegionInList = true;
          }
          rgScrollDiv.id = cclID;
          rgScrollDiv.innerHTML = ccl.nameCouncils;
          return document
            .getElementById("regionScroll")
            .appendChild(rgScrollDiv);
        });
        cclsReady = true;

        // If no council selected or current region not found, go to council tab
        if (region == null || currentRegionInList == false) {
          if (debugMode == true) {
            if (currentRegionInList == false) {
              console.log("onDeviceReady region not found in retrieved data");
            } else {
              console.log("onDeviceReady region is null");
            }
          }
          document.getElementById("navTab").setActiveTab(1);
          document.getElementById("navTab").setTabbarVisibility(false);
        } else {
          getInstructions(this, true);
        }
      }
    })
    .catch((err) => {
      if (debugMode == true) {
        console.log("getCouncils fetch call error - " + err);
      }
      return;
    });

  fetch(apiURL, {
    method: "POST",
    mode: "cors",
    headers: fetchHeaders,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("err");
      }
    })
    .then((json) => {
      if (json.error || json.empty) {
        if (debugMode == true) {
          if (json.error) {
            console.log("featuredProds json error - " + json.err);
          } else if (json.empty) {
            console.log("featuredProds json is empty - " + json.empty);
          }
        }
        return;
      } else {
        featuredProds = json;
        featuredProds.forEach((prod, index) => {
          let num = index + 1;

          //product image path goes here
          let prodImg = "PATH-TO-IMAGE";
          prod.idProducts = "caro" + num;
          document.getElementById("progressBar").style.display = "none";
          let caroItem = ons.createElement(
            `<ons-carousel-item id='caro${num}' onclick="fn.load('productPage.html', this)"><img src="${prodImg}" alt="..." class='carouselImg'><div class='caroItemTitle'><small>${prod.item}</small></div></ons-carousel-item>`
          );
          return document.getElementById("caroBody").appendChild(caroItem);
        });
        featuredReady = true;
      }
    })
    .catch((err) => {
      if (debugMode == true) {
        console.log("featuredProds fetch call error - " + err);
      }
      return;
    });

  fetch(apiURL, {
    method: "POST",
    mode: "cors",
    headers: fetchHeaders,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("err");
      }
    })
    .then((json) => {
      if (json.error || json.empty) {
        if (debugMode == true) {
          if (json.error) {
            console.log("fetch materials json error - " + json.err);
          } else if (json.empty) {
            console.log("fetch materials json is empty - " + json.empty);
          }
        }
        return;
      } else {
        materialsArr = json;
        materialsReady = true;
      }
    })
    .catch((err) => {
      if (debugMode == true) {
        console.log("get materials fetch call error - " + err);
      }
      return;
    });

  let interval = null;
  interval = setInterval(intFunction, 200);

  /**
   * Checks every 0.2s if necessary data has loaded so that we can enter the app
   */
  function intFunction() {
    if (materialsReady == true && cclsReady == true && featuredReady == true) {
      if (region != null) {
        if (instructionsArr.length > 0) {
          clearInterval(interval);
          navigator.splashscreen.hide();
        }
      } else {
        clearInterval(interval);
        navigator.splashscreen.hide();
      }
    }
  }

  setTimeout(function () {
    if (
      materialsReady == false ||
      cclsReady == false ||
      featuredReady == false ||
      (storage.getItem(regionStorageKey) != null && instructionsLoaded == false)
    ) {
      navigator.splashscreen.hide();
      clearInterval(interval);
      ons.notification
        .alert("Could not connect, check your connection and try again later.")
        .then(onDeviceReady);
    }
  }, 15000);
}

/**
 * init checks when app has initialized
 */
document.addEventListener("init", function (event) {
  onsenPageID = event.target.id;
  onsenPageElmt = event.target;

  /**
   * ons.ready fires when onsen is ready
   */
  ons.ready(function () {
    if (initialBoot == true) {
      let bottomTabbar = document.getElementById("navTab");

      /**
       * postchange  fires after bottom tabbar page has changed
       */
      bottomTabbar.addEventListener("postchange", function () {
        activeTab = bottomTabbar.getActiveTabIndex();
        let tabNum = "";
        switch (activeTab) {
          case 0:
            tabNum = "";
            break;
          case 1:
            tabNum = "2";
            break;
          case 2:
            tabNum = "3";
            break;
          default:
            break;
        }

        if (document.getElementById("searchButton" + tabNum)) {
          document
            .getElementById("searchButton" + tabNum)
            .addEventListener("click", searchButtonClick, false);
        }

        if (document.getElementById("searchBar" + tabNum)) {
          document
            .getElementById("searchBar" + tabNum)
            .addEventListener("input", dropInit, false);
        }
      });

      document
        .getElementById("navTab")
        .addEventListener("prechange", function () {
          return resetFunc(activeTab);
        });

      if (ons.platform.isIPhoneX() || ons.platform.isIPad()) {
        Array.from(
          document.getElementsByClassName("navContainer")
        ).forEach((n) => n.classList.add("navContainerIOS"));
        Array.from(document.getElementsByClassName("toolbarCenter")).forEach(
          (t) => (t.style.marginTop = "18px")
        );
        Array.from(document.getElementsByClassName("dropdownLists")).forEach(
          (d) => (d.style.top = "85px")
        );
        document.getElementById("regionScroll").style.marginTop = "108px";
        Array.from(document.getElementsByClassName("toolbarCenter")).forEach(
          (t) => (t.style.marginTop = "25px")
        );
        Array.from(document.getElementsByTagName("body")).forEach(
          (b) => (b.style.paddingBottom = "34px")
        );
        Array.from(
          document.getElementsByClassName("ons-tabbar__footer")
        ).forEach((o) => (o.style.paddingBottom = "32px"));
      } else {
        if (ons.platform.isIOS()) {
          Array.from(document.getElementsByClassName("toolbarImg")).forEach(
            (o) => (o.style.marginTop = "5px")
          );
        }
        Array.from(document.getElementsByClassName("leftBack")).forEach(
          (l) => (l.classList.remove = "leftBackIOS")
        );
      }
    }

    initialBoot = false;

    ons.enableDeviceBackButtonHandler();

    let navStack = document.getElementById("myNavigator");
    window.fn = {};

    /**
     * Opens product page for the element that has been clicked.
     * @param {string} destination - destination page to load and push onto the navigation stack.
     * @param that - optional element that has called the function.
     */
    window.fn.load = function (destination, that) {
      if (destination == "resultsPage.html") {
        return navStack.pushPage(destination);
      }

      if (destination == "productPage.html") {
        let thatID = that.id;

        if (that.parentElement.parentElement.id.includes("drop")) {
          thatID = that.children[1].id;
        }

        if (thatID.includes("caro")) {
          singleArray = featuredProds.filter((el) => el.idProducts == thatID);
        } else if (dropArray.length == 0) {
          singleArray = fullArray.filter((el) => el.idProducts == thatID);
        } else {
          singleArray = dropArray.filter((el) => el.idProducts == thatID);
        }
        return navStack.pushPage(destination);
      }

      if (destination == "infoPage.html") {
        return navStack.pushPage("infoPage.html", {
          data: that,
        });
      }
    };

    /**
     * Pops the page from the navigation stack.
     * @param {string} option - specifies if we are on the product page after coming from the results page.
     */
    window.fn.pop = function (option) {
      if (backToResultsPage != true) {
        resetFunc(activeTab);
      }
      if (option == "prod") {
        backToResultsPage = false;
      }
      navStack.popPage();
    };

    if (onsenPageID === "resultsPage.html") {
      let narrow = document.getElementById("narrow");
      if (connErr == true) {
        narrow.innerHTML =
          '<p class="textColor">Could not connect, check your connection and try again later.</p>';
      } else if (jsonEmpty == true) {
        narrow.innerHTML =
          "<p class='textColor bold'>Your search did not return any results.</p>" +
          "<p><small class='textColor'>Check your spelling and try searching for a specific product by name.</small></p>";
      } else {
        let brandArray = [];
        for (var g = 0; g < fullArray.length; g++) {
          if (brandArray.length < 9) {
            if (fullArray[g].showBrand == "Yes") {
              if (!brandArray.includes(fullArray[g].brand)) {
                brandArray.push(fullArray[g].brand);
              }
            }
          } else {
            break;
          }
        }

        let brandArrayOutput = [];
        for (var h = 0; h < brandArray.length; h++) {
          brandArrayOutput.push(
            `<div class="brandFlexChild" onclick="brandNarrow(this)">${brandArray[h]}</div>`
          );
        }

        if (brandArrayOutput.length > 1) {
          narrow.innerHTML =
            '<h3 class="black narrowHead">Narrow Search By Brand</h3><div id="brandFlex">' +
            brandArrayOutput.join("") +
            "</div>";
        } else {
          narrow.innerHTML = "";
        }
        let infiniteList = document.getElementById("infinite-list");
        infiniteList.delegate = {
          createItemContent: function (index) {
            let fulla = fullArray[index];

            //product image path goes here
            let imageSrc = "PATH-TO-IMAGE";
            return ons.createElement(
              `<ons-list-item onclick="resultsClick(this)" id='${
                fulla.idProducts
              }'>
                      <div style="width: 30%">
                        <img src="${imageSrc}" width="100%">
                      </div>
                      <div style="width: 65%; margin-left: 5%;">
                        <div class="bold textColor">${fulla.item}</div>
                        ${
                          fulla.showBrand == "Yes"
                            ? `<div>` + fulla.brand + `</div>`
                            : ``
                        }
                      </div>
                    </ons-list-item>`
            );
          },
          countItems: function () {
            return fullArray.length;
          },
        };
        infiniteList.refresh();
      }
    }

    if (onsenPageID == "productPage.html") {
      let singleArr = singleArray[0];

      //product image path goes here
      let imgString = "PATH-TO-IMAGE";
      linkToSite = singleArr.website;
      return (document.getElementById(
        "productPageContent"
      ).innerHTML = `<ons-card class='card marginTopIOS'>
                <img src='${imgString}' alt='...' style='border-radius: 1%; width: 100%; max-width: 480px; display: block; margin: 0 auto; box-shadow: 2px 5px 8px #a8a8a8; opacity: 0;' onload='this.style.opacity = "1"'>
                <div style='text-align: center; margin: 5%;'>
                ${
                  singleArr.showBrand == "Yes"
                    ? `<h5 class='textColor'>${singleArr.brand}</h5>`
                    : ``
                }
                <h4${
                  singleArr.showBrand == "Yes"
                    ? `>`
                    : ` class='bold textColor'>`
                }${singleArr.item}</h4>
                </div>
                    <div class='content'>
                    ${
                      (singleArr.prodInfo != null &&
                        singleArr.prodInfo != "") ||
                      (singleArr.website != null && singleArr.website != "")
                        ? `<div class='productTitle'>
                <h5 style="color: white;">Product Information</h5>
                </div>`
                        : ""
                    }
                ${
                  singleArr.prodInfo != null && singleArr.prodInfo != ""
                    ? `<ons-list-item>
                    ${singleArr.prodInfo}
                </ons-list-item>`
                    : ""
                }
                ${
                  singleArr.website != null && singleArr.website != ""
                    ? `<ons-list-item class='textColor'>
                <div style="width: 13%;" onclick="openBrowser(linkToSite)">
                <ons-icon icon="fa-globe" class="list-item__icon"></ons-icon>
                </div>
                <div style="width: 87%;">
                <a onclick="openBrowser(linkToSite)"><h4 style='text-decoration: underline;'>Product Web Link</h4></a>
                </div>
            </ons-list-item>`
                    : ""
                }
                    </div>
            </ons-card>`);
    }

    if (onsenPageID == "regionChoice.html") {
      councilArr.forEach((ccl) => {
        let cclID = "council" + ccl.idCouncils;
        let rgScrollDiv = document.createElement("div");
        rgScrollDiv.classList.add("regionScrollDiv");
        rgScrollDiv.innerHTML = `<div id=${cclID} class="regionPlain cntr${
          ccl.idCouncils == region ? " regionHL" : ""
        }" onclick="getInstructions(this, false)"><div><img src="${
          ccl.imgCouncils + "?query=true"
        }"></div><div class='textColor bold'>${ccl.nameCouncils}</div></div>`;
        if (region == rgScrollDiv.children[0].id) {
          rgScrollDiv.children[0].classList.add("regionHL");
        }
        return document.getElementById("regionScroll").appendChild(rgScrollDiv);
      });
    }

    if (onsenPageID == "infoPage.html") {
      firstInfo = false;
      var infoText = navStack.topPage.data;
      document.getElementById(
        "infoPageTitle"
      ).innerHTML = `<div class="infoPageTitleText">${infoText.title}</div><img class="infoPageImg" src="${infoText.image}">`;
      document.getElementById("infoPageText").innerHTML = infoText.info;
    }

    /**
     * Fires when user clicks search button (not enter on the phone keyboard).
     */
    async function searchButtonClick() {
      if (globalSearch.length > 2) {
        let chooseMe = "";
        switch (activeTab) {
          case 0:
            chooseMe = "searchBar";
            break;
          case 1:
            chooseMe = "searchBar2";
            break;
          case 2:
            chooseMe = "searchBar3";
            break;
        }
        toggleDropList("destroy", chooseMe);
        clicked += 1;
        if (clicked < 2) {
          await submitSearch(globalSearch, "full");
          dropArray = [];
          clicked = 0;
        }
      }
    }
  });

  window.addEventListener("keyboardDidShow", () => {
    var scrollID = "homeScroller";
    var focusDiv = "scrollToHome";
    switch (activeTab) {
      case 0:
        scrollID = "homeScroller";
        focusDiv = "scrollToHome";
        break;
      case 1:
        scrollID = "regionScroller";
        focusDiv = "scrollToRegion";
        break;
      case 2:
        scrollID = "infoScroller";
        focusDiv = "scrollToInfo";
        break;
      default:
    }
    document.getElementById(scrollID).classList.add("noInteraction");
    document
      .getElementById(focusDiv)
      .scrollIntoView({ behavior: "smooth", block: "end" });
  });

  window.addEventListener("keyboardWillHide", () => {
    switch (activeTab) {
      case 0:
        scrollID = "homeScroller";
        break;
      case 1:
        scrollID = "regionScroller";
        break;
      case 2:
        scrollID = "infoScroller";
        break;
      default:
    }
    document.getElementById(scrollID).classList.remove("noInteraction");
  });

  /**
   * Toggles drop list based on user search
   * @param event - the event fired from user searching.
   * @param {string} event.target.value - the search term input into the search box.
   */
  function dropInit(event) {
    globalSearch = event.target.value;
    valueTally = globalSearch.length;
    if (clicked == 0) {
      dropArray = [];
    }
    if (valueTally > 2) {
      toggleDropList("create", this.id);
    }
  }
});

/**
 * Shows or hides a fullscreen modal loading spinner, which is element 'loadModal'.
 * @param  {Boolean} show true shows the spinner, false hides it.
 */
function showModalSpinner(show) {
  var modal = document.getElementById("loadModal");
  if (show == true) {
    modal.show();
  } else {
    modal.hide();
  }
}

/**
 * Submit a search when user hits enter on the keyboard
 */
document.addEventListener(
  "keyup",
  (e) => {
    var code = e.keyCode || e.which;
    if (code == 13) {
      (async function searchButtonClickCopy() {
        if (globalSearch.length > 2) {
          let chooseMe = "";
          switch (activeTab) {
            case 0:
              chooseMe = "searchBar";
              break;
            case 1:
              chooseMe = "searchBar2";
              break;
            case 2:
              chooseMe = "searchBar3";
              break;
          }
          toggleDropList("destroy", chooseMe);
          clicked += 1;
          if (clicked < 2) {
            document.getElementById(chooseMe).blur();
            await submitSearch(globalSearch, "full");
            dropArray = [];
            clicked = 0;
          }
        }
      })();
    }
  },
  false
);
