(function(thisObj) {
    "use strict";

    // ---- minColor pill theme (self-contained copy; neutrals only — AE remaps custom hues) ----
    function flatButton(parent, label, opts) {
        opts = opts || {};
        var b = parent.add("iconbutton", undefined, undefined, { style: "toolbutton" });
        b.textLabel = label; b.hov = false; b.dn = false;
        var hgt = opts.height || 24;
        if (opts.width) { b.preferredSize = [opts.width, hgt]; b.maximumSize = [opts.width, hgt]; }
        else { b.preferredSize.height = hgt; b.alignment = ["fill", "center"]; }
        if (opts.tip) b.helpTip = opts.tip;
        b.onDraw = function () {
            var g = this.graphics, s = this.size;
            function pill(x, y, w, h, col) {
                g.newPath();
                g.ellipsePath(x, y, h, h);
                g.ellipsePath(x + w - h, y, h, h);
                g.rectPath(x + h / 2, y, w - h, h);
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, col));
            }
            /* Spectrum 2: accent (blue, filled) + a QUIET secondary. Grey is a HOVER state, never a
               resting button. Accent darkens on hover; secondary = transparent + 2px grey outline at
               rest, grey fill on hover. Labels soft (not pure white). See ae-scriptui-theme-palette. */
            var accent = [0.00784, 0.39608, 0.86275, 1];
            if (opts.primary) {
                var fill = this.dn ? [accent[0] * 0.68, accent[1] * 0.68, accent[2] * 0.68, 1]
                         : this.hov ? [accent[0] * 0.82, accent[1] * 0.82, accent[2] * 0.82, 1] : accent;
                pill(0, 0, s[0], s[1], fill);
                pill(1, 1, s[0] - 2, s[1] - 2, fill);
            } else {
                var rimA = this.dn ? 0.34 : this.hov ? 0.32 : 0.26;
                var center = this.dn ? [0.24, 0.24, 0.24, 1] : this.hov ? [0.30, 0.30, 0.30, 1] : [0.13, 0.13, 0.13, 1];
                pill(0, 0, s[0], s[1], [1, 1, 1, rimA]);
                pill(2, 2, s[0] - 4, s[1] - 4, center);
            }
            var f = ScriptUI.newFont("dialog", opts.primary ? "BOLD" : "REGULAR", opts.fontSize || 11);
            var ts = g.measureString(this.textLabel, f);
            var textCol = opts.primary ? [0.97, 0.97, 0.97, 1] : [0.86, 0.86, 0.86, 1];
            g.drawString(this.textLabel, g.newPen(g.PenType.SOLID_COLOR, textCol, 1),
                         Math.max(2, (s[0] - ts.width) / 2), Math.max(0, (s[1] - ts.height) / 2 - 1), f);
        };
        b.addEventListener("mouseover", function () { this.hov = true;  try { this.window.update(); } catch (e) {} });
        b.addEventListener("mouseout",  function () { this.hov = false; this.dn = false; try { this.window.update(); } catch (e) {} });
        b.addEventListener("mousedown", function () { this.dn = true;  try { this.window.update(); } catch (e) {} });
        b.addEventListener("mouseup",   function () { this.dn = false; try { this.window.update(); } catch (e) {} });
        return b;
    }
    
    // Build UI
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Frame Calculator & Calculator", undefined, {resizeable: true});
        
        if (panel != null) {
            panel.orientation = "column";
            panel.alignChildren = "fill";
            panel.spacing = 10;
            panel.margins = 10;
            
            // Header-style tab bar: glyph + label, selected = bold + underline (tabs navigate;
            // pills act — deliberately different grammar; neutrals only per the hue gotcha)
            function tabItem(parent, label, glyph, width) {
                var b = parent.add("iconbutton", undefined, undefined, { style: "toolbutton" });
                b.textLabel = label; b.hov = false; b.sel = false;
                b.preferredSize = [width, 26]; b.maximumSize = [width, 26];
                b.onDraw = function () {
                    var g = this.graphics, s = this.size;
                    if (this.hov && !this.sel) { g.newPath(); g.rectPath(0, 0, s[0], s[1]); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1, 0.05])); }
                    var lum = this.sel ? 0.95 : 0.60;
                    glyph(g, lum);
                    var f = ScriptUI.newFont("dialog", this.sel ? "BOLD" : "REGULAR", 11);
                    var ts = g.measureString(this.textLabel, f);
                    g.drawString(this.textLabel, g.newPen(g.PenType.SOLID_COLOR, [lum, lum, lum, 1], 1), 22, Math.max(0, (s[1] - ts.height) / 2 - 2), f);
                    if (this.sel) { g.newPath(); g.rectPath(0, s[1] - 2, s[0], 2); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1, 0.85])); }
                    else if (this.hov) { g.newPath(); g.rectPath(0, s[1] - 2, s[0], 2); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1, 0.20])); }
                };
                b.addEventListener("mouseover", function () { this.hov = true;  try { this.window.update(); } catch (e) {} });
                b.addEventListener("mouseout",  function () { this.hov = false; try { this.window.update(); } catch (e) {} });
                return b;
            }
            function frameGlyph(g, lum) {                            /* tiny filmstrip */
                var pn = g.newPen(g.PenType.SOLID_COLOR, [lum, lum, lum, 1], 1.2);
                g.newPath(); g.rectPath(2, 7, 14, 10); g.strokePath(pn);
                var br = g.newBrush(g.BrushType.SOLID_COLOR, [lum, lum, lum, 1]);
                g.newPath(); g.rectPath(4.5, 9, 3.5, 6); g.fillPath(br);
                g.newPath(); g.rectPath(10, 9, 3.5, 6); g.fillPath(br);
            }
            function calcGlyph(g, lum) {                             /* tiny calculator */
                var pn = g.newPen(g.PenType.SOLID_COLOR, [lum, lum, lum, 1], 1.2);
                g.newPath(); g.rectPath(3, 6, 12, 12); g.strokePath(pn);
                var br = g.newBrush(g.BrushType.SOLID_COLOR, [lum, lum, lum, 1]);
                g.newPath(); g.rectPath(5, 8, 8, 2.2); g.fillPath(br);
                for (var gy = 0; gy < 2; gy++) for (var gx = 0; gx < 3; gx++) { g.newPath(); g.rectPath(5 + gx * 3.1, 12 + gy * 2.8, 1.8, 1.6); g.fillPath(br); }
            }
            var tabBar = panel.add("group"); tabBar.spacing = 10; tabBar.alignment = ["fill", "top"]; tabBar.alignChildren = ["left", "center"];
            var tabFrameBtn = tabItem(tabBar, "Frame Calculator", frameGlyph, 130);
            var tabCalcBtn = tabItem(tabBar, "Calculator", calcGlyph, 95);
            var stack = panel.add("group"); stack.orientation = "stack"; stack.alignment = ["fill", "fill"]; stack.alignChildren = ["fill", "fill"];
            
            // Frame Calculator "tab"
            var frameTab = stack.add("group");
            frameTab.orientation = "column";
            frameTab.alignChildren = "fill";
            frameTab.spacing = 5;
            frameTab.margins = 10;
            
            var infoGroup = frameTab.add("group");
            infoGroup.orientation = "column";
            infoGroup.alignChildren = "fill";
            
            // Changed from statictext to edittext for selectability
            var compInfo = infoGroup.add("edittext", undefined, "Open a composition in timeline", {readonly: true});
            compInfo.preferredSize.width = 280;
            compInfo.preferredSize.height = 25;
            
            var frameInfo = infoGroup.add("edittext", undefined, "", {readonly: true, multiline: true});
            frameInfo.preferredSize.width = 280;
            frameInfo.preferredSize.height = 50;
            
            // Add radio buttons to choose what to calculate
            var optionsGroup = frameTab.add("group");
            optionsGroup.orientation = "column";
            optionsGroup.alignChildren = "left";
            
            var workAreaRadio = optionsGroup.add("radiobutton", undefined, "Work Area (highlighted timeline section)");
            var compDurationRadio = optionsGroup.add("radiobutton", undefined, "Full Composition Duration");
            
            // Set default selection
            workAreaRadio.value = true;
            
            var calculateBtn = flatButton(frameTab, "Calculate Frames", { primary: true, height: 26 });
            
            // Calculator "tab"
            var calcTab = stack.add("group");
            calcTab.orientation = "column";
            calcTab.alignChildren = "fill";
            calcTab.spacing = 5;
            calcTab.margins = 10;
            
            function selectTab(which) {                              // selected = bold + underline
                tabFrameBtn.sel = (which === 0); tabCalcBtn.sel = (which === 1);
                frameTab.visible = (which === 0); calcTab.visible = (which === 1);
                try { panel.layout.layout(true); } catch (eL) {}
                try { tabFrameBtn.window.update(); } catch (eU) {}
            }
            tabFrameBtn.onClick = function () { selectTab(0); };
            tabCalcBtn.onClick = function () { selectTab(1); };
            
            // Calculator display - editable so it accepts typing AND clipboard paste (native
            // Cmd/Ctrl+V); the keypad still drives it. onChange (below) validates entry to a number.
            var display = calcTab.add("edittext", undefined, "0");
            display.preferredSize.height = 30;
            display.alignment = ["fill", "top"];
            
            // Style the calculator display with brighter text (removed background color)
            display.graphics.foregroundColor = display.graphics.newPen(display.graphics.PenType.SOLID_COLOR, [1, 1, 1], 1);
            
            // Calculator state
            var calcState = {
                display: "0",
                previousValue: 0,
                operation: null,
                waitingForOperand: false,
                entryCleared: false      // true right after an operator: field is blanked for the next entry
            };
            
            // Calculator button layout
            var buttons = [
                ["C", "±", "%", "÷"],
                ["7", "8", "9", "×"],
                ["4", "5", "6", "−"],
                ["1", "2", "3", "+"],
                ["0", ".", "="]
            ];
            
            // Create calculator buttons
            for (var i = 0; i < buttons.length; i++) {
                var row = calcTab.add("group");
                row.orientation = "row";
                row.alignment = ["fill", "top"];
                row.alignChildren = ["fill", "fill"];
                
                for (var j = 0; j < buttons[i].length; j++) {
                    var btnText = buttons[i][j];
                    var isOp = "\u00f7\u00d7\u2212+=".indexOf(btnText) >= 0;   /* operators + '=' get the accent */
                    var btn = flatButton(row, btnText, {
                        width: btnText === "0" ? 100 : 45,
                        height: 35, fontSize: 13,
                        primary: isOp,
                        outline: btnText === "C"                     /* C is a removal: outline grammar */
                    });
                    btn.onClick = createCalculatorHandler(btnText);
                }
            }
            
            // Calculator button handler factory
            function createCalculatorHandler(value) {
                return function() {
                    syncFromDisplay();          // adopt anything typed/pasted before the key acts
                    handleCalculatorInput(value);
                    updateDisplay();
                };
            }
            
            // Update display function
            function updateDisplay() {
                display.text = calcState.entryCleared ? "" : calcState.display;
            }

            // Typed / pasted input (native Cmd/Ctrl+V).
            // sanitize(): keep only digits, one leading "-", and the first "."; everything else
            // (letters, commas, spaces, "+", etc.) is dropped. Returns "" if nothing numeric is left.
            function sanitize(raw) {
                var t = String(raw);
                var neg = /^\s*-/.test(t);
                t = t.replace(/[^0-9.]/g, "");
                var dot = t.indexOf(".");
                if (dot >= 0) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, "");
                if (t === "" || t === ".") return "";
                return (neg ? "-" : "") + t;
            }

            // Live filter: strips letters as they are typed or pasted, so the field never shows them.
            // Also mirrors the keypad's "start a fresh operand" rule: after an operator or "=" the
            // field still shows the previous value, so the first keystroke must REPLACE it, not
            // append to it (typing 2 + 2 must read "2", not "22"). Same for a leading "0".
            display.onChanging = function () {
                var raw = String(this.text);
                if (/[:;]/.test(raw)) { this.text = calcState.display; return; }   // timecode: not a number, keep last good
                // Fallback for platforms where keydown doesn't block the key: an operator character
                // that lands in the field is treated as that operator. A "-" counts only when it
                // follows a digit or ".", so a leading minus (pasted "-3") stays a sign.
                var opAt = -1;
                for (var k = 0; k < raw.length && opAt < 0; k++) {
                    var ch = raw.charAt(k);
                    if ("+*/=".indexOf(ch) >= 0) opAt = k;
                    else if (ch === "-" && k > 0 && /[0-9.]/.test(raw.charAt(k - 1))) opAt = k;
                }
                if (opAt >= 0) {
                    this.text = raw.slice(0, opAt);                           // keep what came before the operator
                    createCalculatorHandler(keyOps[raw.charAt(opAt)])();
                    return;
                }
                var clean = sanitize(raw);
                if (calcState.entryCleared) {                                  // field was blank: whatever arrived is the new operand
                    if (clean !== "") { calcState.entryCleared = false; calcState.waitingForOperand = false; }
                } else if (calcState.waitingForOperand && clean !== calcState.display) {
                    var at = clean.indexOf(calcState.display);                 // after "=": drop the stale result, keep what was typed
                    if (at >= 0) clean = clean.slice(0, at) + clean.slice(at + calcState.display.length);
                    calcState.waitingForOperand = false;
                } else if (calcState.display === "0") {
                    clean = clean.replace(/^0(?=\d)/, "");                    // "05" -> "5" (keep "0.")
                }
                if (clean !== raw) this.text = clean;
            };

            // Keyboard operators while the field is focused: + - * / (main row or numpad), Enter or
            // "=" for equals, Esc for clear. Routed through the same handler the keypad uses.
            // The typed character is blocked; if a platform inserts it anyway, sanitize() strips it.
            var keyOps = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7", "=": "=", "\r": "=", "\n": "=", "\u0003": "=" };
            var keyNames = {
                Add: "+", Subtract: "\u2212", Multiply: "\u00d7", Divide: "\u00f7",
                NumpadAdd: "+", NumpadSubtract: "\u2212", NumpadMultiply: "\u00d7", NumpadDivide: "\u00f7",
                NumPadAdd: "+", NumPadSubtract: "\u2212", NumPadMultiply: "\u00d7", NumPadDivide: "\u00f7",
                KP_Add: "+", KP_Subtract: "\u2212", KP_Multiply: "\u00d7", KP_Divide: "\u00f7", KP_Enter: "=",
                Plus: "+", Minus: "\u2212", Asterisk: "\u00d7", Slash: "\u00f7", Equal: "=",
                Enter: "=", Return: "=", NumpadEnter: "=", NumPadEnter: "=", Escape: "C"
            };
            // keyIdentifier is "U+XXXX" on macOS (numpad "+" -> "U+002B"); turn it back into a char.
            function charFromIdentifier(id) {
                var m = /^U\+([0-9A-Fa-f]{4,6})$/.exec(String(id || ""));
                return m ? String.fromCharCode(parseInt(m[1], 16)) : "";
            }
            function opFromKeyEvent(ev) {
                return keyOps[ev.character] || keyNames[ev.keyName] || keyOps[charFromIdentifier(ev.keyIdentifier)] || null;
            }
            display.addEventListener("keydown", function (ev) {
                var op = opFromKeyEvent(ev);
                if (!op) return;                                            // digits, ".", Backspace, arrows: native
                try { ev.preventDefault(); } catch (eP) {}
                createCalculatorHandler(op)();
            });

            // Adopt the field as the current operand. Called on Enter/blur (onChange) and by every
            // keypad button before it acts, so typed text is never left out of sync with calcState.
            function syncFromDisplay() {
                var raw = String(display.text);
                if (raw === calcState.display) return;                     // nothing new
                if (raw === "" && calcState.entryCleared) return;          // still blank after an operator: nothing new
                var v = parseFloat(sanitize(raw));
                if (isNaN(v)) { display.text = calcState.display; return; }   // empty/junk: keep last good
                calcState.display = v.toString();
                calcState.waitingForOperand = false;                       // a pasted value is a fresh operand
                display.text = calcState.display;                          // normalize the field
            }
            display.onChange = syncFromDisplay;
            
            // Calculator logic
            function handleCalculatorInput(input) {
                calcState.entryCleared = false;                            // only an operator (below) blanks the field
                switch (input) {
                    case "C":
                        calcState.display = "0";
                        calcState.previousValue = 0;
                        calcState.operation = null;
                        calcState.waitingForOperand = false;
                        break;
                        
                    case "±":
                        if (calcState.display !== "0") {
                            calcState.display = (parseFloat(calcState.display) * -1).toString();
                        }
                        break;
                        
                    case "%":
                        calcState.display = (parseFloat(calcState.display) / 100).toString();
                        break;
                        
                    case "=":
                        if (calcState.operation && !calcState.waitingForOperand) {
                            var result = calculate(calcState.previousValue, parseFloat(calcState.display), calcState.operation);
                            calcState.display = result.toString();
                            calcState.operation = null;
                            calcState.previousValue = 0;
                            calcState.waitingForOperand = true;
                        }
                        break;
                        
                    case "+":
                    case "−":
                    case "×":
                    case "÷":
                        if (!calcState.waitingForOperand && calcState.operation) {
                            var result = calculate(calcState.previousValue, parseFloat(calcState.display), calcState.operation);
                            calcState.display = result.toString();
                        }
                        
                        calcState.previousValue = parseFloat(calcState.display);
                        calcState.operation = input;
                        calcState.waitingForOperand = true;
                        calcState.entryCleared = true;                     // blank the field for the next number / paste
                        break;
                        
                    case ".":
                        if (calcState.waitingForOperand) {
                            calcState.display = "0.";
                            calcState.waitingForOperand = false;
                        } else if (calcState.display.indexOf(".") === -1) {
                            calcState.display += ".";
                        }
                        break;
                        
                    default: // Numbers 0-9
                        if (/^[0-9]$/.test(input)) {
                            if (calcState.waitingForOperand) {
                                calcState.display = input;
                                calcState.waitingForOperand = false;
                            } else {
                                calcState.display = calcState.display === "0" ? input : calcState.display + input;
                            }
                        }
                        break;
                }
            }
            
            // Perform calculation
            function calculate(firstOperand, secondOperand, operation) {
                switch (operation) {
                    case "+":
                        return firstOperand + secondOperand;
                    case "−":
                        return firstOperand - secondOperand;
                    case "×":
                        return firstOperand * secondOperand;
                    case "÷":
                        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
                    default:
                        return secondOperand;
                }
            }
            
            // Frame calculator button function
            calculateBtn.onClick = function() {
                var useWorkArea = workAreaRadio.value;
                var result = calculateFrameRange(useWorkArea);
                if (result) {
                    compInfo.text = "Comp: " + result.compName + " (" + result.frameRate + " fps)";
                    
                    if (useWorkArea) {
                        frameInfo.text = "Work Area - Start: " + result.startFrame + ", End: " + result.endFrame + 
                                       ", Total: " + result.totalFrames + " frames (" + result.duration.toFixed(2) + "s)";
                    } else {
                        frameInfo.text = "Full Comp - Start: 0, End: " + result.totalFrames + 
                                       ", Total: " + result.totalFrames + " frames (" + result.duration.toFixed(2) + "s)";
                    }
                } else {
                    compInfo.text = "No active composition found";
                    frameInfo.text = "Please open a composition in the timeline";
                }
            };
            
            // Frame calculation function
            function calculateFrameRange(useWorkArea) {
                var activeComp = app.project.activeItem;
                
                if (!activeComp) {
                    alert("No active composition. Please open a composition in the timeline.");
                    return null;
                }
                
                if (!(activeComp instanceof CompItem)) {
                    alert("Active item is not a composition. Please open a composition in the timeline.");
                    return null;
                }
                
                var frameRate = activeComp.frameRate;
                var startTime, duration;
                
                try {
                    if (useWorkArea) {
                        startTime = activeComp.workAreaStart;
                        duration = activeComp.workAreaDuration;
                        
                        if (duration <= 0) {
                            alert("Work area not set or invalid. Please set a work area in the timeline or use Full Composition option.");
                            return null;
                        }
                    } else {
                        startTime = 0;
                        duration = activeComp.duration;
                    }
                    
                    var startFrame = Math.floor(startTime * frameRate);
                    var endFrame = Math.floor((startTime + duration) * frameRate);
                    var totalFrames = endFrame - startFrame;
                    
                    return {
                        compName: activeComp.name,
                        startFrame: startFrame,
                        endFrame: endFrame,
                        totalFrames: totalFrames,
                        duration: duration,
                        frameRate: frameRate
                    };
                    
                } catch (error) {
                    alert("Error calculating frames: " + error.toString());
                    return null;
                }
            }
            
            selectTab(0);
            
            // Layout
            panel.layout.layout(true);
            panel.layout.resize();
            panel.onResizing = panel.onResize = function() {
                this.layout.resize();
            };
        }
        
        return panel;
    }
    
    // Build and return panel
    var frameCalcPanel = buildUI(thisObj);
    
    // Show the panel if it's a Window
    if (frameCalcPanel != null && frameCalcPanel instanceof Window) {
        frameCalcPanel.center();
        frameCalcPanel.show();
    }
    
})(this);