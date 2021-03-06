storageEngine = function() {
    var initialized = false;
    var initializedObjectStores = {};
    
    function getStorageObject(type) {
        var item = localStorage.getItem(type); 
        var parsedItem = JSON.parse(item); 
        return parsedItem;  
    }

    return {
        init: function(successCallback, errorCallback) {
            if (window.localStorage) {
                initialized = true;
                successCallback(null);
            } else {
                errorCallback('storage_api_not_supported', 'The web storage api is not supported');
            }
        },
        
        initObjectStore: function(type, successCallback, errorCallback) {
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!localStorage.getItem(type)) {
                localStorage.setItem(type, JSON.stringify({}));
            }
            initializedObjectStores[type] = true;
            successCallback(null);
        },
        
        save: function(type, data, successCallback, errorCallback) { 
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }   
            if(data && data["id"]) {
                var storageItem = getStorageObject(type);
                var id = data.id;
                delete data.id; 
                storageItem[id] = data; 
                localStorage.setItem(type, JSON.stringify(storageItem)); 
                data.id = id;
                successCallback(data);
            } else {
                errorCallback("object_not_valid","The object provided is not valid");
            }
        },
        
        findAll: function(type, successCallback, errorCallback) { 
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }
            var result = [];
            var storageItem = getStorageObject(type); 
            $.each(storageItem, function(i, v) {
                v.id = i;
                result.push(v);
            });
            successCallback(result);
        },
        
        delete: function(type, id, successCallback, errorCallback) { 
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }
            var storageItem = getStorageObject(type); 
            if (storageItem[id]) {
                delete storageItem[id];
                localStorage.setItem(type, JSON.stringify(storageItem)); 
                successCallback(id);
            } else {
                errorCallback("object_not_found","The object requested could not be found");
            }
        },
        
        deleteAll: function(type, successCallback, errorCallback) { 
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }
            var storageItem = getStorageObject(type);
            var count = storageItem.length;
            localStorage.setItem(type, JSON.stringify({}));
            successCallback(count); 
        },
        
        findByProperty: function(type, propertyName, propertyValue, successCallback, errorCallback) {
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }
            var result = [];
            var storageItem = getStorageObject(type); 
            $.each(storageItem, function(i, v) {
                if (v[propertyName] === propertyValue) {
                    v.id = i;
                    result.push(v);
                }
            }); 
            successCallback(result);
        },
        
        findById: function (type, id, successCallback, errorCallback)   {
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('store_not_initialized', 'The object store '+type+' has not been initialized');
            }   
            var storageItem = getStorageObject(type); 
            var result = storageItem[id];
            if(result) {
                result.id = id;
            } 
            successCallback(result);
        },

        saveAll: function(type, objs, successCallback, errorCallback) { 
            if (!initialized) {
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            } else if (!initializedObjectStores[type]) {
                errorCallback('table_not_initialized', 'The table '+type+' has not been initialized');
            }
            var storageItem = {};
            $.each(objs, function(indx, obj) {
                var id = obj.id; 
                delete obj.id; 
                storageItem[id] = $.extend(true, {}, obj);
                obj.id = id; 
             });
            localStorage.setItem(type, JSON.stringify(storageItem)); 
            successCallback(objs);
        }

    };
    
}();