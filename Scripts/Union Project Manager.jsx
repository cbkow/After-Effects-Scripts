(function(thisObj) {
    "use strict";
    
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
            
            // Header
            var header = panel.add("statictext", undefined, "UNION PROJECT MANAGER");
            header.graphics.font = ScriptUI.newFont("Arial", "Bold", 14);
            header.alignment = "center";
            
            panel.add("panel");
            
            // Main action button
            var reduceAndSetupBtn = panel.add("button", undefined, "🔄 Reduce + Apply Template");
            reduceAndSetupBtn.preferredSize.height = 30;
            reduceAndSetupBtn.helpTip = "Reduces project and applies Union folder template";      
            
            // Template only button
            var applyTemplateBtn = panel.add("button", undefined, "📁 Apply Union Template Only");
            applyTemplateBtn.preferredSize.height = 30;
            applyTemplateBtn.helpTip = "Create Union folder structure";
            
            // Import and merge button
            var importMergeBtn = panel.add("button", undefined, "📥 Import & Merge Project");
            importMergeBtn.preferredSize.height = 30;
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