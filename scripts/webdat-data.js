webdatData = function() {
    var initialized = false;
    var initializedObjectStores = {};
    var OBJECT_STORE_NAME = "webdatNodes";

    function errorLogger(errorCode, errorMessage) {
        console.log("webdatData (" + errorCode + "): " + errorMessage);
    }

    function scrub(name) {
        return toTitleCase(cleanWhitespace(name));
    }
    
    function scrubNode(node) {
        if(!node.hasOwnProperty("id")) {
            return;
        }
        if(!node.hasOwnProperty("have")) {
            node.have = false;
        }
        if(!node.hasOwnProperty("parents")) {
            node.parents = [];
        }
        if(!node.hasOwnProperty("data")) {
            node.data = {};
        }
        return node;
    }
    
    function createNode(name) {
        var node = {id: name};
        return scrubNode(node);
    }

    function saveNode(node) {
        storageEngine.save(OBJECT_STORE_NAME, scrubNode(node), function(savedNode) {
            node = savedNode;
        }, errorLogger);
        return node;
    }

    return {
        init : function(callback) {
            if (initialized) {
                callback();
            } else {
                // initialize storage engine
                storageEngine.init(function() {
                    storageEngine.initObjectStore(OBJECT_STORE_NAME, function() {
                        callback();
                    }, errorLogger);
                }, errorLogger);

                initialized = true;
            }

        },

        addParents : function(name, parents) {
            var clean = scrub(name);
            var node;
            if (parents[0] !== parents[1]) {
                storageEngine.findById(OBJECT_STORE_NAME, clean, function(result) {
                    var found = false;
                    if (result) {
                        $.each(result.parents, function(key, value) {
                            if ((value[0] === parents[0] && value[1] === parents[1]) || (value[1] === parents[0] && value[0] === parents[1])) {
                                node = result;
                            }
                        });
                        if (!node) {
                            parents.sort(function(a, b) {
                                return a.localeCompare(b);
                            });
                            result.parents.push(parents);
                            result.parents.sort(function(a, b) {
                                return a[0].localeCompare(b[0]);
                            });
                            node = saveNode(result);
                        }
                    }
                }, errorLogger);
            }
            return node;
        },

        remParents : function(name, parents) {
            var clean = scrub(name);
            var node;
            storageEngine.findById(OBJECT_STORE_NAME, clean, function(result) {
                var found;
                if (result) {
                    $.each(result.parents, function(key, value) {
                        if ((value[0] === parents[0] && value[1] === parents[1]) || (value[1] === parents[0] && value[0] === parents[1])) {
                            found = key;
                            return;
                        }
                    });
                    if (found >= 0) {
                        result.parents.splice(found,1);
                        node = saveNode(result);
                    }
                }
            }, errorLogger);
            return node;
        },
        
        getNode : function(name, cancreate) {
            var node;
            if(name) {
                var clean = scrub(name);
                storageEngine.findById(OBJECT_STORE_NAME, clean, function(result) {
                    node = result;
                    if (!node && cancreate) {
                        node = saveNode(createNode(clean));
                    }
                }, errorLogger);
            }
            return node;
        },
    
        haveIt : function(name) {
            var node = this.getNode(name, false);
            if(node) {
                return node.have;
            } else {
                return false;
            }
        },
    
        setHave : function(name, have) {
            var node = this.getNode(name, false);
            if(node) {
                node.have = have;
                return saveNode(node);
            } else {
                return;
            }
        },

        getNodes : function() {
            var nodes;
            storageEngine.findAll(OBJECT_STORE_NAME, function(results) {
                nodes = results;
            }, errorLogger);
            return nodes;
        },

        createNode : function(name) {
            var node;
            var clean = scrub(name);
            storageEngine.findById(OBJECT_STORE_NAME, clean, function(result) {
                node = result;
            }, errorLogger);
            if (!node) {
                return saveNode(createNode(clean));
            }
        },

        deleteNode : function(name) {
            var node;
            var clean = scrub(name);
            storageEngine.delete(OBJECT_STORE_NAME, clean, function(result) {
                node = result;
            }, errorLogger);
            return node;
        },

        saveNode : function(node) {
            return saveNode(node);
        },

        saveNodes : function(nodes) {
            var saved;
            storageEngine.saveAll(OBJECT_STORE_NAME, nodes, function(result) {
                saved = result;
            }, errorLogger);
            return saved;
        },

        purgeNodes : function() {
            var purged = 0;
            storageEngine.deleteAll(OBJECT_STORE_NAME, function(result) {
                purged = result;
            }, errorLogger);
            return purged;
        }
    };

}();
