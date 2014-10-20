/* to do:
 *      -   Moved to a class global current node/nodes approach.
 *          Need to strip all the current node data attribute usage.
 *          Will clean things up a bit and should make code easier to follow.
 *      -   Need some serious data validation/checking on the json import stuff.
 */

webdatController = function() {
    var webdatPage;
    var initialized = false;
    var currentNode;
    var currentNodes;
    var modeEdit = false;
    var modeConfig = false;
    
    function errorLogger(errorCode, errorMessage) {
        console.log("webdatController ("+errorCode + "): " + errorMessage);
    }
    
    function sortNodes(nodes) {
        nodes.sort(function(a, b) {
            return a.id.localeCompare(b.id);
        });
        return nodes;
    }
    
    function setConfig(isConfig) {
        if(isConfig) {
            $(webdatPage).find("#node-config").removeClass("not");
            $(webdatPage).find("#node-data").addClass("not");
            $(webdatPage).find("#node-list input:checkbox, #tgl-edit").addClass("not");
            $(webdatPage).find("#tgl-config").html("C");
        } else {
            $(webdatPage).find("#node-config").addClass("not");
            $(webdatPage).find("#node-data").removeClass("not");
            $(webdatPage).find("#node-list input:checkbox, #tgl-edit").removeClass("not");
            $(webdatPage).find("#tgl-config").html("A");
        } 
        modeConfig = isConfig;
    }
    
    function setEdit(canEdit) {
        var toToggle = "#btn-node-delete, #input-add-parents, .btn-del-parents, #input-add-node";
        if(canEdit) {
            $(webdatPage).find(toToggle).removeClass("not");
            $(webdatPage).find("#tgl-edit").html("E");
        } else {
            $(webdatPage).find(toToggle).addClass("not");
            $(webdatPage).find("#tgl-edit").html("I");
        }
        modeEdit = canEdit;
    }

    function clearNode() {
        $(webdatPage).find("#node-name").html("");
        $(webdatPage).find("#btn-add-parents, #chk-node-have, #btn-node-delete, #btn-node-delete-confirm").removeData("nodeId");
        $(webdatPage).find(".parent-ddl, #children-list, #parents-list").empty();
        $(webdatPage).find("#chk-node-have").prop('checked', false);
        $(webdatPage).find("#node-warnings, #input-rename-node").addClass("not");
    }
    
    function showNode() {
        clearNode();
        if(currentNode) {
            $(webdatPage).find("#node-name").html(currentNode.id);
            $(webdatPage).find("#chk-node-have").prop('checked', currentNode.have);
            $(webdatPage).find("#btn-add-parents, #chk-node-have, #btn-node-delete, #btn-node-delete-confirm").data("nodeId", currentNode.id);
            $("#tmpl-parents").tmpl(currentNode).appendTo($(webdatPage).find("#parents-list"));    
            $("#tmpl-children").tmpl(currentNodes, {id: currentNode.id}).appendTo($(webdatPage).find("#children-list"));
            var nodeCount = 0;
            var parentCount = 0;    
            $.each(currentNodes, function(key, value) {
                if(value.id != currentNode.id) {
                    $(webdatPage).find(".parent-ddl").append($("<option/>").val(value.id).text(value.id));
                }
                parentCount += value.parents.length;
                nodeCount++;
            });
            $(webdatPage).find("#node-count").html(nodeCount);
            $(webdatPage).find("#parent-count").html(parentCount);
            $(webdatPage).find(".parent-ddl").val("");
        }
    }
    
    function updateNodeList() {
        $(webdatPage).find("#node-list").empty();
        $("#tmpl-nodes").tmpl(currentNodes).appendTo($(webdatPage).find("#node-list"));    
    }
    
    return {
        init: function(page, callback) {
            if(initialized) {
                callback();
            } else {
                webdatPage = page;
                // initialize data manager
                webdatData.init(function() { 
                    callback(); 
                }, errorLogger);
                // add event handler for hitting enter in add node field
                $(webdatPage).find("#input-add-node").keyup(function(evt) {
                    if(evt.keyCode == 13) {
                        evt.preventDefault();
                        if($(webdatPage).find("#input-add-node").valid()) {
                            var node = webdatData.getNode($(webdatPage).find("#fld-add-node").val(), true);
                            if(node) {
                               webdatController.setCurrentNode(node.id);
                               $(webdatPage).find("#fld-add-node").val("");
                            }
                        } 
                    }
                });
                // add event handler for adding parents to node
                $(webdatPage).find("#btn-add-parents").click(function(evt) {
                    evt.preventDefault();
                    if($(webdatPage).find("#input-add-parents").valid()) {
                        var parents = [];
                        parents[0] = $(webdatPage).find("#ddl-parent1").val();
                        parents[1] = $(webdatPage).find("#ddl-parent2").val();
                        var node = webdatData.addParents($(evt.target).data().nodeId, parents);
                        if(node) {
                           webdatController.setCurrentNode(node.id);
                        }
                    } 
                });
                // toggle for the config screen
                $(webdatPage).find("#tgl-config").click(function(evt) {
                    evt.preventDefault();
                    setConfig(!modeConfig);
                });
                // toggle for edit options
                $(webdatPage).find("#tgl-edit").click(function(evt) {
                    evt.preventDefault();
                    setEdit(!modeEdit);
                });
                // prevent submit on all forms
                $(webdatPage).find("form").on("submit", function(evt) {
                    evt.preventDefault();
                });
                // add event handler for purge nodes button
                $(webdatPage).find("#btn-purge-nodes").click(function(evt) {
                    evt.preventDefault();
                    webdatData.purgeNodes();
                    webdatController.setCurrentNode();
                });
                // add event handler for the node list entries
                $(webdatPage).find("#node-list, #parents-list, #children-list").on("click", "a.node-link", function(evt) {
                    var name = $(evt.target).data().nodeId;
                    if(name) {
                        webdatController.setCurrentNode(name);
                    }
                });
                // add event handler for the delete parents links
                $(webdatPage).find("#parents-list").on("click", "a.btn-del-parents", function(evt) {
                    var name = $(evt.target).data().nodeId;
                    var parents = $(evt.target).data().parents;
                    if(parents && name) {
                        webdatData.remParents(name, parents);
                        webdatController.setCurrentNode(name);
                    }
                });
                // add event handler for the have checkbox
                $(webdatPage).on("click", "input.node-have", function(evt) {
                    var name = $(evt.target).data().nodeId;
                    var checked = $(evt.target).is(':checked');
                    if(name) {
                        var node = webdatData.setHave(name, checked);
                        if(node) {
                            if(currentNode && currentNode.id === node.id) {
                                // force the current node to update
                                webdatController.setCurrentNode(node.id);
                            }
                            webdatController.refreshPage();
                        }
                    }
                });
                // add event handler for the node name (to rename if in edit mode)
                $(webdatPage).find("#node-name").click(function(evt) {
                    var name = $(evt.target).html();
                    if(name && modeEdit) {
                        $(webdatPage).find("#input-rename-node").toggleClass("not");
                    }
                });
                // add event handler for the node delete link 
                $(webdatPage).find("#btn-node-delete").click(function(evt) {
                    if($(webdatPage).find("#btn-node-delete").data().nodeId) {
                        $(webdatPage).find("#node-warnings").toggleClass("not");
                    } else {
                        $(webdatPage).find("#node-warnings").addClass("not");
                    }
                });
                // add event handler for the node delete confirm link 
                $(webdatPage).find("#btn-node-delete-confirm").click(function(evt) {
                    var nodeId = $(webdatPage).find("#btn-node-delete-confirm").data().nodeId; 
                    if(nodeId) {
                        $.each(currentNodes, function(key, value) {
                            $.each(value.parents, function(idx, parents) {
                               if(nodeId === parents[0] || nodeId === parents[1]) {
                                   webdatData.remParents(value.id, parents);
                               } 
                            });
                        });
                        webdatData.deleteNode(nodeId);
                        webdatController.setCurrentNode();
                    }
                });
                // add event handler for the import
                $(webdatPage).find("#btn-import").click(function(evt) {
                    if($(webdatPage).find("#input-imports").valid()) {
                        source = $(webdatPage).find("#ddl-import").val();
                        $.getJSON(source, function(data) {
                            if(data) {
                                if(webdatData.saveNodes(data)) {
                                    webdatController.setCurrentNode();
                                }
                            }    
                        }, errorLogger);
                    }
                });
                // add event handler for import json
                $(webdatPage).find("#btn-import-json").click(function(evt) {
                    evt.preventDefault();
                    if($(webdatPage).find("#input-json").valid()) {
                        var data = $.parseJSON($(webdatPage).find("#input-json-data").val());
                        if(webdatData.saveNodes(data)) {
                            webdatController.setCurrentNode();
                        }
                    } 
                });
                // add event handler for select json (for those pesky tablets)
                $(webdatPage).find("#btn-select-json").click(function(evt) {
                    evt.preventDefault();
                    $(webdatPage).find("#input-json-data").select();
                });
                // add event handler for clear json
                $(webdatPage).find("#btn-clear-json").click(function(evt) {
                    evt.preventDefault();
                    $(webdatPage).find("#input-json-data").val("");
                });
                // add event handler for output json
                $(webdatPage).find("#btn-output-json").click(function(evt) {
                    evt.preventDefault();
                    var x=window.open();
                    x.document.open();
                    x.document.write(JSON.stringify(currentNodes));
                    x.document.close();                    
                });
                // update our displays
                webdatController.setCurrentNode();
                // set our config mode 
                setConfig(false);
                setEdit(false);
                initialized = true;
            }
        },

        setCurrentNode : function(name) {
            currentNode = webdatData.getNode(name, false);
            webdatController.refreshPage();
        },
        
        refreshPage : function() {
            currentNodes = sortNodes(webdatData.getNodes());
            // could do this elsewhere but not too worried about the perf hit.
            $(webdatPage).find("#input-json-data").val(JSON.stringify(currentNodes));
            showNode();
            updateNodeList();
            setConfig(modeConfig);
            setEdit(modeEdit);
        }
        
    };
    
}();
