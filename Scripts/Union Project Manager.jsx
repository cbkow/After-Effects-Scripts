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
            var base = opts.primary ? [0.00784, 0.39608, 0.86275, 1] : [0.235, 0.235, 0.235, 1];
            if (opts.outline) {
                var rimA = this.dn ? 0.55 : this.hov ? 0.45 : 0.32;
                pill(0, 0, s[0], s[1], [1, 1, 1, rimA]);
                pill(1.5, 1.5, s[0] - 3, s[1] - 3, [0.13, 0.13, 0.13, 1]);
            } else {
                var fill = this.dn ? [base[0] * 0.72, base[1] * 0.72, base[2] * 0.72, 1]
                         : this.hov ? [base[0] + 0.06, base[1] + 0.06, base[2] + 0.06, 1] : base;
                pill(0, 0, s[0], s[1], opts.primary ? [base[0], base[1], base[2], 1] : [1, 1, 1, 0.16]);
                pill(1, 1, s[0] - 2, s[1] - 2, fill);
            }
            var f = ScriptUI.newFont("dialog", opts.primary ? "BOLD" : "REGULAR", opts.fontSize || 11);
            var ts = g.measureString(this.textLabel, f);
            g.drawString(this.textLabel, g.newPen(g.PenType.SOLID_COLOR, [1, 1, 1, 1], 1),
                         Math.max(2, (s[0] - ts.width) / 2), Math.max(0, (s[1] - ts.height) / 2 - 1), f);
        };
        b.addEventListener("mouseover", function () { this.hov = true;  try { this.window.update(); } catch (e) {} });
        b.addEventListener("mouseout",  function () { this.hov = false; this.dn = false; try { this.window.update(); } catch (e) {} });
        b.addEventListener("mousedown", function () { this.dn = true;  try { this.window.update(); } catch (e) {} });
        b.addEventListener("mouseup",   function () { this.dn = false; try { this.window.update(); } catch (e) {} });
        return b;
    }

    function themeHeader(parent, title, glyph) {                    // minColor section header: glyph + bold label + hairline
        var hdr = parent.add("group"); hdr.spacing = 6; hdr.alignChildren = ["left", "center"]; hdr.alignment = ["fill", "top"];
        var ic = hdr.add("iconbutton", undefined, undefined, { style: "toolbutton" }); ic.preferredSize = [18, 18];
        ic.onDraw = function () { glyph(this.graphics); };
        var st = hdr.add("statictext", undefined, title);
        try { st.graphics.font = ScriptUI.newFont("dialog", "BOLD", 11); } catch (eH) {}
        var ln = hdr.add("panel"); ln.alignment = ["fill", "center"]; ln.preferredSize.height = 2; ln.minimumSize.width = 20;
        return hdr;
    }

    function folderGlyph(g) {                                       // flat folder, matching the minColor icon family
        var p = g.newPen(g.PenType.SOLID_COLOR, [0.72, 0.72, 0.72, 1], 1.4);
        g.newPath(); g.moveTo(3, 6.5); g.lineTo(3, 14); g.lineTo(15, 14); g.lineTo(15, 7);
        g.lineTo(9.5, 7); g.lineTo(8, 5); g.lineTo(3, 5); g.closePath(); g.strokePath(p);
        g.newPath(); g.rectPath(5, 9.5, 5, 1.6); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.72, 0.72, 0.72, 1]));
    }
    
    var scriptName = "Union Project Manager";
    
    // The Union template
    var UNION_TEMPLATE = [
        {name: "01_project", subfolders: [
            {name: "01_comps", subfolders: [
                {name: "z_old"}
            ]},
            {name: "02_shots", subfolders: [
                {name: "z_old"}
            ]},
            {name: "03_precomps", subfolders: [
                {name: "z_old"}
            ]}
        ]},
        {name: "02_media", subfolders: [
            {name: "01_raster"},
            {name: "02_vector"},
            {name: "03_offline"},
            {name: "04_camera"},
            {name: "05_transfer"},
            {name: "06_flame"},
            {name: "07_stock"},
            {name: "08_3d"},
            {name: "09_audio"},
            {name: "10_prerenders"}
        ]}
    ];
    
    // Recursive function to create nested folders
    function createFoldersFromTemplate(template, parentFolder) {
        for (var i = 0; i < template.length; i++) {
            var folderExists = false;
            
            // Check if folder already exists
            for (var j = 1; j <= parentFolder.numItems; j++) {
                if (parentFolder.item(j) instanceof FolderItem && 
                    parentFolder.item(j).name === template[i].name) {
                    folderExists = true;
                    // If it exists, still process subfolders
                    if (template[i].subfolders) {
                        createFoldersFromTemplate(template[i].subfolders, parentFolder.item(j));
                    }
                    break;
                }
            }
            
            if (!folderExists) {
                var newFolder = parentFolder.items.addFolder(template[i].name);
                // Recursively create subfolders
                if (template[i].subfolders) {
                    createFoldersFromTemplate(template[i].subfolders, newFolder);
                }
            }
        }
    }
    
    // Function to find or create a folder by name
    function findOrCreateFolder(parentFolder, folderName) {
        for (var i = 1; i <= parentFolder.numItems; i++) {
            if (parentFolder.item(i) instanceof FolderItem && 
                parentFolder.item(i).name === folderName) {
                return parentFolder.item(i);
            }
        }
        // If not found, create it
        return parentFolder.items.addFolder(folderName);
    }
    
    // Simple recursive function to merge folder contents
    function mergeFolderContents(sourceFolder, destinationParent) {
        var itemsToMove = [];
        
        // Collect all items first
        for (var i = 1; i <= sourceFolder.numItems; i++) {
            itemsToMove.push(sourceFolder.item(i));
        }
        
        // Process each item
        for (var j = 0; j < itemsToMove.length; j++) {
            var item = itemsToMove[j];
            
            if (item instanceof FolderItem) {
                // Create/find matching folder in destination
                var destFolder = findOrCreateFolder(destinationParent, item.name);
                // Recursively merge its contents
                mergeFolderContents(item, destFolder);
                // Remove empty source folder
                if (item.numItems === 0) {
                    item.remove();
                }
            } else {
                // Simply move non-folder items
                item.parentFolder = destinationParent;
            }
        }
    }
    
    // Function to import and merge a project
    function importAndMergeProject() {
        try {
            // Open file dialog
            var projectFile = File.openDialog("Select After Effects Project to Import", "After Effects:*.aep;*.aepx");
            
            if (!projectFile) {
                writeLn("Import cancelled");
                return;
            }
            
            writeLn("Importing project...");
            
            app.beginUndoGroup("Import and Merge Project");
            
            // Import the project
            var importOptions = new ImportOptions(projectFile);
            var importedItems = app.project.importFile(importOptions);
            
            writeLn("Merging folders...");
            
            // If imported items came in as a folder, merge its contents
            if (importedItems instanceof FolderItem) {
                mergeFolderContents(importedItems, app.project.rootFolder);
                
                // Remove the empty import folder if it still exists and is empty
                if (importedItems.numItems === 0) {
                    importedItems.remove();
                }
            }
            
            app.endUndoGroup();
            
            // Consolidate footage after merge
            writeLn("Consolidating footage...");
            
            consolidateFootageNative();
            
            writeLn("✓ Project merged & consolidated!");
            
        } catch(e) {
            writeLn("✗ Error during import");
            alert("Error: " + e.toString());
            app.endUndoGroup();
        }
    }
    
    // Function to trigger native Reduce Project command
    function reduceProjectNative() {
        app.executeCommand(2735); // Reduce Project command ID
    }
    
    // Function to trigger native Consolidate All Footage command
    function consolidateFootageNative() {
        app.executeCommand(2107); // Consolidate All Footage command ID
    }
    
    // Build UI
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {resizeable: true});
        
        if (panel != null) {
            panel.orientation = "column";
            panel.alignChildren = "fill";
            panel.spacing = 10;
            panel.margins = 15;
            
            themeHeader(panel, "Union Project Manager", folderGlyph);
            
            // Main action button
            var reduceAndSetupBtn = flatButton(panel, "Reduce + Apply Template", { primary: true, height: 30 });
            reduceAndSetupBtn.helpTip = "Reduces project and applies Union folder template";      
            
            // Template only button
            var applyTemplateBtn = flatButton(panel, "Apply Union Template Only", { height: 30 });
            applyTemplateBtn.helpTip = "Create Union folder structure";
            
            // Import and merge button
            var importMergeBtn = flatButton(panel, "Import & Merge Project", { height: 30 });
            importMergeBtn.helpTip = "Import project, merge with same structure, and consolidate footage";
            
            // Event Handlers
            reduceAndSetupBtn.onClick = function() {
                try {
                    writeLn("Reducing project...");
                    
                    // Trigger native reduce project
                    reduceProjectNative();
                    
                    // Small delay to let the reduce complete
                    $.sleep(500);
                    
                    writeLn("Applying template...");
                    
                    app.beginUndoGroup("Apply Union Template");
                    createFoldersFromTemplate(UNION_TEMPLATE, app.project.rootFolder);
                    app.endUndoGroup();
                    
                    writeLn("✓ Complete!");
                    
                } catch(e) {
                    writeLn("✗ Error");
                    alert("Error: " + e.toString());
                }
            };
            
            applyTemplateBtn.onClick = function() {
                app.beginUndoGroup("Apply Union Template");
                try {
                    writeLn("Creating folders...");
                    
                    createFoldersFromTemplate(UNION_TEMPLATE, app.project.rootFolder);
                    
                    writeLn("✓ Template applied!");
                    
                } catch(e) {
                    writeLn("✗ Error");
                    alert("Error: " + e.toString());
                }
                app.endUndoGroup();
            };
            
            importMergeBtn.onClick = function() {
                importAndMergeProject();
            };
            
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
    var unionPanel = buildUI(thisObj);
    
    // Show the panel 
    if (unionPanel != null && unionPanel instanceof Window) {
        unionPanel.center();
        unionPanel.show();
    }
    
})(this);