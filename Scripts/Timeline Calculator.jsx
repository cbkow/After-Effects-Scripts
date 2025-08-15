(function(thisObj) {
    "use strict";
    
    // Build UI
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Frame Calculator & Calculator", undefined, {resizeable: true});
        
        if (panel != null) {
            panel.orientation = "column";
            panel.alignChildren = "fill";
            panel.spacing = 10;
            panel.margins = 10;
            
            // Create tabbed panel
            var tabbedPanel = panel.add("tabbedpanel");
            tabbedPanel.alignment = ["fill", "fill"];
            tabbedPanel.alignChildren = ["fill", "fill"];
            
            // Frame Calculator Tab
            var frameTab = tabbedPanel.add("tab", undefined, "Frame Calculator");
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
            compDurationRadio.value = true;
            
            var calculateBtn = frameTab.add("button", undefined, "Calculate Frames");
            
            // Calculator Tab
            var calcTab = tabbedPanel.add("tab", undefined, "Calculator");
            calcTab.orientation = "column";
            calcTab.alignChildren = "fill";
            calcTab.spacing = 5;
            calcTab.margins = 10;
            
            // Calculator display - now with selectable text and custom graphics
            var display = calcTab.add("edittext", undefined, "0", {readonly: true});
            display.preferredSize.height = 30;
            display.alignment = ["fill", "top"];
            
            // Style the calculator display with brighter text (removed background color)
            display.graphics.foregroundColor = display.graphics.newPen(display.graphics.PenType.SOLID_COLOR, [1, 1, 1], 1);
            
            // Calculator state
            var calcState = {
                display: "0",
                previousValue: 0,
                operation: null,
                waitingForOperand: false
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
                    var btn = row.add("button", undefined, btnText);
                    
                    if (btnText === "0") {
                        btn.alignment = ["fill", "fill"];
                        btn.preferredSize.width = 100;
                    } else {
                        btn.alignment = ["fill", "fill"];
                        btn.preferredSize.width = 45;
                    }
                    btn.preferredSize.height = 35;
                    
                    // Add click handler
                    btn.onClick = createCalculatorHandler(btnText);
                }
            }
            
            // Calculator button handler factory
            function createCalculatorHandler(value) {
                return function() {
                    handleCalculatorInput(value);
                    updateDisplay();
                };
            }
            
            // Update display function
            function updateDisplay() {
                display.text = calcState.display;
            }
            
            // Calculator logic
            function handleCalculatorInput(input) {
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