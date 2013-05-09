// commit 02b91c5313ff37d74a58f71775170afd360f4a1f

// File generated at :: Wed Oct 31 2012 14:46:38 GMT-0700 (PDT)

/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless cordovaRequired by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

;(function() {

// file: lib/scripts/cordovaRequire.js

var cordovaRequire,
    cordovaDefine;

(function () {
    var modules = {};
    // Stack of moduleIds currently being built.
    var cordovaRequireStack = [];
    // Map of module ID -> index into cordovaRequireStack of modules currently being built.
    var inProgressModules = {};

    function build(module) {
        var factory = module.factory;
        module.exports = {};
        delete module.factory;
        factory(cordovaRequire, module.exports, module);
        return module.exports;
    }

    cordovaRequire = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = cordovaRequireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in cordovaRequire graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = cordovaRequireStack.length;
                cordovaRequireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                cordovaRequireStack.pop();
            }
        }
        return modules[id].exports;
    };

    cordovaDefine = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already cordovaDefined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    cordovaDefine.remove = function (id) {
        delete modules[id];
    };

})();

//Export for use in node
if (typeof module === "object" && typeof cordovaRequire === "function") {
    module.exports.cordovaRequire = cordovaRequire;
    module.exports.cordovaDefine = cordovaDefine;
}

// file: lib/cordova.js
cordovaDefine("cordova", function(cordovaRequire, exports, module) {


var channel = cordovaRequire('cordova/channel');

/**
 * Listen for DOMContentLoaded and notify our channel subscribers.
 */
document.addEventListener('DOMContentLoaded', function() {
    channel.onDOMContentLoaded.fire();
}, false);
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
}

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'uncordovaDefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'uncordovaDefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "uncordovaDefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "uncordovaDefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

if(typeof window.console === "uncordovaDefined") {
    window.console = {
        log:function(){}
    };
}

var cordova = {
    cordovaDefine:cordovaDefine,
    cordovaRequire:cordovaRequire,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is cordovaRequired for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'uncordovaDefined') {
            if( bNoDetach ) {
              documentEventHandlers[type].fire(evt);
            }
            else {
              setTimeout(function() {
                  documentEventHandlers[type].fire(evt);
              }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'uncordovaDefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        try {
            cordova.callbackFromNative(callbackId, true, args.status, args.message, args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        try {
            cordova.callbackFromNative(callbackId, false, args.status, args.message, args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, success, status, message, keepCallback) {
        var callback = cordova.callbacks[callbackId];
        if (callback) {
            if (success && status == cordova.callbackStatus.OK) {
                callback.success && callback.success(message);
            } else if (!success) {
                callback.fail && callback.fail(message);
            }

            // Clear callback if not expecting any more results
            if (!keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

module.exports = cordova;

});

// file: lib/common/builder.js
cordovaDefine("cordova/builder", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.cordovaDefineGetter(obj, key, function() {
            window.console && console.log(message);
            return value;
        });
    } else {
        obj[key] = value;
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
          var result = obj.path ? cordovaRequire(obj.path) : {};

          if (clobber) {
              // Clobber if it doesn't exist.
              if (typeof parent[key] === 'uncordovaDefined') {
                  assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
              } else if (typeof obj.path !== 'uncordovaDefined') {
                  // If merging, merge properties onto parent, otherwise, clobber.
                  if (merge) {
                      recursiveMerge(parent[key], result);
                  } else {
                      assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                  }
              }
              result = parent[key];
          } else {
            // Overwrite if not currently cordovaDefined.
            if (typeof parent[key] == 'uncordovaDefined') {
              assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
            } else if (merge && typeof obj.path !== 'uncordovaDefined') {
              // If merging, merge parent onto result
              recursiveMerge(result, parent[key]);
              parent[key] = result;
            } else {
              // Set result to what already exists, so we can build children into it if they exist.
              result = parent[key];
            }
          }

          if (obj.children) {
            include(result, obj.children, clobber, merge);
          }
        } catch(e) {
          utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (typeof target.prototype !== 'uncordovaDefined' && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                target.prototype[prop] = src[prop];
            } else {
                target[prop] = typeof src[prop] === 'object' ? recursiveMerge(
                        target[prop], src[prop]) : src[prop];
            }
        }
    }
    return target;
}

module.exports = {
    build: function (objects) {
        return {
            intoButDoNotClobber: function (target) {
                include(target, objects, false, false);
            },
            intoAndClobber: function(target) {
                include(target, objects, true, false);
            },
            intoAndMerge: function(target) {
                include(target, objects, true, true);
            }
        };
    }
};

});

// file: lib/common/channel.js
cordovaDefine("cordova/channel", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to cordovaDefine and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onCordovaInfoReady*         Internal event fired when device properties are available.
 * onCordovaConnectionReady*   Internal event fired when the connection property has been set.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function cordovaRequired as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that device properties are available
channel.createSticky('onCordovaInfoReady');

// Event to indicate that the connection property has been set.
channel.createSticky('onCordovaConnectionReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.createSticky('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onCordovaConnectionReady');

module.exports = channel;

});

// file: lib/common/commandProxy.js
cordovaDefine("cordova/commandProxy", function(cordovaRequire, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: lib/common/common.js
cordovaDefine("cordova/common", function(cordovaRequire, exports, module) {

module.exports = {
    objects: {
        cordova: {
            path: 'cordova',
            children: {
                exec: {
                    path: 'cordova/exec'
                },
                logger: {
                    path: 'cordova/plugin/logger'
                }
            }
        },
        Cordova: {
            children: {
                exec: {
                    path: 'cordova/exec'
                }
            }
        },
        navigator: {
            children: {
                notification: {
                    path: 'cordova/plugin/notification'
                },
                accelerometer: {
                    path: 'cordova/plugin/accelerometer'
                },
                battery: {
                    path: 'cordova/plugin/battery'
                },
                camera:{
                    path: 'cordova/plugin/Camera'
                },
                compass:{
                    path: 'cordova/plugin/compass'
                },
                connection: {
                    path: 'cordova/plugin/network'
                },
                contacts: {
                    path: 'cordova/plugin/contacts'
                },
                device:{
                    children:{
                        capture: {
                            path: 'cordova/plugin/capture'
                        }
                    }
                },
                geolocation: {
                    path: 'cordova/plugin/geolocation'
                },
                globalization: {
                    path: 'cordova/plugin/globalization'
                },
                network: {
                    children: {
                        connection: {
                            path: 'cordova/plugin/network',
                            deprecated: 'navigator.network.connection is deprecated. Use navigator.connection instead.'
                        }
                    }
                },
                splashscreen: {
                    path: 'cordova/plugin/splashscreen'
                }
            }
        },
        Acceleration: {
            path: 'cordova/plugin/Acceleration'
        },
        Camera:{
            path: 'cordova/plugin/CameraConstants'
        },
        CameraPopoverOptions: {
            path: 'cordova/plugin/CameraPopoverOptions'
        },
        CaptureError: {
            path: 'cordova/plugin/CaptureError'
        },
        CaptureAudioOptions:{
            path: 'cordova/plugin/CaptureAudioOptions'
        },
        CaptureImageOptions: {
            path: 'cordova/plugin/CaptureImageOptions'
        },
        CaptureVideoOptions: {
            path: 'cordova/plugin/CaptureVideoOptions'
        },
        CompassHeading:{
            path: 'cordova/plugin/CompassHeading'
        },
        CompassError:{
            path: 'cordova/plugin/CompassError'
        },
        ConfigurationData: {
            path: 'cordova/plugin/ConfigurationData'
        },
        Connection: {
            path: 'cordova/plugin/Connection'
        },
        Contact: {
            path: 'cordova/plugin/Contact'
        },
        ContactAddress: {
            path: 'cordova/plugin/ContactAddress'
        },
        ContactError: {
            path: 'cordova/plugin/ContactError'
        },
        ContactField: {
            path: 'cordova/plugin/ContactField'
        },
        ContactFindOptions: {
            path: 'cordova/plugin/ContactFindOptions'
        },
        ContactName: {
            path: 'cordova/plugin/ContactName'
        },
        ContactOrganization: {
            path: 'cordova/plugin/ContactOrganization'
        },
        Coordinates: {
            path: 'cordova/plugin/Coordinates'
        },
        device: {
            path: 'cordova/plugin/device'
        },
        DirectoryEntry: {
            path: 'cordova/plugin/DirectoryEntry'
        },
        DirectoryReader: {
            path: 'cordova/plugin/DirectoryReader'
        },
        Entry: {
            path: 'cordova/plugin/Entry'
        },
        File: {
            path: 'cordova/plugin/File'
        },
        FileEntry: {
            path: 'cordova/plugin/FileEntry'
        },
        FileError: {
            path: 'cordova/plugin/FileError'
        },
        FileReader: {
            path: 'cordova/plugin/FileReader'
        },
        FileSystem: {
            path: 'cordova/plugin/FileSystem'
        },
        FileTransfer: {
            path: 'cordova/plugin/FileTransfer'
        },
        FileTransferError: {
            path: 'cordova/plugin/FileTransferError'
        },
        FileUploadOptions: {
            path: 'cordova/plugin/FileUploadOptions'
        },
        FileUploadResult: {
            path: 'cordova/plugin/FileUploadResult'
        },
        FileWriter: {
            path: 'cordova/plugin/FileWriter'
        },
        Flags: {
            path: 'cordova/plugin/Flags'
        },
        GlobalizationError: {
            path: 'cordova/plugin/GlobalizationError'
        },
        LocalFileSystem: {
            path: 'cordova/plugin/LocalFileSystem'
        },
        Media: {
            path: 'cordova/plugin/Media'
        },
        MediaError: {
            path: 'cordova/plugin/MediaError'
        },
        MediaFile: {
            path: 'cordova/plugin/MediaFile'
        },
        MediaFileData:{
            path: 'cordova/plugin/MediaFileData'
        },
        Metadata:{
            path: 'cordova/plugin/Metadata'
        },
        Position: {
            path: 'cordova/plugin/Position'
        },
        PositionError: {
            path: 'cordova/plugin/PositionError'
        },
        ProgressEvent: {
            path: 'cordova/plugin/ProgressEvent'
        },
        requestFileSystem:{
            path: 'cordova/plugin/requestFileSystem'
        },
        resolveLocalFileSystemURI:{
            path: 'cordova/plugin/resolveLocalFileSystemURI'
        }
    }
};

});

// file: lib/webworks/exec.js
cordovaDefine("cordova/exec", function(cordovaRequire, exports, module) {

var manager = cordovaRequire('cordova/plugin/manager'),
    cordova = cordovaRequire('cordova'),
    utils = cordovaRequire('cordova/utils');

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */

module.exports = function(success, fail, service, action, args) {
    try {
        var v = manager.exec(success, fail, service, action, args);

        // If status is OK, then return value back to caller
        if (v.status == cordova.callbackStatus.OK) {

            // If there is a success callback, then call it now with returned value
            if (success) {
                try {
                    success(v.message);
                }
                catch (e) {
                    console.log("Error in success callback: "+cordova.callbackId+" = "+e);
                }

            }
            return v.message;
        } else if (v.status == cordova.callbackStatus.NO_RESULT) {

        } else {
            // If error, then display error
            console.log("Error: Status="+v.status+" Message="+v.message);

            // If there is a fail callback, then call it now with returned value
            if (fail) {
                try {
                    fail(v.message);
                }
                catch (e) {
                    console.log("Error in error callback: "+cordova.callbackId+" = "+e);
                }
            }
            return null;
        }
    } catch (e) {
        utils.alert("Error: "+e);
    }
};

});

// file: lib/webworks/java/platform.js
cordovaDefine("cordova/platform", function(cordovaRequire, exports, module) {

module.exports = {
    id: "blackberry",
    initialize:function() {
        var cordova = cordovaRequire('cordova'),
            exec = cordovaRequire('cordova/exec'),
            channel = cordovaRequire('cordova/channel'),
            manager = cordovaRequire('cordova/plugin/manager'),
            app = cordovaRequire('cordova/plugin/java/app');

        // BB OS 5 does not cordovaDefine window.console.
        if (typeof window.console === 'uncordovaDefined') {
            window.console = {};
        }

        // Override console.log with native logging ability.
        // BB OS 7 devices cordovaDefine console.log for use with web inspector
        // debugging. If console.log is already cordovaDefined, invoke it in addition
        // to native logging.
        var origLog = window.console.log;
        window.console.log = function(msg) {
            if (typeof origLog === 'function') {
                origLog.call(window.console, msg);
            }
            org.apache.cordova.Logger.log(''+msg);
        };

        // Mapping of button events to BlackBerry key identifier.
        var buttonMapping = {
            'backbutton'         : blackberry.system.event.KEY_BACK,
            'conveniencebutton1' : blackberry.system.event.KEY_CONVENIENCE_1,
            'conveniencebutton2' : blackberry.system.event.KEY_CONVENIENCE_2,
            'endcallbutton'      : blackberry.system.event.KEY_ENDCALL,
            'menubutton'         : blackberry.system.event.KEY_MENU,
            'startcallbutton'    : blackberry.system.event.KEY_STARTCALL,
            'volumedownbutton'   : blackberry.system.event.KEY_VOLUMEDOWN,
            'volumeupbutton'     : blackberry.system.event.KEY_VOLUMEUP
        };

        // Generates a function which fires the specified event.
        var fireEvent = function(event) {
            return function() {
                cordova.fireDocumentEvent(event, null);
            };
        };

        var eventHandler = function(event) {
            return function() {
                // If we just attached the first handler, let native know we
                // need to override the hardware button.
                if (this.numHandlers) {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], fireEvent(event));
                }
                // If we just detached the last handler, let native know we
                // no longer override the hardware button.
                else {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], null);
                }
            };
        };

        // Inject listeners for buttons on the document.
        for (var button in buttonMapping) {
            if (buttonMapping.hasOwnProperty(button)) {
                var buttonChannel = cordova.addDocumentEventHandler(button);
                buttonChannel.onHasSubscribersChange = eventHandler(button);
            }
        }

        // Fires off necessary code to pause/resume app
        var resume = function() {
            cordova.fireDocumentEvent('resume');
            manager.resume();
        };
        var pause = function() {
            cordova.fireDocumentEvent('pause');
            manager.pause();
        };

        /************************************************
         * Patch up the generic pause/resume listeners. *
         ************************************************/

        // Unsubscribe handler - turns off native backlight change
        // listener
        var onHasSubscribersChange = function() {
            // If we just attached the first handler and there are
            // no pause handlers, start the backlight system
            // listener on the native side.
            if (this.numHandlers && (channel.onResume.numHandlers + channel.onPause.numHandlers === 1)) {
                exec(backlightWin, backlightFail, "App", "detectBacklight", []);
            } else if (channel.onResume.numHandlers === 0 && channel.onPause.numHandlers === 0) {
                exec(null, null, 'App', 'ignoreBacklight', []);
            }
        };

        // Native backlight detection win/fail callbacks
        var backlightWin = function(isOn) {
            if (isOn === true) {
                resume();
            } else {
                pause();
            }
        };
        var backlightFail = function(e) {
            console.log("Error detecting backlight on/off.");
        };

        // Override stock resume and pause listeners so we can trigger
        // some native methods during attach/remove
        channel.onResume = cordova.addDocumentEventHandler('resume');
        channel.onResume.onHasSubscribersChange = onHasSubscribersChange;
        channel.onPause = cordova.addDocumentEventHandler('pause');
        channel.onPause.onHasSubscribersChange = onHasSubscribersChange;

        // Fire resume event when application brought to foreground.
        blackberry.app.event.onForeground(resume);

        // Fire pause event when application sent to background.
        blackberry.app.event.onBackground(pause);

        // Trap BlackBerry WebWorks exit. Allow plugins to clean up before exiting.
        blackberry.app.event.onExit(app.exitApp);
    },
    objects: {
        navigator: {
            children: {
                app: {
                    path: "cordova/plugin/java/app"
                }
            }
        },
        File: { // exists natively on BlackBerry OS 7, override
            path: "cordova/plugin/File"
        }
    },
    merges: {
        navigator: {
            children: {
                contacts: {
                    path: 'cordova/plugin/java/contacts'
                },
                notification: {
                    path: 'cordova/plugin/java/notification'
                }
            }
        },
        Contact: {
            path: 'cordova/plugin/java/Contact'
        },
        DirectoryEntry: {
            path: 'cordova/plugin/java/DirectoryEntry'
        },
        Entry: {
            path: 'cordova/plugin/java/Entry'
        },
        MediaError: { // Exists natively on BB OS 6+, merge in Cordova specifics
            path: 'cordova/plugin/java/MediaError'
        }
    }
};

});

// file: lib/common/plugin/Acceleration.js
cordovaDefine("cordova/plugin/Acceleration", function(cordovaRequire, exports, module) {

var Acceleration = function(x, y, z, timestamp) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.timestamp = timestamp || (new Date()).getTime();
};

module.exports = Acceleration;

});

// file: lib/common/plugin/Camera.js
cordovaDefine("cordova/plugin/Camera", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    Camera = cordovaRequire('cordova/plugin/CameraConstants');

var cameraExport = {};

// Tack on the Camera Constants to the base camera plugin.
for (var key in Camera) {
    cameraExport[key] = Camera[key];
}

/**
 * Gets a picture from source cordovaDefined by "options.sourceType", and returns the
 * image as cordovaDefined by the "options.destinationType" option.

 * The defaults are sourceType=CAMERA and destinationType=FILE_URI.
 *
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
cameraExport.getPicture = function(successCallback, errorCallback, options) {
    options = options || {};
    // successCallback cordovaRequired
    if (typeof successCallback != "function") {
        console.log("Camera Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback != "function")) {
        console.log("Camera Error: errorCallback is not a function");
        return;
    }

    var quality = 50;
    if (typeof options.quality == "number") {
        quality = options.quality;
    } else if (typeof options.quality == "string") {
        var qlity = parseInt(options.quality, 10);
        if (isNaN(qlity) === false) {
            quality = qlity.valueOf();
        }
    }

    var destinationType = Camera.DestinationType.FILE_URI;
    if (typeof options.destinationType == "number") {
        destinationType = options.destinationType;
    }

    var sourceType = Camera.PictureSourceType.CAMERA;
    if (typeof options.sourceType == "number") {
        sourceType = options.sourceType;
    }

    var targetWidth = -1;
    if (typeof options.targetWidth == "number") {
        targetWidth = options.targetWidth;
    } else if (typeof options.targetWidth == "string") {
        var width = parseInt(options.targetWidth, 10);
        if (isNaN(width) === false) {
            targetWidth = width.valueOf();
        }
    }

    var targetHeight = -1;
    if (typeof options.targetHeight == "number") {
        targetHeight = options.targetHeight;
    } else if (typeof options.targetHeight == "string") {
        var height = parseInt(options.targetHeight, 10);
        if (isNaN(height) === false) {
            targetHeight = height.valueOf();
        }
    }

    var encodingType = Camera.EncodingType.JPEG;
    if (typeof options.encodingType == "number") {
        encodingType = options.encodingType;
    }

    var mediaType = Camera.MediaType.PICTURE;
    if (typeof options.mediaType == "number") {
        mediaType = options.mediaType;
    }
    var allowEdit = false;
    if (typeof options.allowEdit == "boolean") {
        allowEdit = options.allowEdit;
    } else if (typeof options.allowEdit == "number") {
        allowEdit = options.allowEdit <= 0 ? false : true;
    }
    var correctOrientation = false;
    if (typeof options.correctOrientation == "boolean") {
        correctOrientation = options.correctOrientation;
    } else if (typeof options.correctOrientation == "number") {
        correctOrientation = options.correctOrientation <=0 ? false : true;
    }
    var saveToPhotoAlbum = false;
    if (typeof options.saveToPhotoAlbum == "boolean") {
        saveToPhotoAlbum = options.saveToPhotoAlbum;
    } else if (typeof options.saveToPhotoAlbum == "number") {
        saveToPhotoAlbum = options.saveToPhotoAlbum <=0 ? false : true;
    }
    var popoverOptions = null;
    if (typeof options.popoverOptions == "object") {
        popoverOptions = options.popoverOptions;
    }

    var args = [quality, destinationType, sourceType, targetWidth, targetHeight, encodingType,
                mediaType, allowEdit, correctOrientation, saveToPhotoAlbum, popoverOptions];

    exec(successCallback, errorCallback, "Camera", "takePicture", args);
};

cameraExport.cleanup = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, "Camera", "cleanup", []);
};

module.exports = cameraExport;

});

// file: lib/common/plugin/CameraConstants.js
cordovaDefine("cordova/plugin/CameraConstants", function(cordovaRequire, exports, module) {

module.exports = {
  DestinationType:{
    DATA_URL: 0,         // Return base64 encoded string
    FILE_URI: 1          // Return file uri (content://media/external/images/media/2 for Android)
  },
  EncodingType:{
    JPEG: 0,             // Return JPEG encoded image
    PNG: 1               // Return PNG encoded image
  },
  MediaType:{
    PICTURE: 0,          // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
    VIDEO: 1,            // allow selection of video only, ONLY RETURNS URL
    ALLMEDIA : 2         // allow selection from all media types
  },
  PictureSourceType:{
    PHOTOLIBRARY : 0,    // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
    CAMERA : 1,          // Take picture from camera
    SAVEDPHOTOALBUM : 2  // Choose image from picture library (same as PHOTOLIBRARY for Android)
  },
  PopoverArrowDirection:{
      ARROW_UP : 1,        // matches iOS UIPopoverArrowDirection constants to specify arrow location on popover
      ARROW_DOWN : 2,
      ARROW_LEFT : 4,
      ARROW_RIGHT : 8,
      ARROW_ANY : 15
  }
};

});

// file: lib/common/plugin/CameraPopoverOptions.js
cordovaDefine("cordova/plugin/CameraPopoverOptions", function(cordovaRequire, exports, module) {

var Camera = cordovaRequire('cordova/plugin/CameraConstants');

/**
 * Encapsulates options for iOS Popover image picker
 */
var CameraPopoverOptions = function(x,y,width,height,arrowDir){
    // information of rectangle that popover should be anchored to
    this.x = x || 0;
    this.y = y || 32;
    this.width = width || 320;
    this.height = height || 480;
    // The direction of the popover arrow
    this.arrowDir = arrowDir || Camera.PopoverArrowDirection.ARROW_ANY;
};

module.exports = CameraPopoverOptions;

});

// file: lib/common/plugin/CaptureAudioOptions.js
cordovaDefine("cordova/plugin/CaptureAudioOptions", function(cordovaRequire, exports, module) {

/**
 * Encapsulates all audio capture operation configuration options.
 */
var CaptureAudioOptions = function(){
    // Upper limit of sound clips user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single sound clip in seconds.
    this.duration = 0;
    // The selected audio mode. Must match with one of the elements in supportedAudioModes array.
    this.mode = null;
};

module.exports = CaptureAudioOptions;

});

// file: lib/common/plugin/CaptureError.js
cordovaDefine("cordova/plugin/CaptureError", function(cordovaRequire, exports, module) {

/**
 * The CaptureError interface encapsulates all errors in the Capture API.
 */
var CaptureError = function(c) {
   this.code = c || null;
};

// Camera or microphone failed to capture image or sound.
CaptureError.CAPTURE_INTERNAL_ERR = 0;
// Camera application or audio capture application is currently serving other capture request.
CaptureError.CAPTURE_APPLICATION_BUSY = 1;
// Invalid use of the API (e.g. limit parameter has value less than one).
CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
// User exited camera application or audio capture application before capturing anything.
CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
// The requested capture operation is not supported.
CaptureError.CAPTURE_NOT_SUPPORTED = 20;

module.exports = CaptureError;

});

// file: lib/common/plugin/CaptureImageOptions.js
cordovaDefine("cordova/plugin/CaptureImageOptions", function(cordovaRequire, exports, module) {

/**
 * Encapsulates all image capture operation configuration options.
 */
var CaptureImageOptions = function(){
    // Upper limit of images user can take. Value must be equal or greater than 1.
    this.limit = 1;
    // The selected image mode. Must match with one of the elements in supportedImageModes array.
    this.mode = null;
};

module.exports = CaptureImageOptions;

});

// file: lib/common/plugin/CaptureVideoOptions.js
cordovaDefine("cordova/plugin/CaptureVideoOptions", function(cordovaRequire, exports, module) {

/**
 * Encapsulates all video capture operation configuration options.
 */
var CaptureVideoOptions = function(){
    // Upper limit of videos user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single video clip in seconds.
    this.duration = 0;
    // The selected video mode. Must match with one of the elements in supportedVideoModes array.
    this.mode = null;
};

module.exports = CaptureVideoOptions;

});

// file: lib/common/plugin/CompassError.js
cordovaDefine("cordova/plugin/CompassError", function(cordovaRequire, exports, module) {

/**
 *  CompassError.
 *  An error code assigned by an implementation when an error has occurred
 * @constructor
 */
var CompassError = function(err) {
    this.code = (err !== uncordovaDefined ? err : null);
};

CompassError.COMPASS_INTERNAL_ERR = 0;
CompassError.COMPASS_NOT_SUPPORTED = 20;

module.exports = CompassError;

});

// file: lib/common/plugin/CompassHeading.js
cordovaDefine("cordova/plugin/CompassHeading", function(cordovaRequire, exports, module) {

var CompassHeading = function(magneticHeading, trueHeading, headingAccuracy, timestamp) {
  this.magneticHeading = (magneticHeading !== uncordovaDefined ? magneticHeading : null);
  this.trueHeading = (trueHeading !== uncordovaDefined ? trueHeading : null);
  this.headingAccuracy = (headingAccuracy !== uncordovaDefined ? headingAccuracy : null);
  this.timestamp = (timestamp !== uncordovaDefined ? timestamp : new Date().getTime());
};

module.exports = CompassHeading;

});

// file: lib/common/plugin/ConfigurationData.js
cordovaDefine("cordova/plugin/ConfigurationData", function(cordovaRequire, exports, module) {

/**
 * Encapsulates a set of parameters that the capture device supports.
 */
function ConfigurationData() {
    // The ASCII-encoded string in lower case representing the media type.
    this.type = null;
    // The height attribute represents height of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0.
    this.height = 0;
    // The width attribute represents width of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0
    this.width = 0;
}

module.exports = ConfigurationData;

});

// file: lib/common/plugin/Connection.js
cordovaDefine("cordova/plugin/Connection", function(cordovaRequire, exports, module) {

/**
 * Network status
 */
module.exports = {
        UNKNOWN: "unknown",
        ETHERNET: "ethernet",
        WIFI: "wifi",
        CELL_2G: "2g",
        CELL_3G: "3g",
        CELL_4G: "4g",
        NONE: "none"
};

});

// file: lib/common/plugin/Contact.js
cordovaDefine("cordova/plugin/Contact", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    ContactError = cordovaRequire('cordova/plugin/ContactError'),
    utils = cordovaRequire('cordova/utils');

/**
* Converts primitives into Complex Object
* Currently only used for Date fields
*/
function convertIn(contact) {
    var value = contact.birthday;
    try {
      contact.birthday = new Date(parseFloat(value));
    } catch (exception){
      console.log("Cordova Contact convertIn error: exception creating date.");
    }
    return contact;
}

/**
* Converts Complex objects into primitives
* Only conversion at present is for Dates.
**/

function convertOut(contact) {
    var value = contact.birthday;
    if (value !== null) {
        // try to make it a Date object if it is not already
        if (!utils.isDate(value)){
            try {
                value = new Date(value);
            } catch(exception){
                value = null;
            }
        }
        if (utils.isDate(value)){
            value = value.valueOf(); // convert to milliseconds
        }
        contact.birthday = value;
    }
    return contact;
}

/**
* Contains information about a single contact.
* @constructor
* @param {DOMString} id unique identifier
* @param {DOMString} displayName
* @param {ContactName} name
* @param {DOMString} nickname
* @param {Array.<ContactField>} phoneNumbers array of phone numbers
* @param {Array.<ContactField>} emails array of email addresses
* @param {Array.<ContactAddress>} addresses array of addresses
* @param {Array.<ContactField>} ims instant messaging user ids
* @param {Array.<ContactOrganization>} organizations
* @param {DOMString} birthday contact's birthday
* @param {DOMString} note user notes about contact
* @param {Array.<ContactField>} photos
* @param {Array.<ContactField>} categories
* @param {Array.<ContactField>} urls contact's web sites
*/
var Contact = function (id, displayName, name, nickname, phoneNumbers, emails, addresses,
    ims, organizations, birthday, note, photos, categories, urls) {
    this.id = id || null;
    this.rawId = null;
    this.displayName = displayName || null;
    this.name = name || null; // ContactName
    this.nickname = nickname || null;
    this.phoneNumbers = phoneNumbers || null; // ContactField[]
    this.emails = emails || null; // ContactField[]
    this.addresses = addresses || null; // ContactAddress[]
    this.ims = ims || null; // ContactField[]
    this.organizations = organizations || null; // ContactOrganization[]
    this.birthday = birthday || null;
    this.note = note || null;
    this.photos = photos || null; // ContactField[]
    this.categories = categories || null; // ContactField[]
    this.urls = urls || null; // ContactField[]
};

/**
* Removes contact from device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.remove = function(successCB, errorCB) {
    var fail = function(code) {
        errorCB(new ContactError(code));
    };
    if (this.id === null) {
        fail(ContactError.UNKNOWN_ERROR);
    }
    else {
        exec(successCB, fail, "Contacts", "remove", [this.id]);
    }
};

/**
* Creates a deep copy of this Contact.
* With the contact ID set to null.
* @return copy of this Contact
*/
Contact.prototype.clone = function() {
    var clonedContact = utils.clone(this);
    var i;
    clonedContact.id = null;
    clonedContact.rawId = null;
    // Loop through and clear out any id's in phones, emails, etc.
    if (clonedContact.phoneNumbers) {
        for (i = 0; i < clonedContact.phoneNumbers.length; i++) {
            clonedContact.phoneNumbers[i].id = null;
        }
    }
    if (clonedContact.emails) {
        for (i = 0; i < clonedContact.emails.length; i++) {
            clonedContact.emails[i].id = null;
        }
    }
    if (clonedContact.addresses) {
        for (i = 0; i < clonedContact.addresses.length; i++) {
            clonedContact.addresses[i].id = null;
        }
    }
    if (clonedContact.ims) {
        for (i = 0; i < clonedContact.ims.length; i++) {
            clonedContact.ims[i].id = null;
        }
    }
    if (clonedContact.organizations) {
        for (i = 0; i < clonedContact.organizations.length; i++) {
            clonedContact.organizations[i].id = null;
        }
    }
    if (clonedContact.categories) {
        for (i = 0; i < clonedContact.categories.length; i++) {
            clonedContact.categories[i].id = null;
        }
    }
    if (clonedContact.photos) {
        for (i = 0; i < clonedContact.photos.length; i++) {
            clonedContact.photos[i].id = null;
        }
    }
    if (clonedContact.urls) {
        for (i = 0; i < clonedContact.urls.length; i++) {
            clonedContact.urls[i].id = null;
        }
    }
    return clonedContact;
};

/**
* Persists contact to device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.save = function(successCB, errorCB) {
  var fail = function(code) {
      errorCB(new ContactError(code));
  };
    var success = function(result) {
      if (result) {
          if (typeof successCB === 'function') {
              var fullContact = cordovaRequire('cordova/plugin/contacts').create(result);
              successCB(convertIn(fullContact));
          }
      }
      else {
          // no Entry object returned
          fail(ContactError.UNKNOWN_ERROR);
      }
  };
    var dupContact = convertOut(utils.clone(this));
    exec(success, fail, "Contacts", "save", [dupContact]);
};


module.exports = Contact;

});

// file: lib/common/plugin/ContactAddress.js
cordovaDefine("cordova/plugin/ContactAddress", function(cordovaRequire, exports, module) {

/**
* Contact address.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param formatted // NOTE: not a W3C standard
* @param streetAddress
* @param locality
* @param region
* @param postalCode
* @param country
*/

var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country) {
    this.id = null;
    this.pref = (typeof pref != 'uncordovaDefined' ? pref : false);
    this.type = type || null;
    this.formatted = formatted || null;
    this.streetAddress = streetAddress || null;
    this.locality = locality || null;
    this.region = region || null;
    this.postalCode = postalCode || null;
    this.country = country || null;
};

module.exports = ContactAddress;

});

// file: lib/common/plugin/ContactError.js
cordovaDefine("cordova/plugin/ContactError", function(cordovaRequire, exports, module) {

/**
 *  ContactError.
 *  An error code assigned by an implementation when an error has occurred
 * @constructor
 */
var ContactError = function(err) {
    this.code = (typeof err != 'uncordovaDefined' ? err : null);
};

/**
 * Error codes
 */
ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.TIMEOUT_ERROR = 2;
ContactError.PENDING_OPERATION_ERROR = 3;
ContactError.IO_ERROR = 4;
ContactError.NOT_SUPPORTED_ERROR = 5;
ContactError.PERMISSION_DENIED_ERROR = 20;

module.exports = ContactError;

});

// file: lib/common/plugin/ContactField.js
cordovaDefine("cordova/plugin/ContactField", function(cordovaRequire, exports, module) {

/**
* Generic contact field.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param type
* @param value
* @param pref
*/
var ContactField = function(type, value, pref) {
    this.id = null;
    this.type = (type && type.toString()) || null;
    this.value = (value && value.toString()) || null;
    this.pref = (typeof pref != 'uncordovaDefined' ? pref : false);
};

module.exports = ContactField;

});

// file: lib/common/plugin/ContactFindOptions.js
cordovaDefine("cordova/plugin/ContactFindOptions", function(cordovaRequire, exports, module) {

/**
 * ContactFindOptions.
 * @constructor
 * @param filter used to match contacts against
 * @param multiple boolean used to determine if more than one contact should be returned
 */

var ContactFindOptions = function(filter, multiple) {
    this.filter = filter || '';
    this.multiple = (typeof multiple != 'uncordovaDefined' ? multiple : false);
};

module.exports = ContactFindOptions;

});

// file: lib/common/plugin/ContactName.js
cordovaDefine("cordova/plugin/ContactName", function(cordovaRequire, exports, module) {

/**
* Contact name.
* @constructor
* @param formatted // NOTE: not part of W3C standard
* @param familyName
* @param givenName
* @param middle
* @param prefix
* @param suffix
*/
var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
    this.formatted = formatted || null;
    this.familyName = familyName || null;
    this.givenName = givenName || null;
    this.middleName = middle || null;
    this.honorificPrefix = prefix || null;
    this.honorificSuffix = suffix || null;
};

module.exports = ContactName;

});

// file: lib/common/plugin/ContactOrganization.js
cordovaDefine("cordova/plugin/ContactOrganization", function(cordovaRequire, exports, module) {

/**
* Contact organization.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code // NOTE: not a W3C standard
* @param name
* @param dept
* @param title
* @param startDate
* @param endDate
* @param location
* @param desc
*/

var ContactOrganization = function(pref, type, name, dept, title) {
    this.id = null;
    this.pref = (typeof pref != 'uncordovaDefined' ? pref : false);
    this.type = type || null;
    this.name = name || null;
    this.department = dept || null;
    this.title = title || null;
};

module.exports = ContactOrganization;

});

// file: lib/common/plugin/Coordinates.js
cordovaDefine("cordova/plugin/Coordinates", function(cordovaRequire, exports, module) {

/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} alt
 * @param {Object} acc
 * @param {Object} head
 * @param {Object} vel
 * @param {Object} altacc
 * @constructor
 */
var Coordinates = function(lat, lng, alt, acc, head, vel, altacc) {
    /**
     * The latitude of the position.
     */
    this.latitude = lat;
    /**
     * The longitude of the position,
     */
    this.longitude = lng;
    /**
     * The accuracy of the position.
     */
    this.accuracy = acc;
    /**
     * The altitude of the position.
     */
    this.altitude = (alt !== uncordovaDefined ? alt : null);
    /**
     * The direction the device is moving at the position.
     */
    this.heading = (head !== uncordovaDefined ? head : null);
    /**
     * The velocity with which the device is moving at the position.
     */
    this.speed = (vel !== uncordovaDefined ? vel : null);

    if (this.speed === 0 || this.speed === null) {
        this.heading = NaN;
    }

    /**
     * The altitude accuracy of the position.
     */
    this.altitudeAccuracy = (altacc !== uncordovaDefined) ? altacc : null;
};

module.exports = Coordinates;

});

// file: lib/common/plugin/DirectoryEntry.js
cordovaDefine("cordova/plugin/DirectoryEntry", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec'),
    Entry = cordovaRequire('cordova/plugin/Entry'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    DirectoryReader = cordovaRequire('cordova/plugin/DirectoryReader');

/**
 * An interface representing a directory on the file system.
 *
 * {boolean} isFile always false (readonly)
 * {boolean} isDirectory always true (readonly)
 * {DOMString} name of the directory, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the directory (readonly)
 * TODO: implement this!!! {FileSystem} filesystem on which the directory resides (readonly)
 */
var DirectoryEntry = function(name, fullPath) {
     DirectoryEntry.__super__.constructor.apply(this, [false, true, name, fullPath]);
};

utils.extend(DirectoryEntry, Entry);

/**
 * Creates a new DirectoryReader to read entries from this directory
 */
DirectoryEntry.prototype.createReader = function() {
    return new DirectoryReader(this.fullPath);
};

/**
 * Creates or looks up a directory
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
 * @param {Flags} options to create or exclusively create the directory
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var entry = new DirectoryEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getDirectory", [this.fullPath, path, options]);
};

/**
 * Deletes a directory and all of it's contents
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(successCallback, fail, "File", "removeRecursively", [this.fullPath]);
};

/**
 * Creates or looks up a file
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
 * @param {Flags} options to create or exclusively create the file
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var FileEntry = cordovaRequire('cordova/plugin/FileEntry');
        var entry = new FileEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getFile", [this.fullPath, path, options]);
};

module.exports = DirectoryEntry;

});

// file: lib/common/plugin/DirectoryReader.js
cordovaDefine("cordova/plugin/DirectoryReader", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    FileError = cordovaRequire('cordova/plugin/FileError') ;

/**
 * An interface that lists the files and directories in a directory.
 */
function DirectoryReader(path) {
    this.path = path || null;
}

/**
 * Returns a list of entries from a directory.
 *
 * @param {Function} successCallback is called with a list of entries
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var retVal = [];
        for (var i=0; i<result.length; i++) {
            var entry = null;
            if (result[i].isDirectory) {
                entry = new (cordovaRequire('cordova/plugin/DirectoryEntry'))();
            }
            else if (result[i].isFile) {
                entry = new (cordovaRequire('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result[i].isDirectory;
            entry.isFile = result[i].isFile;
            entry.name = result[i].name;
            entry.fullPath = result[i].fullPath;
            retVal.push(entry);
        }
        successCallback(retVal);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "readEntries", [this.path]);
};

module.exports = DirectoryReader;

});

// file: lib/common/plugin/Entry.js
cordovaDefine("cordova/plugin/Entry", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    Metadata = cordovaRequire('cordova/plugin/Metadata');

/**
 * Represents a file or directory on the local file system.
 *
 * @param isFile
 *            {boolean} true if Entry is a file (readonly)
 * @param isDirectory
 *            {boolean} true if Entry is a directory (readonly)
 * @param name
 *            {DOMString} name of the file or directory, excluding the path
 *            leading to it (readonly)
 * @param fullPath
 *            {DOMString} the absolute full path to the file or directory
 *            (readonly)
 */
function Entry(isFile, isDirectory, name, fullPath, fileSystem) {
    this.isFile = (typeof isFile != 'uncordovaDefined'?isFile:false);
    this.isDirectory = (typeof isDirectory != 'uncordovaDefined'?isDirectory:false);
    this.name = name || '';
    this.fullPath = fullPath || '';
    this.filesystem = fileSystem || null;
}

/**
 * Look up the metadata of the entry.
 *
 * @param successCallback
 *            {Function} is called with a Metadata object
 * @param errorCallback
 *            {Function} is called with a FileError
 */
Entry.prototype.getMetadata = function(successCallback, errorCallback) {
  var success = typeof successCallback !== 'function' ? null : function(lastModified) {
      var metadata = new Metadata(lastModified);
      successCallback(metadata);
  };
  var fail = typeof errorCallback !== 'function' ? null : function(code) {
      errorCallback(new FileError(code));
  };

  exec(success, fail, "File", "getMetadata", [this.fullPath]);
};

/**
 * Set the metadata of the entry.
 *
 * @param successCallback
 *            {Function} is called with a Metadata object
 * @param errorCallback
 *            {Function} is called with a FileError
 * @param metadataObject
 *            {Object} keys and values to set
 */
Entry.prototype.setMetadata = function(successCallback, errorCallback, metadataObject) {

  exec(successCallback, errorCallback, "File", "setMetadata", [this.fullPath, metadataObject]);
};

/**
 * Move a file or directory to a new location.
 *
 * @param parent
 *            {DirectoryEntry} the directory to which to move this entry
 * @param newName
 *            {DOMString} new name of the entry, defaults to the current name
 * @param successCallback
 *            {Function} called with the new DirectoryEntry object
 * @param errorCallback
 *            {Function} called with a FileError
 */
Entry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
    var fail = function(code) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(code));
        }
    };
    // user must specify parent Entry
    if (!parent) {
        fail(FileError.NOT_FOUND_ERR);
        return;
    }
    // source path
    var srcPath = this.fullPath,
        // entry name
        name = newName || this.name,
        success = function(entry) {
            if (entry) {
                if (typeof successCallback === 'function') {
                    // create appropriate Entry object
                    var result = (entry.isDirectory) ? new (cordovaRequire('cordova/plugin/DirectoryEntry'))(entry.name, entry.fullPath) : new (cordovaRequire('cordova/plugin/FileEntry'))(entry.name, entry.fullPath);
                    try {
                        successCallback(result);
                    }
                    catch (e) {
                        console.log('Error invoking callback: ' + e);
                    }
                }
            }
            else {
                // no Entry object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };

    // copy
    exec(success, fail, "File", "moveTo", [srcPath, parent.fullPath, name]);
};

/**
 * Copy a directory to a different location.
 *
 * @param parent
 *            {DirectoryEntry} the directory to which to copy the entry
 * @param newName
 *            {DOMString} new name of the entry, defaults to the current name
 * @param successCallback
 *            {Function} called with the new Entry object
 * @param errorCallback
 *            {Function} called with a FileError
 */
Entry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
    var fail = function(code) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(code));
        }
    };

    // user must specify parent Entry
    if (!parent) {
        fail(FileError.NOT_FOUND_ERR);
        return;
    }

        // source path
    var srcPath = this.fullPath,
        // entry name
        name = newName || this.name,
        // success callback
        success = function(entry) {
            if (entry) {
                if (typeof successCallback === 'function') {
                    // create appropriate Entry object
                    var result = (entry.isDirectory) ? new (cordovaRequire('cordova/plugin/DirectoryEntry'))(entry.name, entry.fullPath) : new (cordovaRequire('cordova/plugin/FileEntry'))(entry.name, entry.fullPath);
                    try {
                        successCallback(result);
                    }
                    catch (e) {
                        console.log('Error invoking callback: ' + e);
                    }
                }
            }
            else {
                // no Entry object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };

    // copy
    exec(success, fail, "File", "copyTo", [srcPath, parent.fullPath, name]);
};

/**
 * Return a URL that can be used to identify this entry.
 */
Entry.prototype.toURL = function() {
    // fullPath attribute contains the full URL
    return this.fullPath;
};

/**
 * Returns a URI that can be used to identify this entry.
 *
 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
 * @return uri
 */
Entry.prototype.toURI = function(mimeType) {
    console.log("DEPRECATED: Update your code to use 'toURL'");
    // fullPath attribute contains the full URI
    return this.toURL();
};

/**
 * Remove a file or directory. It is an error to attempt to delete a
 * directory that is not empty. It is an error to attempt to delete a
 * root directory of a file system.
 *
 * @param successCallback {Function} called with no parameters
 * @param errorCallback {Function} called with a FileError
 */
Entry.prototype.remove = function(successCallback, errorCallback) {
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(successCallback, fail, "File", "remove", [this.fullPath]);
};

/**
 * Look up the parent DirectoryEntry of this entry.
 *
 * @param successCallback {Function} called with the parent DirectoryEntry object
 * @param errorCallback {Function} called with a FileError
 */
Entry.prototype.getParent = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var DirectoryEntry = cordovaRequire('cordova/plugin/DirectoryEntry');
        var entry = new DirectoryEntry(result.name, result.fullPath);
        successCallback(entry);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getParent", [this.fullPath]);
};

module.exports = Entry;

});

// file: lib/common/plugin/File.js
cordovaDefine("cordova/plugin/File", function(cordovaRequire, exports, module) {

/**
 * Constructor.
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */

var File = function(name, fullPath, type, lastModifiedDate, size){
    this.name = name || '';
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;
};

module.exports = File;

});

// file: lib/common/plugin/FileEntry.js
cordovaDefine("cordova/plugin/FileEntry", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec'),
    Entry = cordovaRequire('cordova/plugin/Entry'),
    FileWriter = cordovaRequire('cordova/plugin/FileWriter'),
    File = cordovaRequire('cordova/plugin/File'),
    FileError = cordovaRequire('cordova/plugin/FileError');

/**
 * An interface representing a file on the file system.
 *
 * {boolean} isFile always true (readonly)
 * {boolean} isDirectory always false (readonly)
 * {DOMString} name of the file, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the file (readonly)
 * {FileSystem} filesystem on which the file resides (readonly)
 */
var FileEntry = function(name, fullPath) {
     FileEntry.__super__.constructor.apply(this, [true, false, name, fullPath]);
};

utils.extend(FileEntry, Entry);

/**
 * Creates a new FileWriter associated with the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new FileWriter
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
    this.file(function(filePointer) {
        var writer = new FileWriter(filePointer);

        if (writer.fileName === null || writer.fileName === "") {
            if (typeof errorCallback === "function") {
                errorCallback(new FileError(FileError.INVALID_STATE_ERR));
            }
        } else {
            if (typeof successCallback === "function") {
                successCallback(writer);
            }
        }
    }, errorCallback);
};

/**
 * Returns a File that represents the current state of the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new File object
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.file = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(f) {
        var file = new File(f.name, f.fullPath, f.type, f.lastModifiedDate, f.size);
        successCallback(file);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };
    exec(win, fail, "File", "getFileMetadata", [this.fullPath]);
};


module.exports = FileEntry;

});

// file: lib/common/plugin/FileError.js
cordovaDefine("cordova/plugin/FileError", function(cordovaRequire, exports, module) {

/**
 * FileError
 */
function FileError(error) {
  this.code = error || null;
}

// File error codes
// Found in DOMException
FileError.NOT_FOUND_ERR = 1;
FileError.SECURITY_ERR = 2;
FileError.ABORT_ERR = 3;

// Added by File API specification
FileError.NOT_READABLE_ERR = 4;
FileError.ENCODING_ERR = 5;
FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
FileError.INVALID_STATE_ERR = 7;
FileError.SYNTAX_ERR = 8;
FileError.INVALID_MODIFICATION_ERR = 9;
FileError.QUOTA_EXCEEDED_ERR = 10;
FileError.TYPE_MISMATCH_ERR = 11;
FileError.PATH_EXISTS_ERR = 12;

module.exports = FileError;

});

// file: lib/common/plugin/FileReader.js
cordovaDefine("cordova/plugin/FileReader", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    ProgressEvent = cordovaRequire('cordova/plugin/ProgressEvent');

/**
 * This class reads the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To read from the SD card, the file name is "sdcard/my_file.txt"
 * @constructor
 */
var FileReader = function() {
    this.fileName = "";

    this.readyState = 0; // FileReader.EMPTY

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progress.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

// States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

/**
 * Abort reading file.
 */
FileReader.prototype.abort = function() {
    this.result = null;

    if (this.readyState == FileReader.DONE || this.readyState == FileReader.EMPTY) {
      return;
    }

    this.readyState = FileReader.DONE;

    // If abort callback
    if (typeof this.onabort === 'function') {
        this.onabort(new ProgressEvent('abort', {target:this}));
    }
    // If load end callback
    if (typeof this.onloadend === 'function') {
        this.onloadend(new ProgressEvent('loadend', {target:this}));
    }
};

/**
 * Read text file.
 *
 * @param file          {File} File object containing file properties
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    // Figure out pathing
    this.fileName = '';
    if (typeof file.fullPath === 'uncordovaDefined') {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    // Default encoding is UTF-8
    var enc = encoding ? encoding : "UTF-8";

    var me = this;

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // Save result
            me.result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // null result
            me.result = null;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsText", [this.fileName, enc]);
};


/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsDataURL = function(file) {
    this.fileName = "";
    if (typeof file.fullPath === "uncordovaDefined") {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    var me = this;

    // Read file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // Save result
            me.result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload(new ProgressEvent("load", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileReader.DONE;

            me.result = null;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {target:me}));
            }

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend(new ProgressEvent("loadend", {target:me}));
            }
        }, "File", "readAsDataURL", [this.fileName]);
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsBinaryString = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('method "readAsBinaryString" is not supported at this time.');
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsArrayBuffer = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('This method is not supported at this time.');
};

module.exports = FileReader;

});

// file: lib/common/plugin/FileSystem.js
cordovaDefine("cordova/plugin/FileSystem", function(cordovaRequire, exports, module) {

var DirectoryEntry = cordovaRequire('cordova/plugin/DirectoryEntry');

/**
 * An interface representing a file system
 *
 * @constructor
 * {DOMString} name the unique name of the file system (readonly)
 * {DirectoryEntry} root directory of the file system (readonly)
 */
var FileSystem = function(name, root) {
    this.name = name || null;
    if (root) {
        this.root = new DirectoryEntry(root.name, root.fullPath);
    }
};

module.exports = FileSystem;

});

// file: lib/common/plugin/FileTransfer.js
cordovaDefine("cordova/plugin/FileTransfer", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    FileTransferError = cordovaRequire('cordova/plugin/FileTransferError'),
    ProgressEvent = cordovaRequire('cordova/plugin/ProgressEvent');

function newProgressEvent(result) {
    var pe = new ProgressEvent();
    pe.lengthComputable = result.lengthComputable;
    pe.loaded = result.loaded;
    pe.total = result.total;
    return pe;
}

var idCounter = 0;

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
var FileTransfer = function() {
    this._id = ++idCounter;
    this.onprogress = null; // optional callback
};

/**
* Given an absolute file path, uploads a file on the device to a remote server
* using a multipart HTTP request.
* @param filePath {String}           Full path of the file on the device
* @param server {String}             URL of the server to receive the file
* @param successCallback (Function}  Callback to be invoked when upload has completed
* @param errorCallback {Function}    Callback to be invoked upon error
* @param options {FileUploadOptions} Optional parameters such as file name and mimetype
* @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
*/
FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options, trustAllHosts) {
    // sanity parameter checking
    if (!filePath || !server) throw new Error("FileTransfer.upload cordovaRequires filePath and server URL parameters at the minimum.");
    // check for options
    var fileKey = null;
    var fileName = null;
    var mimeType = null;
    var params = null;
    var chunkedMode = true;
    var headers = null;
    if (options) {
        fileKey = options.fileKey;
        fileName = options.fileName;
        mimeType = options.mimeType;
        headers = options.headers;
        if (options.chunkedMode !== null || typeof options.chunkedMode != "uncordovaDefined") {
            chunkedMode = options.chunkedMode;
        }
        if (options.params) {
            params = options.params;
        }
        else {
            params = {};
        }
    }

    var fail = function(e) {
        var error = new FileTransferError(e.code, e.source, e.target, e.http_status);
        errorCallback(error);
    };

    var self = this;
    var win = function(result) {
        if (typeof result.lengthComputable != "uncordovaDefined") {
            if (self.onprogress) {
                return self.onprogress(newProgressEvent(result));
            }
        } else {
            return successCallback(result);
        }
    };
    exec(win, fail, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id]);
};

/**
 * Downloads a file form a given URL and saves it to the specified directory.
 * @param source {String}          URL of the server to receive the file
 * @param target {String}         Full path of the file on the device
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 */
FileTransfer.prototype.download = function(source, target, successCallback, errorCallback, trustAllHosts) {
    // sanity parameter checking
    if (!source || !target) throw new Error("FileTransfer.download cordovaRequires source URI and target URI parameters at the minimum.");
    var self = this;
    var win = function(result) {
        if (typeof result.lengthComputable != "uncordovaDefined") {
            if (self.onprogress) {
                return self.onprogress(newProgressEvent(result));
            }
        } else {
            var entry = null;
            if (result.isDirectory) {
                entry = new (cordovaRequire('cordova/plugin/DirectoryEntry'))();
            }
            else if (result.isFile) {
                entry = new (cordovaRequire('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result.isDirectory;
            entry.isFile = result.isFile;
            entry.name = result.name;
            entry.fullPath = result.fullPath;
            successCallback(entry);
        }
    };

    var fail = function(e) {
        var error = new FileTransferError(e.code, e.source, e.target, e.http_status);
        errorCallback(error);
    };

    exec(win, fail, 'FileTransfer', 'download', [source, target, trustAllHosts, this._id]);
};

/**
 * Aborts the ongoing file transfer on this object
 * @param successCallback {Function}  Callback to be invoked upon success
 * @param errorCallback {Function}    Callback to be invoked upon error
 */
FileTransfer.prototype.abort = function(successCallback, errorCallback) {
    exec(successCallback, errorCallback, 'FileTransfer', 'abort', [this._id]);
};

module.exports = FileTransfer;

});

// file: lib/common/plugin/FileTransferError.js
cordovaDefine("cordova/plugin/FileTransferError", function(cordovaRequire, exports, module) {

/**
 * FileTransferError
 * @constructor
 */
var FileTransferError = function(code, source, target, status) {
    this.code = code || null;
    this.source = source || null;
    this.target = target || null;
    this.http_status = status || null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;
FileTransferError.ABORT_ERR = 4;

module.exports = FileTransferError;

});

// file: lib/common/plugin/FileUploadOptions.js
cordovaDefine("cordova/plugin/FileUploadOptions", function(cordovaRequire, exports, module) {

/**
 * Options to customize the HTTP request used to upload files.
 * @constructor
 * @param fileKey {String}   Name of file request parameter.
 * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
 * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
 * @param params {Object}    Object with key: value params to send to the server.
 * @param headers {Object}   Keys are header names, values are header values. Multiple
 *                           headers of the same name are not supported.
 */
var FileUploadOptions = function(fileKey, fileName, mimeType, params, headers) {
    this.fileKey = fileKey || null;
    this.fileName = fileName || null;
    this.mimeType = mimeType || null;
    this.params = params || null;
    this.headers = headers || null;
};

module.exports = FileUploadOptions;

});

// file: lib/common/plugin/FileUploadResult.js
cordovaDefine("cordova/plugin/FileUploadResult", function(cordovaRequire, exports, module) {

/**
 * FileUploadResult
 * @constructor
 */
var FileUploadResult = function() {
    this.bytesSent = 0;
    this.responseCode = null;
    this.response = null;
};

module.exports = FileUploadResult;

});

// file: lib/common/plugin/FileWriter.js
cordovaDefine("cordova/plugin/FileWriter", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    ProgressEvent = cordovaRequire('cordova/plugin/ProgressEvent');

/**
 * This class writes to the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To write to the SD card, the file name is "sdcard/my_file.txt"
 *
 * @constructor
 * @param file {File} File object containing file properties
 * @param append if true write to the end of the file, otherwise overwrite the file
 */
var FileWriter = function(file) {
    this.fileName = "";
    this.length = 0;
    if (file) {
        this.fileName = file.fullPath || file;
        this.length = file.size || 0;
    }
    // default is to write at the beginning of the file
    this.position = 0;

    this.readyState = 0; // EMPTY

    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null;   // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;        // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;        // When the write has failed (see errors).
};

// States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    // check for invalid state
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // set error
    this.error = new FileError(FileError.ABORT_ERR);

    this.readyState = FileWriter.DONE;

    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort(new ProgressEvent("abort", {"target":this}));
    }

    // If write end callback
    if (typeof this.onwriteend === "function") {
        this.onwriteend(new ProgressEvent("writeend", {"target":this}));
    }
};

/**
 * Writes data to the file
 *
 * @param text to be written
 */
FileWriter.prototype.write = function(text) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":me}));
    }

    // Write file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // position always increases by bytes written because file would be extended
            me.position += r;
            // The length of the file is now where we are done writing.

            me.length = me.position;

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        }, "File", "write", [this.fileName, text, this.position]);
};

/**
 * Moves the file pointer to the location specified.
 *
 * If the offset is a negative number the position of the file
 * pointer is rewound.  If the offset is greater than the file
 * size the position is set to the end of the file.
 *
 * @param offset is the location to move the file pointer to.
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    if (!offset && offset !== 0) {
        return;
    }

    // See back from end of file.
    if (offset < 0) {
        this.position = Math.max(offset + this.length, 0);
    }
    // Offset is bigger than file size so set position
    // to the end of the file.
    else if (offset > this.length) {
        this.position = this.length;
    }
    // Offset is between 0 and file size so set the position
    // to start writing.
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the size specified.
 *
 * @param size to chop the file at.
 */
FileWriter.prototype.truncate = function(size) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":this}));
    }

    // Write file
    exec(
        // Success callback
        function(r) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Update the length of the file
            me.length = r;
            me.position = Math.min(me.position, r);

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        },
        // Error callback
        function(e) {
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // Save error
            me.error = new FileError(e);

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror(new ProgressEvent("error", {"target":me}));
            }

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
            }
        }, "File", "truncate", [this.fileName, size]);
};

module.exports = FileWriter;

});

// file: lib/common/plugin/Flags.js
cordovaDefine("cordova/plugin/Flags", function(cordovaRequire, exports, module) {

/**
 * Supplies arguments to methods that lookup or create files and directories.
 *
 * @param create
 *            {boolean} file or directory if it doesn't exist
 * @param exclusive
 *            {boolean} used with create; if true the command will fail if
 *            target path exists
 */
function Flags(create, exclusive) {
    this.create = create || false;
    this.exclusive = exclusive || false;
}

module.exports = Flags;

});

// file: lib/common/plugin/GlobalizationError.js
cordovaDefine("cordova/plugin/GlobalizationError", function(cordovaRequire, exports, module) {


/**
 * Globalization error object
 *
 * @constructor
 * @param code
 * @param message
 */
var GlobalizationError = function(code, message) {
    this.code = code || null;
    this.message = message || '';
};

// Globalization error codes
GlobalizationError.UNKNOWN_ERROR = 0;
GlobalizationError.FORMATTING_ERROR = 1;
GlobalizationError.PARSING_ERROR = 2;
GlobalizationError.PATTERN_ERROR = 3;

module.exports = GlobalizationError;

});

// file: lib/common/plugin/LocalFileSystem.js
cordovaDefine("cordova/plugin/LocalFileSystem", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');

/**
 * Represents a local file system.
 */
var LocalFileSystem = function() {

};

LocalFileSystem.TEMPORARY = 0; //temporary, with no guarantee of persistence
LocalFileSystem.PERSISTENT = 1; //persistent

module.exports = LocalFileSystem;

});

// file: lib/common/plugin/Media.js
cordovaDefine("cordova/plugin/Media", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec');

var mediaObjects = {};

/**
 * This class provides access to the device media, interfaces to both sound and video
 *
 * @constructor
 * @param src                   The file name or url to play
 * @param successCallback       The callback to be called when the file is done playing or recording.
 *                                  successCallback()
 * @param errorCallback         The callback to be called if there is an error.
 *                                  errorCallback(int errorCode) - OPTIONAL
 * @param statusCallback        The callback to be called when media status has changed.
 *                                  statusCallback(int statusCode) - OPTIONAL
 */
var Media = function(src, successCallback, errorCallback, statusCallback) {

    // successCallback optional
    if (successCallback && (typeof successCallback !== "function")) {
        console.log("Media Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Media Error: errorCallback is not a function");
        return;
    }

    // statusCallback optional
    if (statusCallback && (typeof statusCallback !== "function")) {
        console.log("Media Error: statusCallback is not a function");
        return;
    }

    this.id = utils.createUUID();
    mediaObjects[this.id] = this;
    this.src = src;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.statusCallback = statusCallback;
    this._duration = -1;
    this._position = -1;
    exec(null, this.errorCallback, "Media", "create", [this.id, this.src]);
};

// Media messages
Media.MEDIA_STATE = 1;
Media.MEDIA_DURATION = 2;
Media.MEDIA_POSITION = 3;
Media.MEDIA_ERROR = 9;

// Media states
Media.MEDIA_NONE = 0;
Media.MEDIA_STARTING = 1;
Media.MEDIA_RUNNING = 2;
Media.MEDIA_PAUSED = 3;
Media.MEDIA_STOPPED = 4;
Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

// "static" function to return existing objs.
Media.get = function(id) {
    return mediaObjects[id];
};

/**
 * Start or resume playing audio file.
 */
Media.prototype.play = function(options) {
    exec(null, null, "Media", "startPlayingAudio", [this.id, this.src, options]);
};

/**
 * Stop playing audio file.
 */
Media.prototype.stop = function() {
    var me = this;
    exec(function() {
        me._position = 0;
    }, this.errorCallback, "Media", "stopPlayingAudio", [this.id]);
};

/**
 * Seek or jump to a new time in the track..
 */
Media.prototype.seekTo = function(milliseconds) {
    var me = this;
    exec(function(p) {
        me._position = p;
    }, this.errorCallback, "Media", "seekToAudio", [this.id, milliseconds]);
};

/**
 * Pause playing audio file.
 */
Media.prototype.pause = function() {
    exec(null, this.errorCallback, "Media", "pausePlayingAudio", [this.id]);
};

/**
 * Get duration of an audio file.
 * The duration is only set for audio that is playing, paused or stopped.
 *
 * @return      duration or -1 if not known.
 */
Media.prototype.getDuration = function() {
    return this._duration;
};

/**
 * Get position of audio.
 */
Media.prototype.getCurrentPosition = function(success, fail) {
    var me = this;
    exec(function(p) {
        me._position = p;
        success(p);
    }, fail, "Media", "getCurrentPositionAudio", [this.id]);
};

/**
 * Start recording audio file.
 */
Media.prototype.startRecord = function() {
    exec(null, this.errorCallback, "Media", "startRecordingAudio", [this.id, this.src]);
};

/**
 * Stop recording audio file.
 */
Media.prototype.stopRecord = function() {
    exec(null, this.errorCallback, "Media", "stopRecordingAudio", [this.id]);
};

/**
 * Release the resources.
 */
Media.prototype.release = function() {
    exec(null, this.errorCallback, "Media", "release", [this.id]);
};

/**
 * Adjust the volume.
 */
Media.prototype.setVolume = function(volume) {
    exec(null, null, "Media", "setVolume", [this.id, volume]);
};

/**
 * Audio has status update.
 * PRIVATE
 *
 * @param id            The media object id (string)
 * @param msgType       The 'type' of update this is
 * @param value         Use of value is determined by the msgType
 */
Media.onStatus = function(id, msgType, value) {

    var media = mediaObjects[id];

    if(media) {
        switch(msgType) {
            case Media.MEDIA_STATE :
                media.statusCallback && media.statusCallback(value);
                if(value == Media.MEDIA_STOPPED) {
                    media.successCallback && media.successCallback();
                }
                break;
            case Media.MEDIA_DURATION :
                media._duration = value;
                break;
            case Media.MEDIA_ERROR :
                media.errorCallback && media.errorCallback(value);
                break;
            case Media.MEDIA_POSITION :
                media._position = Number(value);
                break;
            default :
                console && console.error && console.error("Unhandled Media.onStatus :: " + msgType);
                break;
        }
    }
    else {
         console && console.error && console.error("Received Media.onStatus callback for unknown media :: " + id);
    }

};

module.exports = Media;

});

// file: lib/common/plugin/MediaError.js
cordovaDefine("cordova/plugin/MediaError", function(cordovaRequire, exports, module) {

/**
 * This class contains information about any Media errors.
*/
/*
 According to :: http://dev.w3.org/html5/spec-author-view/video.html#mediaerror
 We should never be creating these objects, we should just implement the interface
 which has 1 property for an instance, 'code'

 instead of doing :
    errorCallbackFunction( new MediaError(3,'msg') );
we should simply use a literal :
    errorCallbackFunction( {'code':3} );
 */

 var _MediaError = window.MediaError;


if(!_MediaError) {
    window.MediaError = _MediaError = function(code, msg) {
        this.code = (typeof code != 'uncordovaDefined') ? code : null;
        this.message = msg || ""; // message is NON-standard! do not use!
    };
}

_MediaError.MEDIA_ERR_NONE_ACTIVE    = _MediaError.MEDIA_ERR_NONE_ACTIVE    || 0;
_MediaError.MEDIA_ERR_ABORTED        = _MediaError.MEDIA_ERR_ABORTED        || 1;
_MediaError.MEDIA_ERR_NETWORK        = _MediaError.MEDIA_ERR_NETWORK        || 2;
_MediaError.MEDIA_ERR_DECODE         = _MediaError.MEDIA_ERR_DECODE         || 3;
_MediaError.MEDIA_ERR_NONE_SUPPORTED = _MediaError.MEDIA_ERR_NONE_SUPPORTED || 4;
// TODO: MediaError.MEDIA_ERR_NONE_SUPPORTED is legacy, the W3 spec now cordovaDefines it as below.
// as cordovaDefined by http://dev.w3.org/html5/spec-author-view/video.html#error-codes
_MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = _MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 4;

module.exports = _MediaError;

});

// file: lib/common/plugin/MediaFile.js
cordovaDefine("cordova/plugin/MediaFile", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec'),
    File = cordovaRequire('cordova/plugin/File'),
    CaptureError = cordovaRequire('cordova/plugin/CaptureError');
/**
 * Represents a single file.
 *
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */
var MediaFile = function(name, fullPath, type, lastModifiedDate, size){
    MediaFile.__super__.constructor.apply(this, arguments);
};

utils.extend(MediaFile, File);

/**
 * Request capture format data for a specific file and type
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 */
MediaFile.prototype.getFormatData = function(successCallback, errorCallback) {
    if (typeof this.fullPath === "uncordovaDefined" || this.fullPath === null) {
        errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT));
    } else {
        exec(successCallback, errorCallback, "Capture", "getFormatData", [this.fullPath, this.type]);
    }
};

module.exports = MediaFile;

});

// file: lib/common/plugin/MediaFileData.js
cordovaDefine("cordova/plugin/MediaFileData", function(cordovaRequire, exports, module) {

/**
 * MediaFileData encapsulates format information of a media file.
 *
 * @param {DOMString} codecs
 * @param {long} bitrate
 * @param {long} height
 * @param {long} width
 * @param {float} duration
 */
var MediaFileData = function(codecs, bitrate, height, width, duration){
    this.codecs = codecs || null;
    this.bitrate = bitrate || 0;
    this.height = height || 0;
    this.width = width || 0;
    this.duration = duration || 0;
};

module.exports = MediaFileData;

});

// file: lib/common/plugin/Metadata.js
cordovaDefine("cordova/plugin/Metadata", function(cordovaRequire, exports, module) {

/**
 * Information about the state of the file or directory
 *
 * {Date} modificationTime (readonly)
 */
var Metadata = function(time) {
    this.modificationTime = (typeof time != 'uncordovaDefined'?new Date(time):null);
};

module.exports = Metadata;

});

// file: lib/common/plugin/Position.js
cordovaDefine("cordova/plugin/Position", function(cordovaRequire, exports, module) {

var Coordinates = cordovaRequire('cordova/plugin/Coordinates');

var Position = function(coords, timestamp) {
    if (coords) {
        this.coords = new Coordinates(coords.latitude, coords.longitude, coords.altitude, coords.accuracy, coords.heading, coords.velocity, coords.altitudeAccuracy);
    } else {
        this.coords = new Coordinates();
    }
    this.timestamp = (timestamp !== uncordovaDefined) ? timestamp : new Date();
};

module.exports = Position;

});

// file: lib/common/plugin/PositionError.js
cordovaDefine("cordova/plugin/PositionError", function(cordovaRequire, exports, module) {

/**
 * Position error object
 *
 * @constructor
 * @param code
 * @param message
 */
var PositionError = function(code, message) {
    this.code = code || null;
    this.message = message || '';
};

PositionError.PERMISSION_DENIED = 1;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.TIMEOUT = 3;

module.exports = PositionError;

});

// file: lib/common/plugin/ProgressEvent.js
cordovaDefine("cordova/plugin/ProgressEvent", function(cordovaRequire, exports, module) {

// If ProgressEvent exists in global context, use it already, otherwise use our own polyfill
// Feature test: See if we can instantiate a native ProgressEvent;
// if so, use that approach,
// otherwise fill-in with our own implementation.
//
// NOTE: right now we always fill in with our own. Down the road would be nice if we can use whatever is native in the webview.
var ProgressEvent = (function() {
    /*
    var createEvent = function(data) {
        var event = document.createEvent('Events');
        event.initEvent('ProgressEvent', false, false);
        if (data) {
            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    event[i] = data[i];
                }
            }
            if (data.target) {
                // TODO: cannot call <some_custom_object>.dispatchEvent
                // need to first figure out how to implement EventTarget
            }
        }
        return event;
    };
    try {
        var ev = createEvent({type:"abort",target:document});
        return function ProgressEvent(type, data) {
            data.type = type;
            return createEvent(data);
        };
    } catch(e){
    */
        return function ProgressEvent(type, dict) {
            this.type = type;
            this.bubbles = false;
            this.cancelBubble = false;
            this.cancelable = false;
            this.lengthComputable = false;
            this.loaded = dict && dict.loaded ? dict.loaded : 0;
            this.total = dict && dict.total ? dict.total : 0;
            this.target = dict && dict.target ? dict.target : null;
        };
    //}
})();

module.exports = ProgressEvent;

});

// file: lib/common/plugin/accelerometer.js
cordovaDefine("cordova/plugin/accelerometer", function(cordovaRequire, exports, module) {

/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
var utils = cordovaRequire("cordova/utils"),
    exec = cordovaRequire("cordova/exec"),
    Acceleration = cordovaRequire('cordova/plugin/Acceleration');

// Is the accel sensor running?
var running = false;

// Keeps reference to watchAcceleration calls.
var timers = {};

// Array of listeners; used to keep track of when we should call start and stop.
var listeners = [];

// Last returned acceleration object from native
var accel = null;

// Tells native to start.
function start() {
    exec(function(a) {
        var tempListeners = listeners.slice(0);
        accel = new Acceleration(a.x, a.y, a.z, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(accel);
        }
    }, function(e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "Accelerometer", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "Accelerometer", "stop", []);
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return {win:win, fail:fail};
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var accelerometer = {
    /**
     * Asynchronously acquires the current acceleration.
     *
     * @param {Function} successCallback    The function to call when the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     */
    getCurrentAcceleration: function(successCallback, errorCallback, options) {
        // successCallback cordovaRequired
        if (typeof successCallback !== "function") {
            throw "getCurrentAcceleration must be called with at least a success callback function as first parameter.";
        }

        var p;
        var win = function(a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function(e) {
            removeListeners(p);
            errorCallback(e);
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the acceleration repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the acceleration data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
     * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchAcceleration: function(successCallback, errorCallback, options) {
        // Default interval (10 sec)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 10000;

        // successCallback cordovaRequired
        if (typeof successCallback !== "function") {
            throw "watchAcceleration must be called with at least a success callback function as first parameter.";
        }

        // Keep reference to watch id, and report accel readings as often as cordovaDefined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function(){}, function(e) {
            removeListeners(p);
            errorCallback(e);
        });
        listeners.push(p);

        timers[id] = {
            timer:window.setInterval(function() {
                if (accel) {
                    successCallback(accel);
                }
            }, frequency),
            listeners:p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if(accel) {
                successCallback(accel);
            }
        } else {
            start();
        }

        return id;
    },

    /**
     * Clears the specified accelerometer watch.
     *
     * @param {String} id       The id of the watch returned from #watchAcceleration.
     */
    clearWatch: function(id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];
        }
    }
};

module.exports = accelerometer;

});

// file: lib/common/plugin/battery.js
cordovaDefine("cordova/plugin/battery", function(cordovaRequire, exports, module) {

/**
 * This class contains information about the current battery status.
 * @constructor
 */
var cordova = cordovaRequire('cordova'),
    exec = cordovaRequire('cordova/exec');

function handlers() {
  return battery.channels.batterystatus.numHandlers +
         battery.channels.batterylow.numHandlers +
         battery.channels.batterycritical.numHandlers;
}

var Battery = function() {
    this._level = null;
    this._isPlugged = null;
    // Create new event handlers on the window (returns a channel instance)
    this.channels = {
      batterystatus:cordova.addWindowEventHandler("batterystatus"),
      batterylow:cordova.addWindowEventHandler("batterylow"),
      batterycritical:cordova.addWindowEventHandler("batterycritical")
    };
    for (var key in this.channels) {
        this.channels[key].onHasSubscribersChange = Battery.onHasSubscribersChange;
    }
};
/**
 * Event handlers for when callbacks get registered for the battery.
 * Keep track of how many handlers we have so we can start and stop the native battery listener
 * appropriately (and hopefully save on battery life!).
 */
Battery.onHasSubscribersChange = function() {
  // If we just registered the first handler, make sure native listener is started.
  if (this.numHandlers === 1 && handlers() === 1) {
      exec(battery._status, battery._error, "Battery", "start", []);
  } else if (handlers() === 0) {
      exec(null, null, "Battery", "stop", []);
  }
};

/**
 * Callback for battery status
 *
 * @param {Object} info            keys: level, isPlugged
 */
Battery.prototype._status = function(info) {
    if (info) {
        var me = battery;
    var level = info.level;
        if (me._level !== level || me._isPlugged !== info.isPlugged) {
            // Fire batterystatus event
            cordova.fireWindowEvent("batterystatus", info);

            // Fire low battery event
            if (level === 20 || level === 5) {
                if (level === 20) {
                    cordova.fireWindowEvent("batterylow", info);
                }
                else {
                    cordova.fireWindowEvent("batterycritical", info);
                }
            }
        }
        me._level = level;
        me._isPlugged = info.isPlugged;
    }
};

/**
 * Error callback for battery start
 */
Battery.prototype._error = function(e) {
    console.log("Error initializing Battery: " + e);
};

var battery = new Battery();

module.exports = battery;

});

// file: lib/common/plugin/capture.js
cordovaDefine("cordova/plugin/capture", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    MediaFile = cordovaRequire('cordova/plugin/MediaFile');

/**
 * Launches a capture of different types.
 *
 * @param (DOMString} type
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureVideoOptions} options
 */
function _capture(type, successCallback, errorCallback, options) {
    var win = function(pluginResult) {
        var mediaFiles = [];
        var i;
        for (i = 0; i < pluginResult.length; i++) {
            var mediaFile = new MediaFile();
            mediaFile.name = pluginResult[i].name;
            mediaFile.fullPath = pluginResult[i].fullPath;
            mediaFile.type = pluginResult[i].type;
            mediaFile.lastModifiedDate = pluginResult[i].lastModifiedDate;
            mediaFile.size = pluginResult[i].size;
            mediaFiles.push(mediaFile);
        }
        successCallback(mediaFiles);
    };
    exec(win, errorCallback, "Capture", type, [options]);
}
/**
 * The Capture interface exposes an interface to the camera and microphone of the hosting device.
 */
function Capture() {
    this.supportedAudioModes = [];
    this.supportedImageModes = [];
    this.supportedVideoModes = [];
}

/**
 * Launch audio recorder application for recording audio clip(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureAudioOptions} options
 */
Capture.prototype.captureAudio = function(successCallback, errorCallback, options){
    _capture("captureAudio", successCallback, errorCallback, options);
};

/**
 * Launch camera application for taking image(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureImageOptions} options
 */
Capture.prototype.captureImage = function(successCallback, errorCallback, options){
    _capture("captureImage", successCallback, errorCallback, options);
};

/**
 * Launch device camera application for recording video(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureVideoOptions} options
 */
Capture.prototype.captureVideo = function(successCallback, errorCallback, options){
    _capture("captureVideo", successCallback, errorCallback, options);
};


module.exports = new Capture();

});

// file: lib/common/plugin/compass.js
cordovaDefine("cordova/plugin/compass", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    utils = cordovaRequire('cordova/utils'),
    CompassHeading = cordovaRequire('cordova/plugin/CompassHeading'),
    CompassError = cordovaRequire('cordova/plugin/CompassError'),
    timers = {},
    compass = {
        /**
         * Asynchronously acquires the current heading.
         * @param {Function} successCallback The function to call when the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {CompassOptions} options The options for getting the heading data (not used).
         */
        getCurrentHeading:function(successCallback, errorCallback, options) {
            // successCallback cordovaRequired
            if (typeof successCallback !== "function") {
              console.log("Compass Error: successCallback is not a function");
              return;
            }

            // errorCallback optional
            if (errorCallback && (typeof errorCallback !== "function")) {
              console.log("Compass Error: errorCallback is not a function");
              return;
            }

            var win = function(result) {
                var ch = new CompassHeading(result.magneticHeading, result.trueHeading, result.headingAccuracy, result.timestamp);
                successCallback(ch);
            };
            var fail = function(code) {
                var ce = new CompassError(code);
                errorCallback(ce);
            };

            // Get heading
            exec(win, fail, "Compass", "getHeading", [options]);
        },

        /**
         * Asynchronously acquires the heading repeatedly at a given interval.
         * @param {Function} successCallback The function to call each time the heading
         * data is available
         * @param {Function} errorCallback The function to call when there is an error
         * getting the heading data.
         * @param {HeadingOptions} options The options for getting the heading data
         * such as timeout and the frequency of the watch. For iOS, filter parameter
         * specifies to watch via a distance filter rather than time.
         */
        watchHeading:function(successCallback, errorCallback, options) {
            // Default interval (100 msec)
            var frequency = (options !== uncordovaDefined && options.frequency !== uncordovaDefined) ? options.frequency : 100;
            var filter = (options !== uncordovaDefined && options.filter !== uncordovaDefined) ? options.filter : 0;

            // successCallback cordovaRequired
            if (typeof successCallback !== "function") {
              console.log("Compass Error: successCallback is not a function");
              return;
            }

            // errorCallback optional
            if (errorCallback && (typeof errorCallback !== "function")) {
              console.log("Compass Error: errorCallback is not a function");
              return;
            }

            var id = utils.createUUID();
            if (filter > 0) {
                // is an iOS request for watch by filter, no timer needed
                timers[id] = "iOS";
                compass.getCurrentHeading(successCallback, errorCallback, options);
            } else {
                // Start watch timer to get headings
                timers[id] = window.setInterval(function() {
                    compass.getCurrentHeading(successCallback, errorCallback);
                }, frequency);
            }

            return id;
        },

        /**
         * Clears the specified heading watch.
         * @param {String} watchId The ID of the watch returned from #watchHeading.
         */
        clearWatch:function(id) {
            // Stop javascript timer & remove from timer list
            if (id && timers[id]) {
                if (timers[id] != "iOS") {
                      clearInterval(timers[id]);
                  } else {
                    // is iOS watch by filter so call into device to stop
                    exec(null, null, "Compass", "stopHeading", []);
                }
                delete timers[id];
            }
        }
    };

module.exports = compass;

});

// file: lib/common/plugin/console-via-logger.js
cordovaDefine("cordova/plugin/console-via-logger", function(cordovaRequire, exports, module) {

//------------------------------------------------------------------------------

var logger = cordovaRequire("cordova/plugin/logger");
var utils  = cordovaRequire("cordova/utils");

//------------------------------------------------------------------------------
// object that we're exporting
//------------------------------------------------------------------------------
var console = module.exports;

//------------------------------------------------------------------------------
// copy of the original console object
//------------------------------------------------------------------------------
var WinConsole = window.console;

//------------------------------------------------------------------------------
// whether to use the logger
//------------------------------------------------------------------------------
var UseLogger = false;

//------------------------------------------------------------------------------
// Timers
//------------------------------------------------------------------------------
var Timers = {};

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
function noop() {}

//------------------------------------------------------------------------------
// used for unimplemented methods
//------------------------------------------------------------------------------
console.useLogger = function (value) {
    if (arguments.length) UseLogger = !!value;

    if (UseLogger) {
        if (logger.useConsole()) {
            throw new Error("console and logger are too intertwingly");
        }
    }

    return UseLogger;
};

//------------------------------------------------------------------------------
console.log = function() {
    if (logger.useConsole()) return;
    logger.log.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.error = function() {
    if (logger.useConsole()) return;
    logger.error.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.warn = function() {
    if (logger.useConsole()) return;
    logger.warn.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.info = function() {
    if (logger.useConsole()) return;
    logger.info.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.debug = function() {
    if (logger.useConsole()) return;
    logger.debug.apply(logger, [].slice.call(arguments));
};

//------------------------------------------------------------------------------
console.assert = function(expression) {
    if (expression) return;

    var message = utils.vformat(arguments[1], [].slice.call(arguments, 2));
    console.log("ASSERT: " + message);
};

//------------------------------------------------------------------------------
console.clear = function() {};

//------------------------------------------------------------------------------
console.dir = function(object) {
    console.log("%o", object);
};

//------------------------------------------------------------------------------
console.dirxml = function(node) {
    console.log(node.innerHTML);
};

//------------------------------------------------------------------------------
console.trace = noop;

//------------------------------------------------------------------------------
console.group = console.log;

//------------------------------------------------------------------------------
console.groupCollapsed = console.log;

//------------------------------------------------------------------------------
console.groupEnd = noop;

//------------------------------------------------------------------------------
console.time = function(name) {
    Timers[name] = new Date().valueOf();
};

//------------------------------------------------------------------------------
console.timeEnd = function(name) {
    var timeStart = Timers[name];
    if (!timeStart) {
        console.warn("unknown timer: " + name);
        return;
    }

    var timeElapsed = new Date().valueOf() - timeStart;
    console.log(name + ": " + timeElapsed + "ms");
};

//------------------------------------------------------------------------------
console.timeStamp = noop;

//------------------------------------------------------------------------------
console.profile = noop;

//------------------------------------------------------------------------------
console.profileEnd = noop;

//------------------------------------------------------------------------------
console.count = noop;

//------------------------------------------------------------------------------
console.exception = console.log;

//------------------------------------------------------------------------------
console.table = function(data, columns) {
    console.log("%o", data);
};

//------------------------------------------------------------------------------
// return a new function that calls both functions passed as args
//------------------------------------------------------------------------------
function wrappedOrigCall(orgFunc, newFunc) {
    return function() {
        var args = [].slice.call(arguments);
        try { orgFunc.apply(WinConsole, args); } catch (e) {}
        try { newFunc.apply(console,    args); } catch (e) {}
    };
}

//------------------------------------------------------------------------------
// For every function that exists in the original console object, that
// also exists in the new console object, wrap the new console method
// with one that calls both
//------------------------------------------------------------------------------
for (var key in console) {
    if (typeof WinConsole[key] == "function") {
        console[key] = wrappedOrigCall(WinConsole[key], console[key]);
    }
}

});

// file: lib/common/plugin/contacts.js
cordovaDefine("cordova/plugin/contacts", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    ContactError = cordovaRequire('cordova/plugin/ContactError'),
    utils = cordovaRequire('cordova/utils'),
    Contact = cordovaRequire('cordova/plugin/Contact');

/**
* Represents a group of Contacts.
* @constructor
*/
var contacts = {
    /**
     * Returns an array of Contacts matching the search criteria.
     * @param fields that should be searched
     * @param successCB success callback
     * @param errorCB error callback
     * @param {ContactFindOptions} options that can be applied to contact searching
     * @return array of Contacts matching search criteria
     */
    find:function(fields, successCB, errorCB, options) {
        if (!successCB) {
            throw new TypeError("You must specify a success callback for the find command.");
        }
        if (!fields || (utils.isArray(fields) && fields.length === 0)) {
            if (typeof errorCB === "function") {
                errorCB(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
        } else {
            var win = function(result) {
                var cs = [];
                for (var i = 0, l = result.length; i < l; i++) {
                    cs.push(contacts.create(result[i]));
                }
                successCB(cs);
            };
            exec(win, errorCB, "Contacts", "search", [fields, options]);
        }
    },

    /**
     * This function creates a new contact, but it does not persist the contact
     * to device storage. To persist the contact to device storage, invoke
     * contact.save().
     * @param properties an object whose properties will be examined to create a new Contact
     * @returns new Contact object
     */
    create:function(properties) {
        var i;
        var contact = new Contact();
        for (i in properties) {
            if (typeof contact[i] !== 'uncordovaDefined' && properties.hasOwnProperty(i)) {
                contact[i] = properties[i];
            }
        }
        return contact;
    }
};

module.exports = contacts;

});

// file: lib/common/plugin/device.js
cordovaDefine("cordova/plugin/device", function(cordovaRequire, exports, module) {

var channel = cordovaRequire('cordova/channel'),
    utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec');

// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
    this.available = false;
    this.platform = null;
    this.version = null;
    this.name = null;
    this.uuid = null;
    this.cordova = null;

    var me = this;

    channel.onCordovaReady.subscribe(function() {
        me.getInfo(function(info) {
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.name = info.name;
            me.uuid = info.uuid;
            me.cordova = info.cordova;
            channel.onCordovaInfoReady.fire();
        },function(e) {
            me.available = false;
            utils.alert("[ERROR] Error initializing Cordova: " + e);
        });
    });
}

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function(successCallback, errorCallback) {

    // successCallback cordovaRequired
    if (typeof successCallback !== "function") {
        console.log("Device Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Device Error: errorCallback is not a function");
        return;
    }

    // Get info
    exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
};

module.exports = new Device();

});

// file: lib/common/plugin/echo.js
cordovaDefine("cordova/plugin/echo", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');

/**
 * Sends the given message through exec() to the Echo plugin, which sends it back to the successCallback.
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 * @param message  The string to be echoed.
 * @param forceAsync  Whether to force an async return value (for testing native->js bridge).
 */
module.exports = function(successCallback, errorCallback, message, forceAsync) {
    var action = forceAsync ? 'echoAsync' : 'echo';
    exec(successCallback, errorCallback, "Echo", action, [message]);
};


});

// file: lib/common/plugin/geolocation.js
cordovaDefine("cordova/plugin/geolocation", function(cordovaRequire, exports, module) {

var utils = cordovaRequire('cordova/utils'),
    exec = cordovaRequire('cordova/exec'),
    PositionError = cordovaRequire('cordova/plugin/PositionError'),
    Position = cordovaRequire('cordova/plugin/Position');

var timers = {};   // list of timers in use

// Returns default params, overrides if provided with values
function parseParameters(options) {
    var opt = {
        maximumAge: 0,
        enableHighAccuracy: false,
        timeout: Infinity
    };

    if (options) {
        if (options.maximumAge !== uncordovaDefined && !isNaN(options.maximumAge) && options.maximumAge > 0) {
            opt.maximumAge = options.maximumAge;
        }
        if (options.enableHighAccuracy !== uncordovaDefined) {
            opt.enableHighAccuracy = options.enableHighAccuracy;
        }
        if (options.timeout !== uncordovaDefined && !isNaN(options.timeout)) {
            if (options.timeout < 0) {
                opt.timeout = 0;
            } else {
                opt.timeout = options.timeout;
            }
        }
    }

    return opt;
}

// Returns a timeout failure, closed over a specified timeout value and error callback.
function createTimeout(errorCallback, timeout) {
    var t = setTimeout(function() {
        clearTimeout(t);
        t = null;
        errorCallback({
            code:PositionError.TIMEOUT,
            message:"Position retrieval timed out."
        });
    }, timeout);
    return t;
}

var geolocation = {
    lastPosition:null, // reference to last known (cached) position returned
    /**
   * Asynchronously acquires the current position.
   *
   * @param {Function} successCallback    The function to call when the position data is available
   * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
   * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
   */
    getCurrentPosition:function(successCallback, errorCallback, options) {
        if (arguments.length === 0) {
            throw new Error("getCurrentPosition must be called with at least one argument.");
        }
        options = parseParameters(options);

        // Timer var that will fire an error callback if no position is retrieved from native
        // before the "timeout" param provided expires
        var timeoutTimer = {timer:null};

        var win = function(p) {
            clearTimeout(timeoutTimer.timer);
            if (!(timeoutTimer.timer)) {
                // Timeout already happened, or native fired error callback for
                // this geo request.
                // Don't continue with success callback.
                return;
            }
            var pos = new Position(
                {
                    latitude:p.latitude,
                    longitude:p.longitude,
                    altitude:p.altitude,
                    accuracy:p.accuracy,
                    heading:p.heading,
                    velocity:p.velocity,
                    altitudeAccuracy:p.altitudeAccuracy
                },
                (p.timestamp === uncordovaDefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
            );
            geolocation.lastPosition = pos;
            successCallback(pos);
        };
        var fail = function(e) {
            clearTimeout(timeoutTimer.timer);
            timeoutTimer.timer = null;
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        // Check our cached position, if its timestamp difference with current time is less than the maximumAge, then just
        // fire the success callback with the cached position.
        if (geolocation.lastPosition && options.maximumAge && (((new Date()).getTime() - geolocation.lastPosition.timestamp.getTime()) <= options.maximumAge)) {
            successCallback(geolocation.lastPosition);
        // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
        } else if (options.timeout === 0) {
            fail({
                code:PositionError.TIMEOUT,
                message:"timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
            });
        // Otherwise we have to call into native to retrieve a position.
        } else {
            if (options.timeout !== Infinity) {
                // If the timeout value was not set to Infinity (default), then
                // set up a timeout function that will fire the error callback
                // if no successful position was retrieved before timeout expired.
                timeoutTimer.timer = createTimeout(fail, options.timeout);
            } else {
                // This is here so the check in the win function doesn't mess stuff up
                // may seem weird but this guarantees timeoutTimer is
                // always truthy before we call into native
                timeoutTimer.timer = true;
            }
            exec(win, fail, "Geolocation", "getLocation", [options.enableHighAccuracy, options.maximumAge]);
        }
        return timeoutTimer;
    },
    /**
     * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
     * the successCallback is called with the new location.
     *
     * @param {Function} successCallback    The function to call each time the location data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
     * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchPosition:function(successCallback, errorCallback, options) {
        if (arguments.length === 0) {
            throw new Error("watchPosition must be called with at least one argument.");
        }
        options = parseParameters(options);

        var id = utils.createUUID();

        // Tell device to get a position ASAP, and also retrieve a reference to the timeout timer generated in getCurrentPosition
        timers[id] = geolocation.getCurrentPosition(successCallback, errorCallback, options);

        var fail = function(e) {
            clearTimeout(timers[id].timer);
            var err = new PositionError(e.code, e.message);
            if (errorCallback) {
                errorCallback(err);
            }
        };

        var win = function(p) {
            clearTimeout(timers[id].timer);
            if (options.timeout !== Infinity) {
                timers[id].timer = createTimeout(fail, options.timeout);
            }
            var pos = new Position(
                {
                    latitude:p.latitude,
                    longitude:p.longitude,
                    altitude:p.altitude,
                    accuracy:p.accuracy,
                    heading:p.heading,
                    velocity:p.velocity,
                    altitudeAccuracy:p.altitudeAccuracy
                },
                (p.timestamp === uncordovaDefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
            );
            geolocation.lastPosition = pos;
            successCallback(pos);
        };

        exec(win, fail, "Geolocation", "addWatch", [id, options.enableHighAccuracy]);

        return id;
    },
    /**
     * Clears the specified heading watch.
     *
     * @param {String} id       The ID of the watch returned from #watchPosition
     */
    clearWatch:function(id) {
        if (id && timers[id] !== uncordovaDefined) {
            clearTimeout(timers[id].timer);
            timers[id].timer = false;
            exec(null, null, "Geolocation", "clearWatch", [id]);
        }
    }
};

module.exports = geolocation;

});

// file: lib/common/plugin/globalization.js
cordovaDefine("cordova/plugin/globalization", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    GlobalizationError = cordovaRequire('cordova/plugin/GlobalizationError');

var globalization = {

/**
* Returns the string identifier for the client's current language.
* It returns the language identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the language,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The language identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getPreferredLanguage(function (language) {alert('language:' + language.value + '\n');},
*                                function () {});
*/
getPreferredLanguage:function(successCB, failureCB) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getPreferredLanguage Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getPreferredLanguage Error: failureCB is not a function");
        return;
    }

    exec(successCB, failureCB, "Globalization","getPreferredLanguage", []);
},

/**
* Returns the string identifier for the client's current locale setting.
* It returns the locale identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the locale,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The locale identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getLocaleName(function (locale) {alert('locale:' + locale.value + '\n');},
*                                function () {});
*/
getLocaleName:function(successCB, failureCB) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getLocaleName Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getLocaleName Error: failureCB is not a function");
        return;
    }
    exec(successCB, failureCB, "Globalization","getLocaleName", []);
},


/**
* Returns a date formatted as a string according to the client's user preferences and
* calendar using the time zone of the client. It returns the formatted date string to the
* successCB callback with a properties object as a parameter. If there is an error
* formatting the date, then the errorCB callback is invoked.
*
* The defaults are: formatLenght="short" and selector="date and time"
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return Object.value {String}: The localized date string
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.dateToString(new Date(),
*                function (date) {alert('date:' + date.value + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {formatLength:'short'});
*/
dateToString:function(date, successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.dateToString Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.dateToString Error: failureCB is not a function");
        return;
    }


    if (date instanceof Date){
        var dateValue;
        dateValue = date.valueOf();
        exec(successCB, failureCB, "Globalization", "dateToString", [{"date": dateValue, "options": options}]);
    }
    else {
        console.log("Globalization.dateToString Error: date is not a Date object");
    }
},


/**
* Parses a date formatted as a string according to the client's user
* preferences and calendar using the time zone of the client and returns
* the corresponding date object. It returns the date to the successCB
* callback with a properties object as a parameter. If there is an error
* parsing the date string, then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {String} dateString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.year {Number}: The four digit year
*            Object.month {Number}: The month from (0 - 11)
*            Object.day {Number}: The day from (1 - 31)
*            Object.hour {Number}: The hour from (0 - 23)
*            Object.minute {Number}: The minute from (0 - 59)
*            Object.second {Number}: The second from (0 - 59)
*            Object.millisecond {Number}: The milliseconds (from 0 - 999),
*                                        not available on all platforms
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToDate('4/11/2011',
*                function (date) { alert('Month:' + date.month + '\n' +
*                    'Day:' + date.day + '\n' +
*                    'Year:' + date.year + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {selector:'date'});
*/
stringToDate:function(dateString, successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.stringToDate Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.stringToDate Error: failureCB is not a function");
        return;
    }
    if (typeof dateString == "string"){
        exec(successCB, failureCB, "Globalization", "stringToDate", [{"dateString": dateString, "options": options}]);
    }
    else {
        console.log("Globalization.stringToDate Error: dateString is not a string");
    }
},


/**
* Returns a pattern string for formatting and parsing dates according to the client's
* user preferences. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern,
* then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.pattern {String}: The date and time pattern for formatting and parsing dates.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.timezone {String}: The abbreviated name of the time zone on the client
*            Object.utc_offset {Number}: The current difference in seconds between the client's
*                                        time zone and coordinated universal time.
*            Object.dst_offset {Number}: The current daylight saving time offset in seconds
*                                        between the client's non-daylight saving's time zone
*                                        and the client's daylight saving's time zone.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getDatePattern(
*                function (date) {alert('pattern:' + date.pattern + '\n');},
*                function () {},
*                {formatLength:'short'});
*/
getDatePattern:function(successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getDatePattern Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getDatePattern Error: failureCB is not a function");
        return;
    }

    exec(successCB, failureCB, "Globalization", "getDatePattern", [{"options": options}]);
},


/**
* Returns an array of either the names of the months or days of the week
* according to the client's user preferences and calendar. It returns the array of names to the
* successCB callback with a properties object as a parameter. If there is an error obtaining the
* names, then the errorCB callback is invoked.
*
* The defaults are: type="wide" and item="months"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'narrow' or 'wide'
*            item {String}: 'months', or 'days'
*
* @return Object.value {Array{String}}: The array of names starting from either
*                                        the first month in the year or the
*                                        first day of the week.
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getDateNames(function (names) {
*        for(var i = 0; i < names.value.length; i++) {
*            alert('Month:' + names.value[i] + '\n');}},
*        function () {});
*/
getDateNames:function(successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getDateNames Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getDateNames Error: failureCB is not a function");
        return;
    }
    exec(successCB, failureCB, "Globalization", "getDateNames", [{"options": options}]);
},

/**
* Returns whether daylight savings time is in effect for a given date using the client's
* time zone and calendar. It returns whether or not daylight savings time is in effect
* to the successCB callback with a properties object as a parameter. If there is an error
* reading the date, then the errorCB callback is invoked.
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.dst {Boolean}: The value "true" indicates that daylight savings time is
*                                in effect for the given date and "false" indicate that it is not.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.isDayLightSavingsTime(new Date(),
*                function (date) {alert('dst:' + date.dst + '\n');}
*                function () {});
*/
isDayLightSavingsTime:function(date, successCB, failureCB) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.isDayLightSavingsTime Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.isDayLightSavingsTime Error: failureCB is not a function");
        return;
    }


    if (date instanceof Date){
        var dateValue;
        dateValue = date.valueOf();
        exec(successCB, failureCB, "Globalization", "isDayLightSavingsTime", [{"date": dateValue}]);
    }
    else {
        console.log("Globalization.isDayLightSavingsTime Error: date is not a Date object");
    }

},

/**
* Returns the first day of the week according to the client's user preferences and calendar.
* The days of the week are numbered starting from 1 where 1 is considered to be Sunday.
* It returns the day to the successCB callback with a properties object as a parameter.
* If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {Number}: The number of the first day of the week.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getFirstDayOfWeek(function (day)
*                { alert('Day:' + day.value + '\n');},
*                function () {});
*/
getFirstDayOfWeek:function(successCB, failureCB) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getFirstDayOfWeek Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getFirstDayOfWeek Error: failureCB is not a function");
        return;
    }

    exec(successCB, failureCB, "Globalization", "getFirstDayOfWeek", []);
},


/**
* Returns a number formatted as a string according to the client's user preferences.
* It returns the formatted number string to the successCB callback with a properties object as a
* parameter. If there is an error formatting the number, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Number} number
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {String}: The formatted number string.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.numberToString(3.25,
*                function (number) {alert('number:' + number.value + '\n');},
*                function () {},
*                {type:'decimal'});
*/
numberToString:function(number, successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.numberToString Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.numberToString Error: failureCB is not a function");
        return;
    }

    if(typeof number == "number") {
        exec(successCB, failureCB, "Globalization", "numberToString", [{"number": number, "options": options}]);
    }
    else {
        console.log("Globalization.numberToString Error: number is not a number");
    }
},

/**
* Parses a number formatted as a string according to the client's user preferences and
* returns the corresponding number. It returns the number to the successCB callback with a
* properties object as a parameter. If there is an error parsing the number string, then
* the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {String} numberString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {Number}: The parsed number.
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToNumber('1234.56',
*                function (number) {alert('Number:' + number.value + '\n');},
*                function () { alert('Error parsing number');});
*/
stringToNumber:function(numberString, successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.stringToNumber Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.stringToNumber Error: failureCB is not a function");
        return;
    }

    if(typeof numberString == "string") {
        exec(successCB, failureCB, "Globalization", "stringToNumber", [{"numberString": numberString, "options": options}]);
    }
    else {
        console.log("Globalization.stringToNumber Error: numberString is not a string");
    }
},

/**
* Returns a pattern string for formatting and parsing numbers according to the client's user
* preferences. It returns the pattern to the successCB callback with a properties object as a
* parameter. If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return    Object.pattern {String}: The number pattern for formatting and parsing numbers.
*                                    The patterns follow Unicode Technical Standard #35.
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.symbol {String}: The symbol to be used when formatting and parsing
*                                    e.g., percent or currency symbol.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting numbers.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.positive {String}: The symbol to use for positive numbers when parsing and formatting.
*            Object.negative: {String}: The symbol to use for negative numbers when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getNumberPattern(
*                function (pattern) {alert('Pattern:' + pattern.pattern + '\n');},
*                function () {});
*/
getNumberPattern:function(successCB, failureCB, options) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getNumberPattern Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getNumberPattern Error: failureCB is not a function");
        return;
    }

    exec(successCB, failureCB, "Globalization", "getNumberPattern", [{"options": options}]);
},

/**
* Returns a pattern string for formatting and parsing currency values according to the client's
* user preferences and ISO 4217 currency code. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern, then the errorCB
* callback is invoked.
*
* @param {String} currencyCode
* @param {Function} successCB
* @param {Function} errorCB
*
* @return    Object.pattern {String}: The currency pattern for formatting and parsing currency values.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.code {String}: The ISO 4217 currency code for the pattern.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting currency.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.getCurrencyPattern('EUR',
*                function (currency) {alert('Pattern:' + currency.pattern + '\n');}
*                function () {});
*/
getCurrencyPattern:function(currencyCode, successCB, failureCB) {
    // successCallback cordovaRequired
    if (typeof successCB != "function") {
        console.log("Globalization.getCurrencyPattern Error: successCB is not a function");
        return;
    }

    // errorCallback cordovaRequired
    if (typeof failureCB != "function") {
        console.log("Globalization.getCurrencyPattern Error: failureCB is not a function");
        return;
    }

    if(typeof currencyCode == "string") {
        exec(successCB, failureCB, "Globalization", "getCurrencyPattern", [{"currencyCode": currencyCode}]);
    }
    else {
        console.log("Globalization.getCurrencyPattern Error: currencyCode is not a currency code");
    }
}

};

module.exports = globalization;

});

// file: lib/webworks/java/plugin/java/Contact.js
cordovaDefine("cordova/plugin/java/Contact", function(cordovaRequire, exports, module) {

var ContactError = cordovaRequire('cordova/plugin/ContactError'),
    ContactUtils = cordovaRequire('cordova/plugin/java/ContactUtils'),
    utils = cordovaRequire('cordova/utils'),
    ContactAddress = cordovaRequire('cordova/plugin/ContactAddress'),
    exec = cordovaRequire('cordova/exec');

// ------------------
// Utility functions
// ------------------

/**
 * Retrieves a BlackBerry contact from the device by unique id.
 *
 * @param uid
 *            Unique id of the contact on the device
 * @return {blackberry.pim.Contact} BlackBerry contact or null if contact with
 *         specified id is not found
 */
var findByUniqueId = function(uid) {
    if (!uid) {
        return null;
    }
    var bbContacts = blackberry.pim.Contact.find(new blackberry.find.FilterExpression("uid", "==", uid));
    return bbContacts[0] || null;
};

/**
 * Creates a BlackBerry contact object from the W3C Contact object and persists
 * it to device storage.
 *
 * @param {Contact}
 *            contact The contact to save
 * @return a new contact object with all properties set
 */
var saveToDevice = function(contact) {

    if (!contact) {
        return;
    }

    var bbContact = null;
    var update = false;

    // if the underlying BlackBerry contact already exists, retrieve it for
    // update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device
        // because this may be an update operation
        bbContact = findByUniqueId(contact.id);
    }

    // contact not found on device, create a new one
    if (!bbContact) {
        bbContact = new blackberry.pim.Contact();
    }
    // update the existing contact
    else {
        update = true;
    }

    // NOTE: The user may be working with a partial Contact object, because only
    // user-specified Contact fields are returned from a find operation (blame
    // the W3C spec). If this is an update to an existing Contact, we don't
    // want to clear an attribute from the contact database simply because the
    // Contact object that the user passed in contains a null value for that
    // attribute. So we only copy the non-null Contact attributes to the
    // BlackBerry contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a
    // non-null value in order to update it in the contact database.
    //
    // name
    if (contact.name !== null) {
        if (contact.name.givenName) {
            bbContact.firstName = contact.name.givenName;
        }
        if (contact.name.familyName) {
            bbContact.lastName = contact.name.familyName;
        }
        if (contact.name.honorificPrefix) {
            bbContact.title = contact.name.honorificPrefix;
        }
    }

    // display name
    if (contact.displayName !== null) {
        bbContact.user1 = contact.displayName;
    }

    // note
    if (contact.note !== null) {
        bbContact.note = contact.note;
    }

    // birthday
    //
    // user may pass in Date object or a string representation of a date
    // if it is a string, we don't know the date format, so try to create a
    // new Date with what we're given
    //
    // NOTE: BlackBerry's Date.parse() does not work well, so use new Date()
    //
    if (contact.birthday !== null) {
        if (utils.isDate(contact.birthday)) {
            bbContact.birthday = contact.birthday;
        } else {
            var bday = contact.birthday.toString();
            bbContact.birthday = (bday.length > 0) ? new Date(bday) : "";
        }
    }

    // BlackBerry supports three email addresses
    if (contact.emails && utils.isArray(contact.emails)) {

        // if this is an update, re-initialize email addresses
        if (update) {
            bbContact.email1 = "";
            bbContact.email2 = "";
            bbContact.email3 = "";
        }

        // copy the first three email addresses found
        var email = null;
        for ( var i = 0; i < contact.emails.length; i += 1) {
            email = contact.emails[i];
            if (!email || !email.value) {
                continue;
            }
            if (bbContact.email1 === "") {
                bbContact.email1 = email.value;
            } else if (bbContact.email2 === "") {
                bbContact.email2 = email.value;
            } else if (bbContact.email3 === "") {
                bbContact.email3 = email.value;
            }
        }
    }

    // BlackBerry supports a finite number of phone numbers
    // copy into appropriate fields based on type
    if (contact.phoneNumbers && utils.isArray(contact.phoneNumbers)) {

        // if this is an update, re-initialize phone numbers
        if (update) {
            bbContact.homePhone = "";
            bbContact.homePhone2 = "";
            bbContact.workPhone = "";
            bbContact.workPhone2 = "";
            bbContact.mobilePhone = "";
            bbContact.faxPhone = "";
            bbContact.pagerPhone = "";
            bbContact.otherPhone = "";
        }

        var type = null;
        var number = null;
        for ( var j = 0; j < contact.phoneNumbers.length; j += 1) {
            if (!contact.phoneNumbers[j] || !contact.phoneNumbers[j].value) {
                continue;
            }
            type = contact.phoneNumbers[j].type;
            number = contact.phoneNumbers[j].value;
            if (type === 'home') {
                if (bbContact.homePhone === "") {
                    bbContact.homePhone = number;
                } else if (bbContact.homePhone2 === "") {
                    bbContact.homePhone2 = number;
                }
            } else if (type === 'work') {
                if (bbContact.workPhone === "") {
                    bbContact.workPhone = number;
                } else if (bbContact.workPhone2 === "") {
                    bbContact.workPhone2 = number;
                }
            } else if (type === 'mobile' && bbContact.mobilePhone === "") {
                bbContact.mobilePhone = number;
            } else if (type === 'fax' && bbContact.faxPhone === "") {
                bbContact.faxPhone = number;
            } else if (type === 'pager' && bbContact.pagerPhone === "") {
                bbContact.pagerPhone = number;
            } else if (bbContact.otherPhone === "") {
                bbContact.otherPhone = number;
            }
        }
    }

    // BlackBerry supports two addresses: home and work
    // copy the first two addresses found from Contact
    if (contact.addresses && utils.isArray(contact.addresses)) {

        // if this is an update, re-initialize addresses
        if (update) {
            bbContact.homeAddress = null;
            bbContact.workAddress = null;
        }

        var address = null;
        var bbHomeAddress = null;
        var bbWorkAddress = null;
        for ( var k = 0; k < contact.addresses.length; k += 1) {
            address = contact.addresses[k];
            if (!address || address.id === uncordovaDefined || address.pref === uncordovaDefined || address.type === uncordovaDefined || address.formatted === uncordovaDefined) {
                continue;
            }

            if (bbHomeAddress === null && (!address.type || address.type === "home")) {
                bbHomeAddress = createBlackBerryAddress(address);
                bbContact.homeAddress = bbHomeAddress;
            } else if (bbWorkAddress === null && (!address.type || address.type === "work")) {
                bbWorkAddress = createBlackBerryAddress(address);
                bbContact.workAddress = bbWorkAddress;
            }
        }
    }

    // copy first url found to BlackBerry 'webpage' field
    if (contact.urls && utils.isArray(contact.urls)) {

        // if this is an update, re-initialize web page
        if (update) {
            bbContact.webpage = "";
        }

        var url = null;
        for ( var m = 0; m < contact.urls.length; m += 1) {
            url = contact.urls[m];
            if (!url || !url.value) {
                continue;
            }
            if (bbContact.webpage === "") {
                bbContact.webpage = url.value;
                break;
            }
        }
    }

    // copy fields from first organization to the
    // BlackBerry 'company' and 'jobTitle' fields
    if (contact.organizations && utils.isArray(contact.organizations)) {

        // if this is an update, re-initialize org attributes
        if (update) {
            bbContact.company = "";
        }

        var org = null;
        for ( var n = 0; n < contact.organizations.length; n += 1) {
            org = contact.organizations[n];
            if (!org) {
                continue;
            }
            if (bbContact.company === "") {
                bbContact.company = org.name || "";
                bbContact.jobTitle = org.title || "";
                break;
            }
        }
    }

    // categories
    if (contact.categories && utils.isArray(contact.categories)) {
        bbContact.categories = [];
        var category = null;
        for ( var o = 0; o < contact.categories.length; o += 1) {
            category = contact.categories[o];
            if (typeof category == "string") {
                bbContact.categories.push(category);
            }
        }
    }

    // save to device
    bbContact.save();

    // invoke native side to save photo
    // fail gracefully if photo URL is no good, but log the error
    if (contact.photos && utils.isArray(contact.photos)) {
        var photo = null;
        for ( var p = 0; p < contact.photos.length; p += 1) {
            photo = contact.photos[p];
            if (!photo || !photo.value) {
                continue;
            }
            exec(
            // success
            function() {
            },
            // fail
            function(e) {
                console.log('Contact.setPicture failed:' + e);
            }, "Contacts", "setPicture", [ bbContact.uid, photo.type,
                    photo.value ]);
            break;
        }
    }

    // Use the fully populated BlackBerry contact object to create a
    // corresponding W3C contact object.
    return ContactUtils.createContact(bbContact, [ "*" ]);
};

/**
 * Creates a BlackBerry Address object from a W3C ContactAddress.
 *
 * @return {blackberry.pim.Address} a BlackBerry address object
 */
var createBlackBerryAddress = function(address) {
    var bbAddress = new blackberry.pim.Address();

    if (!address) {
        return bbAddress;
    }

    bbAddress.address1 = address.streetAddress || "";
    bbAddress.city = address.locality || "";
    bbAddress.stateProvince = address.region || "";
    bbAddress.zipPostal = address.postalCode || "";
    bbAddress.country = address.country || "";

    return bbAddress;
};

module.exports = {
    /**
     * Persists contact to device storage.
     */
    save : function(success, fail) {
        try {
            // save the contact and store it's unique id
            var fullContact = saveToDevice(this);
            this.id = fullContact.id;

            // This contact object may only have a subset of properties
            // if the save was an update of an existing contact. This is
            // because the existing contact was likely retrieved using a
            // subset of properties, so only those properties were set in the
            // object. For this reason, invoke success with the contact object
            // returned by saveToDevice since it is fully populated.
            if (typeof success === 'function') {
                success(fullContact);
            }
        } catch (e) {
            console.log('Error saving contact: ' + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    },

    /**
     * Removes contact from device storage.
     *
     * @param success
     *            success callback
     * @param fail
     *            error callback
     */
    remove : function(success, fail) {
        try {
            // retrieve contact from device by id
            var bbContact = null;
            if (this.id) {
                bbContact = findByUniqueId(this.id);
            }

            // if contact was found, remove it
            if (bbContact) {
                console.log('removing contact: ' + bbContact.uid);
                bbContact.remove();
                if (typeof success === 'function') {
                    success(this);
                }
            }
            // attempting to remove a contact that hasn't been saved
            else if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        } catch (e) {
            console.log('Error removing contact ' + this.id + ": " + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    }
};

});

// file: lib/webworks/java/plugin/java/ContactUtils.js
cordovaDefine("cordova/plugin/java/ContactUtils", function(cordovaRequire, exports, module) {

var ContactAddress = cordovaRequire('cordova/plugin/ContactAddress'),
    ContactName = cordovaRequire('cordova/plugin/ContactName'),
    ContactField = cordovaRequire('cordova/plugin/ContactField'),
    ContactOrganization = cordovaRequire('cordova/plugin/ContactOrganization'),
    utils = cordovaRequire('cordova/utils'),
    Contact = cordovaRequire('cordova/plugin/Contact');

/**
 * Mappings for each Contact field that may be used in a find operation. Maps
 * W3C Contact fields to one or more fields in a BlackBerry contact object.
 *
 * Example: user searches with a filter on the Contact 'name' field:
 *
 * <code>Contacts.find(['name'], onSuccess, onFail, {filter:'Bob'});</code>
 *
 * The 'name' field does not exist in a BlackBerry contact. Instead, a filter
 * expression will be built to search the BlackBerry contacts using the
 * BlackBerry 'title', 'firstName' and 'lastName' fields.
 */
var fieldMappings = {
    "id" : "uid",
    "displayName" : "user1",
    "name" : [ "title", "firstName", "lastName" ],
    "name.formatted" : [ "title", "firstName", "lastName" ],
    "name.givenName" : "firstName",
    "name.familyName" : "lastName",
    "name.honorificPrefix" : "title",
    "phoneNumbers" : [ "faxPhone", "homePhone", "homePhone2", "mobilePhone",
            "pagerPhone", "otherPhone", "workPhone", "workPhone2" ],
    "phoneNumbers.value" : [ "faxPhone", "homePhone", "homePhone2",
            "mobilePhone", "pagerPhone", "otherPhone", "workPhone",
            "workPhone2" ],
    "emails" : [ "email1", "email2", "email3" ],
    "addresses" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.formatted" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.streetAddress" : [ "homeAddress.address1",
            "homeAddress.address2", "workAddress.address1",
            "workAddress.address2" ],
    "addresses.locality" : [ "homeAddress.city", "workAddress.city" ],
    "addresses.region" : [ "homeAddress.stateProvince",
            "workAddress.stateProvince" ],
    "addresses.country" : [ "homeAddress.country", "workAddress.country" ],
    "organizations" : [ "company", "jobTitle" ],
    "organizations.name" : "company",
    "organizations.title" : "jobTitle",
    "birthday" : "birthday",
    "note" : "note",
    "categories" : "categories",
    "urls" : "webpage",
    "urls.value" : "webpage"
};

/*
 * Build an array of all of the valid W3C Contact fields. This is used to
 * substitute all the fields when ["*"] is specified.
 */
var allFields = [];
for ( var key in fieldMappings) {
    if (fieldMappings.hasOwnProperty(key)) {
        allFields.push(key);
    }
}

/**
 * Create a W3C ContactAddress object from a BlackBerry Address object.
 *
 * @param {String}
 *            type the type of address (e.g. work, home)
 * @param {blackberry.pim.Address}
 *            bbAddress a BlackBerry Address object
 * @return {ContactAddress} a contact address object or null if the specified
 *         address is null
 */
var createContactAddress = function(type, bbAddress) {

    if (!bbAddress) {
        return null;
    }

    var address1 = bbAddress.address1 || "";
    var address2 = bbAddress.address2 || "";
    var streetAddress = address1 + ", " + address2;
    var locality = bbAddress.city || "";
    var region = bbAddress.stateProvince || "";
    var postalCode = bbAddress.zipPostal || "";
    var country = bbAddress.country || "";
    var formatted = streetAddress + ", " + locality + ", " + region + ", " + postalCode + ", " + country;

    return new ContactAddress(null, type, formatted, streetAddress, locality,
            region, postalCode, country);
};

module.exports = {
    /**
     * Builds a BlackBerry filter expression for contact search using the
     * contact fields and search filter provided.
     *
     * @param {String[]}
     *            fields Array of Contact fields to search
     * @param {String}
     *            filter Filter, or search string
     * @return filter expression or null if fields is empty or filter is null or
     *         empty
     */
    buildFilterExpression : function(fields, filter) {

        // ensure filter exists
        if (!filter || filter === "") {
            return null;
        }

        if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // BlackBerry API uses specific operators to build filter expressions
        // for
        // querying Contact lists. The operators are
        // ["!=","==","<",">","<=",">="].
        // Use of regex is also an option, and the only one we can use to
        // simulate
        // an SQL '%LIKE%' clause.
        //
        // Note: The BlackBerry regex implementation doesn't seem to support
        // conventional regex switches that would enable a case insensitive
        // search.
        // It does not honor the (?i) switch (which causes Contact.find() to
        // fail).
        // We need case INsensitivity to match the W3C Contacts API spec.
        // So the guys at RIM proposed this method:
        //
        // original filter = "norm"
        // case insensitive filter = "[nN][oO][rR][mM]"
        //
        var ciFilter = "";
        for ( var i = 0; i < filter.length; i++) {
            ciFilter = ciFilter + "[" + filter[i].toLowerCase() + filter[i].toUpperCase() + "]";
        }

        // match anything that contains our filter string
        filter = ".*" + ciFilter + ".*";

        // build a filter expression using all Contact fields provided
        var filterExpression = null;
        if (fields && utils.isArray(fields)) {
            var fe = null;
            for (var f = 0; f < fields.length; f++) {
                if (!fields[f]) {
                    continue;
                }

                // retrieve the BlackBerry contact fields that map to the one
                // specified
                var bbFields = fieldMappings[fields[f]];

                // BlackBerry doesn't support the field specified
                if (!bbFields) {
                    continue;
                }

                if (!utils.isArray(bbFields)) {
                    bbFields = [bbFields];
                }

                // construct the filter expression using the BlackBerry fields
                for (var j = 0; j < bbFields.length; j++) {
                    fe = new blackberry.find.FilterExpression(bbFields[j],
                            "REGEX", filter);
                    if (filterExpression === null) {
                        filterExpression = fe;
                    } else {
                        // combine the filters
                        filterExpression = new blackberry.find.FilterExpression(
                                filterExpression, "OR", fe);
                    }
                }
            }
        }

        return filterExpression;
    },

    /**
     * Creates a Contact object from a BlackBerry Contact object, copying only
     * the fields specified.
     *
     * This is intended as a privately used function but it is made globally
     * available so that a Contact.save can convert a BlackBerry contact object
     * into its W3C equivalent.
     *
     * @param {blackberry.pim.Contact}
     *            bbContact BlackBerry Contact object
     * @param {String[]}
     *            fields array of contact fields that should be copied
     * @return {Contact} a contact object containing the specified fields or
     *         null if the specified contact is null
     */
    createContact : function(bbContact, fields) {

        if (!bbContact) {
            return null;
        }

        // construct a new contact object
        // always copy the contact id and displayName fields
        var contact = new Contact(bbContact.uid, bbContact.user1);

        // nothing to do
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            return contact;
        } else if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // add the fields specified
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];

            if (!field) {
                continue;
            }

            // name
            if (field.indexOf('name') === 0) {
                var formattedName = bbContact.title + ' ' + bbContact.firstName + ' ' + bbContact.lastName;
                contact.name = new ContactName(formattedName,
                        bbContact.lastName, bbContact.firstName, null,
                        bbContact.title, null);
            }
            // phone numbers
            else if (field.indexOf('phoneNumbers') === 0) {
                var phoneNumbers = [];
                if (bbContact.homePhone) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone));
                }
                if (bbContact.homePhone2) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone2));
                }
                if (bbContact.workPhone) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone));
                }
                if (bbContact.workPhone2) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone2));
                }
                if (bbContact.mobilePhone) {
                    phoneNumbers.push(new ContactField('mobile',
                            bbContact.mobilePhone));
                }
                if (bbContact.faxPhone) {
                    phoneNumbers.push(new ContactField('fax',
                            bbContact.faxPhone));
                }
                if (bbContact.pagerPhone) {
                    phoneNumbers.push(new ContactField('pager',
                            bbContact.pagerPhone));
                }
                if (bbContact.otherPhone) {
                    phoneNumbers.push(new ContactField('other',
                            bbContact.otherPhone));
                }
                contact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers
                        : null;
            }
            // emails
            else if (field.indexOf('emails') === 0) {
                var emails = [];
                if (bbContact.email1) {
                    emails.push(new ContactField(null, bbContact.email1, null));
                }
                if (bbContact.email2) {
                    emails.push(new ContactField(null, bbContact.email2, null));
                }
                if (bbContact.email3) {
                    emails.push(new ContactField(null, bbContact.email3, null));
                }
                contact.emails = emails.length > 0 ? emails : null;
            }
            // addresses
            else if (field.indexOf('addresses') === 0) {
                var addresses = [];
                if (bbContact.homeAddress) {
                    addresses.push(createContactAddress("home",
                            bbContact.homeAddress));
                }
                if (bbContact.workAddress) {
                    addresses.push(createContactAddress("work",
                            bbContact.workAddress));
                }
                contact.addresses = addresses.length > 0 ? addresses : null;
            }
            // birthday
            else if (field.indexOf('birthday') === 0) {
                if (bbContact.birthday) {
                    contact.birthday = bbContact.birthday;
                }
            }
            // note
            else if (field.indexOf('note') === 0) {
                if (bbContact.note) {
                    contact.note = bbContact.note;
                }
            }
            // organizations
            else if (field.indexOf('organizations') === 0) {
                var organizations = [];
                if (bbContact.company || bbContact.jobTitle) {
                    organizations.push(new ContactOrganization(null, null,
                            bbContact.company, null, bbContact.jobTitle));
                }
                contact.organizations = organizations.length > 0 ? organizations
                        : null;
            }
            // categories
            else if (field.indexOf('categories') === 0) {
                if (bbContact.categories && bbContact.categories.length > 0) {
                    contact.categories = bbContact.categories;
                } else {
                    contact.categories = null;
                }
            }
            // urls
            else if (field.indexOf('urls') === 0) {
                var urls = [];
                if (bbContact.webpage) {
                    urls.push(new ContactField(null, bbContact.webpage));
                }
                contact.urls = urls.length > 0 ? urls : null;
            }
            // photos
            else if (field.indexOf('photos') === 0) {
                var photos = [];
                // The BlackBerry Contact object will have a picture attribute
                // with Base64 encoded image
                if (bbContact.picture) {
                    photos.push(new ContactField('base64', bbContact.picture));
                }
                contact.photos = photos.length > 0 ? photos : null;
            }
        }

        return contact;
    }
};

});

// file: lib/webworks/java/plugin/java/DirectoryEntry.js
cordovaDefine("cordova/plugin/java/DirectoryEntry", function(cordovaRequire, exports, module) {

var DirectoryEntry = cordovaRequire('cordova/plugin/DirectoryEntry'),
    FileEntry = cordovaRequire('cordova/plugin/FileEntry'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    exec = cordovaRequire('cordova/exec');

module.exports = {
    /**
     * Creates or looks up a directory; override for BlackBerry.
     *
     * @param path
     *            {DOMString} either a relative or absolute path from this
     *            directory in which to look up or create a directory
     * @param options
     *            {Flags} options to create or exclusively create the directory
     * @param successCallback
     *            {Function} called with the new DirectoryEntry
     * @param errorCallback
     *            {Function} called with a FileError
     */
    getDirectory : function(path, options, successCallback, errorCallback) {
        // create directory if it doesn't exist
        var create = (options && options.create === true) ? true : false,
        // if true, causes failure if create is true and path already exists
        exclusive = (options && options.exclusive === true) ? true : false,
        // directory exists
        exists,
        // create a new DirectoryEntry object and invoke success callback
        createEntry = function() {
            var path_parts = path.split('/'),
                name = path_parts[path_parts.length - 1],
                dirEntry = new DirectoryEntry(name, path);

            // invoke success callback
            if (typeof successCallback === 'function') {
                successCallback(dirEntry);
            }
        };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        } else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if directory exists
        try {
            // will return true if path exists AND is a directory
            exists = blackberry.io.dir.exists(path);
        } catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a directory
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            } else {
                // create entry for existing directory
                createEntry();
            }
        }
        // will return true if path exists AND is a file
        else if (blackberry.io.file.exists(path)) {
            // the path is a file
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            try {
                // directory path must have trailing slash
                var dirPath = path;
                if (dirPath.substr(-1) !== '/') {
                    dirPath += '/';
                }
                blackberry.io.dir.createNewDir(dirPath);
                createEntry();
            } catch (eone) {
                // unable to create directory
                fail(FileError.NOT_FOUND_ERR);
            }
        }
        // path does not exist, don't create
        else {
            // directory doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    /**
     * Create or look up a file.
     *
     * @param path {DOMString}
     *            either a relative or absolute path from this directory in
     *            which to look up or create a file
     * @param options {Flags}
     *            options to create or exclusively create the file
     * @param successCallback {Function}
     *            called with the new FileEntry object
     * @param errorCallback {Function}
     *            called with a FileError object if error occurs
     */
    getFile:function(path, options, successCallback, errorCallback) {
        // create file if it doesn't exist
        var create = (options && options.create === true) ? true : false,
            // if true, causes failure if create is true and path already exists
            exclusive = (options && options.exclusive === true) ? true : false,
            // file exists
            exists,
            // create a new FileEntry object and invoke success callback
            createEntry = function() {
                var path_parts = path.split('/'),
                    name = path_parts[path_parts.length - 1],
                    fileEntry = new FileEntry(name, path);

                // invoke success callback
                if (typeof successCallback === 'function') {
                    successCallback(fileEntry);
                }
            };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if file exists
        try {
            // will return true if path exists AND is a file
            exists = blackberry.io.file.exists(path);
        }
        catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a file
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            }
            else {
                // create entry for existing file
                createEntry();
            }
        }
        // will return true if path exists AND is a directory
        else if (blackberry.io.dir.exists(path)) {
            // the path is a directory
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            // create empty file
            exec(
                function(result) {
                    // file created
                    createEntry();
                },
                fail, "File", "write", [ path, "", 0 ]);
        }
        // path does not exist, don't create
        else {
            // file doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Delete a directory and all of it's contents.
     *
     * @param successCallback {Function} called with no parameters
     * @param errorCallback {Function} called with a FileError
     */
    removeRecursively : function(successCallback, errorCallback) {
        // we're removing THIS directory
        var path = this.fullPath;

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // attempt to delete directory
        if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }
            else {
                try {
                    // delete the directory, setting recursive flag to true
                    blackberry.io.dir.deleteDirectory(path, true);
                    if (typeof successCallback === "function") {
                        successCallback();
                    }
                } catch (e) {
                    // permissions don't allow deletion
                    console.log(e);
                    fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
            }
        }
        // it's a file, not a directory
        else if (blackberry.io.file.exists(path)) {
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};

});

// file: lib/webworks/java/plugin/java/Entry.js
cordovaDefine("cordova/plugin/java/Entry", function(cordovaRequire, exports, module) {

var FileError = cordovaRequire('cordova/plugin/FileError'),
    LocalFileSystem = cordovaRequire('cordova/plugin/LocalFileSystem'),
    resolveLocalFileSystemURI = cordovaRequire('cordova/plugin/resolveLocalFileSystemURI'),
    requestFileSystem = cordovaRequire('cordova/plugin/requestFileSystem'),
    exec = cordovaRequire('cordova/exec');

module.exports = {
    remove : function(successCallback, errorCallback) {
        var path = this.fullPath,
            // directory contents
            contents = [];

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // file
        if (blackberry.io.file.exists(path)) {
            try {
                blackberry.io.file.deleteFile(path);
                if (typeof successCallback === "function") {
                    successCallback();
                }
            } catch (e) {
                // permissions don't allow
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }
        // directory
        else if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                // check to see if directory is empty
                contents = blackberry.io.dir.listFiles(path);
                if (contents.length !== 0) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                } else {
                    try {
                        // delete
                        blackberry.io.dir.deleteDirectory(path, false);
                        if (typeof successCallback === "function") {
                            successCallback();
                        }
                    } catch (eone) {
                        // permissions don't allow
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    getParent : function(successCallback, errorCallback) {
        var that = this;

        try {
            // On BlackBerry, the TEMPORARY file system is actually a temporary
            // directory that is created on a per-application basis. This is
            // to help ensure that applications do not share the same temporary
            // space. So we check to see if this is the TEMPORARY file system
            // (directory). If it is, we must return this Entry, rather than
            // the Entry for its parent.
            requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    function(fileSystem) {
                        if (fileSystem.root.fullPath === that.fullPath) {
                            if (typeof successCallback === 'function') {
                                successCallback(fileSystem.root);
                            }
                        } else {
                            resolveLocalFileSystemURI(blackberry.io.dir
                                    .getParentDirectory(that.fullPath),
                                    successCallback, errorCallback);
                        }
                    }, errorCallback);
        } catch (e) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(FileError.NOT_FOUND_ERR));
            }
        }
    }
};

});

// file: lib/webworks/java/plugin/java/MediaError.js
cordovaDefine("cordova/plugin/java/MediaError", function(cordovaRequire, exports, module) {


// The MediaError object exists on BB OS 6+ which prevents the Cordova version
// from being cordovaDefined. This object is used to merge in differences between the BB
// MediaError object and the Cordova version.
module.exports = {
        MEDIA_ERR_NONE_ACTIVE : 0,
        MEDIA_ERR_NONE_SUPPORTED : 4
};

});

// file: lib/webworks/java/plugin/java/app.js
cordovaDefine("cordova/plugin/java/app", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');
var manager = cordovaRequire('cordova/plugin/manager');

module.exports = {
  /**
   * Clear the resource cache.
   */
  clearCache:function() {
      if (typeof blackberry.widgetcache === "uncordovaDefined" || blackberry.widgetcache === null) {
          console.log("blackberry.widgetcache permission not found. Cache clear request denied.");
          return;
      }
      blackberry.widgetcache.clearAll();
  },

  /**
   * Clear web history in this web view.
   * Instead of BACK button loading the previous web page, it will exit the app.
   */
  clearHistory:function() {
    exec(null, null, "App", "clearHistory", []);
  },

  /**
   * Go to previous page displayed.
   * This is the same as pressing the backbutton on Android device.
   */
  backHistory:function() {
    // window.history.back() behaves oddly on BlackBerry, so use
    // native implementation.
    exec(null, null, "App", "backHistory", []);
  },

  /**
   * Exit and terminate the application.
   */
  exitApp:function() {
      // Call onunload if it is cordovaDefined since BlackBerry does not invoke
      // on application exit.
      if (typeof window.onunload === "function") {
          window.onunload();
      }

      // allow Cordova JavaScript Extension opportunity to cleanup
      manager.destroy();

      // exit the app
      blackberry.app.exit();
  }
};

});

// file: lib/webworks/java/plugin/java/contacts.js
cordovaDefine("cordova/plugin/java/contacts", function(cordovaRequire, exports, module) {

var ContactError = cordovaRequire('cordova/plugin/ContactError'),
    utils = cordovaRequire('cordova/utils'),
    ContactUtils = cordovaRequire('cordova/plugin/java/ContactUtils');

module.exports = {
    /**
     * Returns an array of Contacts matching the search criteria.
     *
     * @return array of Contacts matching search criteria
     */
    find : function(fields, success, fail, options) {
        // Success callback is cordovaRequired. Throw exception if not specified.
        if (typeof success !== 'function') {
            throw new TypeError(
                    "You must specify a success callback for the find command.");
        }

        // Search qualifier is cordovaRequired and cannot be empty.
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            if (typeof fail == 'function') {
                fail(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
            return;
        }

        // default is to return a single contact match
        var numContacts = 1;

        // search options
        var filter = null;
        if (options) {
            // return multiple objects?
            if (options.multiple === true) {
                // -1 on BlackBerry will return all contact matches.
                numContacts = -1;
            }
            filter = options.filter;
        }

        // build the filter expression to use in find operation
        var filterExpression = ContactUtils.buildFilterExpression(fields, filter);

        // find matching contacts
        // Note: the filter expression can be null here, in which case, the find
        // won't filter
        var bbContacts = blackberry.pim.Contact.find(filterExpression, null, numContacts);

        // convert to Contact from blackberry.pim.Contact
        var contacts = [];
        for (var i = 0; i < bbContacts.length; i++) {
            if (bbContacts[i]) {
                // W3C Contacts API specification states that only the fields
                // in the search filter should be returned, so we create
                // a new Contact object, copying only the fields specified
                contacts.push(ContactUtils.createContact(bbContacts[i], fields));
            }
        }

        // return results
        success(contacts);
    }

};

});

// file: lib/webworks/java/plugin/java/notification.js
cordovaDefine("cordova/plugin/java/notification", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');

/**
 * Provides BlackBerry enhanced notification API.
 */
module.exports = {
    activityStart : function(title, message) {
        // If title and message not specified then mimic Android behavior of
        // using default strings.
        if (typeof title === "uncordovaDefined" && typeof message == "uncordovaDefined") {
            title = "Busy";
            message = 'Please wait...';
        }

        exec(null, null, 'Notification', 'activityStart', [ title, message ]);
    },

    /**
     * Close an activity dialog
     */
    activityStop : function() {
        exec(null, null, 'Notification', 'activityStop', []);
    },

    /**
     * Display a progress dialog with progress bar that goes from 0 to 100.
     *
     * @param {String}
     *            title Title of the progress dialog.
     * @param {String}
     *            message Message to display in the dialog.
     */
    progressStart : function(title, message) {
        exec(null, null, 'Notification', 'progressStart', [ title, message ]);
    },

    /**
     * Close the progress dialog.
     */
    progressStop : function() {
        exec(null, null, 'Notification', 'progressStop', []);
    },

    /**
     * Set the progress dialog value.
     *
     * @param {Number}
     *            value 0-100
     */
    progressValue : function(value) {
        exec(null, null, 'Notification', 'progressValue', [ value ]);
    }
};

});

// file: lib/common/plugin/logger.js
cordovaDefine("cordova/plugin/logger", function(cordovaRequire, exports, module) {

//------------------------------------------------------------------------------
// The logger module exports the following properties/functions:
//
// LOG                          - constant for the level LOG
// ERROR                        - constant for the level ERROR
// WARN                         - constant for the level WARN
// INFO                         - constant for the level INFO
// DEBUG                        - constant for the level DEBUG
// logLevel()                   - returns current log level
// logLevel(value)              - sets and returns a new log level
// useConsole()                 - returns whether logger is using console
// useConsole(value)            - sets and returns whether logger is using console
// log(message,...)             - logs a message at level LOG
// error(message,...)           - logs a message at level ERROR
// warn(message,...)            - logs a message at level WARN
// info(message,...)            - logs a message at level INFO
// debug(message,...)           - logs a message at level DEBUG
// logLevel(level,message,...)  - logs a message specified level
//
//------------------------------------------------------------------------------

var logger = exports;

var exec    = cordovaRequire('cordova/exec');
var utils   = cordovaRequire('cordova/utils');

var UseConsole   = true;
var Queued       = [];
var DeviceReady  = false;
var CurrentLevel;

/**
 * Logging levels
 */

var Levels = [
    "LOG",
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG"
];

/*
 * add the logging levels to the logger object and
 * to a separate levelsMap object for testing
 */

var LevelsMap = {};
for (var i=0; i<Levels.length; i++) {
    var level = Levels[i];
    LevelsMap[level] = i;
    logger[level]    = level;
}

CurrentLevel = LevelsMap.WARN;

/**
 * Getter/Setter for the logging level
 *
 * Returns the current logging level.
 *
 * When a value is passed, sets the logging level to that value.
 * The values should be one of the following constants:
 *    logger.LOG
 *    logger.ERROR
 *    logger.WARN
 *    logger.INFO
 *    logger.DEBUG
 *
 * The value used determines which messages get printed.  The logging
 * values above are in order, and only messages logged at the logging
 * level or above will actually be displayed to the user.  E.g., the
 * default level is WARN, so only messages logged with LOG, ERROR, or
 * WARN will be displayed; INFO and DEBUG messages will be ignored.
 */
logger.level = function (value) {
    if (arguments.length) {
        if (LevelsMap[value] === null) {
            throw new Error("invalid logging level: " + value);
        }
        CurrentLevel = LevelsMap[value];
    }

    return Levels[CurrentLevel];
};

/**
 * Getter/Setter for the useConsole functionality
 *
 * When useConsole is true, the logger will log via the
 * browser 'console' object.  Otherwise, it will use the
 * native Logger plugin.
 */
logger.useConsole = function (value) {
    if (arguments.length) UseConsole = !!value;

    if (UseConsole) {
        if (typeof console == "uncordovaDefined") {
            throw new Error("global console object is not cordovaDefined");
        }

        if (typeof console.log != "function") {
            throw new Error("global console object does not have a log function");
        }

        if (typeof console.useLogger == "function") {
            if (console.useLogger()) {
                throw new Error("console and logger are too intertwingly");
            }
        }
    }

    return UseConsole;
};

/**
 * Logs a message at the LOG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.log   = function(message) { logWithArgs("LOG",   arguments); };

/**
 * Logs a message at the ERROR level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.error = function(message) { logWithArgs("ERROR", arguments); };

/**
 * Logs a message at the WARN level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.warn  = function(message) { logWithArgs("WARN",  arguments); };

/**
 * Logs a message at the INFO level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.info  = function(message) { logWithArgs("INFO",  arguments); };

/**
 * Logs a message at the DEBUG level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.debug = function(message) { logWithArgs("DEBUG", arguments); };

// log at the specified level with args
function logWithArgs(level, args) {
    args = [level].concat([].slice.call(args));
    logger.logLevel.apply(logger, args);
}

/**
 * Logs a message at the specified level.
 *
 * Parameters passed after message are used applied to
 * the message with utils.format()
 */
logger.logLevel = function(level, message /* , ... */) {
    // format the message with the parameters
    var formatArgs = [].slice.call(arguments, 2);
    message    = utils.vformat(message, formatArgs);

    if (LevelsMap[level] === null) {
        throw new Error("invalid logging level: " + level);
    }

    if (LevelsMap[level] > CurrentLevel) return;

    // queue the message if not yet at deviceready
    if (!DeviceReady && !UseConsole) {
        Queued.push([level, message]);
        return;
    }

    // if not using the console, use the native logger
    if (!UseConsole) {
        exec(null, null, "Logger", "logLevel", [level, message]);
        return;
    }

    // make sure console is not using logger
    if (console.__usingCordovaLogger) {
        throw new Error("console and logger are too intertwingly");
    }

    // log to the console
    switch (level) {
        case logger.LOG:   console.log(message); break;
        case logger.ERROR: console.log("ERROR: " + message); break;
        case logger.WARN:  console.log("WARN: "  + message); break;
        case logger.INFO:  console.log("INFO: "  + message); break;
        case logger.DEBUG: console.log("DEBUG: " + message); break;
    }
};

// when deviceready fires, log queued messages
logger.__onDeviceReady = function() {
    if (DeviceReady) return;

    DeviceReady = true;

    for (var i=0; i<Queued.length; i++) {
        var messageArgs = Queued[i];
        logger.logLevel(messageArgs[0], messageArgs[1]);
    }

    Queued = null;
};

// add a deviceready event to log queued messages
document.addEventListener("deviceready", logger.__onDeviceReady, false);

});

// file: lib/webworks/java/plugin/manager.js
cordovaDefine("cordova/plugin/manager", function(cordovaRequire, exports, module) {

var cordova = cordovaRequire('cordova');

function _exec(win, fail, clazz, action, args) {
    var callbackId = clazz + cordova.callbackId++,
        origResult,
        evalResult,
        execResult;

    try {
        if (win || fail) {
            cordova.callbacks[callbackId] = {success: win, fail: fail};
        }

        // Note: Device returns string, but for some reason emulator returns object - so convert to string.
        origResult = "" + org.apache.cordova.JavaPluginManager.exec(clazz, action, callbackId, JSON.stringify(args), true);

        // If a result was returned
        if (origResult.length > 0) {
            evalResult = JSON.parse(origResult);

            // If status is OK, then return evalResult value back to caller
            if (evalResult.status === cordova.callbackStatus.OK) {

                // If there is a success callback, then call it now with returned evalResult value
                if (win) {
                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            } else if (evalResult.status === cordova.callbackStatus.NO_RESULT) {

                // Clear callback if not expecting any more results
                if (!evalResult.keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            } else {
                // If there is a fail callback, then call it now with returned evalResult value
                if (fail) {

                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            }
            execResult = evalResult;
        } else {
            // Asynchronous calls return an empty string. Return a NO_RESULT
            // status for those executions.
            execResult = {"status" : cordova.callbackStatus.NO_RESULT,
                    "message" : ""};
        }
    } catch (e) {
        console.log("BlackBerryPluginManager Error: " + e);
        execResult = {"status" : cordova.callbackStatus.ERROR,
                      "message" : e.message};
    }

    return execResult;
}

module.exports = {
    exec: function (win, fail, clazz, action, args) {
        return _exec(win, fail, clazz, action, args);
    },
    resume: org.apache.cordova.JavaPluginManager.resume,
    pause: org.apache.cordova.JavaPluginManager.pause,
    destroy: org.apache.cordova.JavaPluginManager.destroy
};

});

// file: lib/common/plugin/network.js
cordovaDefine("cordova/plugin/network", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec'),
    cordova = cordovaRequire('cordova'),
    channel = cordovaRequire('cordova/channel'),
    utils = cordovaRequire('cordova/utils');

// Link the onLine property with the Cordova-supplied network info.
// This works because we clobber the naviagtor object with our own
// object in bootstrap.js.
if (typeof navigator != 'uncordovaDefined') {
    utils.cordovaDefineGetter(navigator, 'onLine', function() {
        return this.connection.type != 'none';
    });
}

var NetworkConnection = function () {
    this.type = null;
    this._firstRun = true;
    this._timer = null;
    this.timeout = 500;

    var me = this;

    channel.onCordovaReady.subscribe(function() {
        me.getInfo(function (info) {
            me.type = info;
            if (info === "none") {
                // set a timer if still offline at the end of timer send the offline event
                me._timer = setTimeout(function(){
                    cordova.fireDocumentEvent("offline");
                    me._timer = null;
                    }, me.timeout);
            } else {
                // If there is a current offline event pending clear it
                if (me._timer !== null) {
                    clearTimeout(me._timer);
                    me._timer = null;
                }
                cordova.fireDocumentEvent("online");
            }

            // should only fire this once
            if (me._firstRun) {
                me._firstRun = false;
                channel.onCordovaConnectionReady.fire();
            }
        },
        function (e) {
            // If we can't get the network info we should still tell Cordova
            // to fire the deviceready event.
            if (me._firstRun) {
                me._firstRun = false;
                channel.onCordovaConnectionReady.fire();
            }
            console.log("Error initializing Network Connection: " + e);
        });
    });
};

/**
 * Get connection info
 *
 * @param {Function} successCallback The function to call when the Connection data is available
 * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
 */
NetworkConnection.prototype.getInfo = function (successCallback, errorCallback) {
    // Get info
    exec(successCallback, errorCallback, "NetworkStatus", "getConnectionInfo", []);
};

module.exports = new NetworkConnection();

});

// file: lib/common/plugin/notification.js
cordovaDefine("cordova/plugin/notification", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');

/**
 * Provides access to notifications on the device.
 */

module.exports = {

    /**
     * Open a native alert dialog, with a customizable title and button text.
     *
     * @param {String} message              Message to print in the body of the alert
     * @param {Function} completeCallback   The callback that is called when user clicks on a button.
     * @param {String} title                Title of the alert dialog (default: Alert)
     * @param {String} buttonLabel          Label of the close button (default: OK)
     */
    alert: function(message, completeCallback, title, buttonLabel) {
        var _title = (title || "Alert");
        var _buttonLabel = (buttonLabel || "OK");
        exec(completeCallback, null, "Notification", "alert", [message, _title, _buttonLabel]);
    },

    /**
     * Open a native confirm dialog, with a customizable title and button text.
     * The result that the user selects is returned to the result callback.
     *
     * @param {String} message              Message to print in the body of the alert
     * @param {Function} resultCallback     The callback that is called when user clicks on a button.
     * @param {String} title                Title of the alert dialog (default: Confirm)
     * @param {String} buttonLabels         Comma separated list of the labels of the buttons (default: 'OK,Cancel')
     */
    confirm: function(message, resultCallback, title, buttonLabels) {
        var _title = (title || "Confirm");
        var _buttonLabels = (buttonLabels || "OK,Cancel");
        exec(resultCallback, null, "Notification", "confirm", [message, _title, _buttonLabels]);
    },

    /**
     * Causes the device to vibrate.
     *
     * @param {Integer} mills       The number of milliseconds to vibrate for.
     */
    vibrate: function(mills) {
        exec(null, null, "Notification", "vibrate", [mills]);
    },

    /**
     * Causes the device to beep.
     * On Android, the default notification ringtone is played "count" times.
     *
     * @param {Integer} count       The number of beeps.
     */
    beep: function(count) {
        exec(null, null, "Notification", "beep", [count]);
    }
};

});

// file: lib/common/plugin/requestFileSystem.js
cordovaDefine("cordova/plugin/requestFileSystem", function(cordovaRequire, exports, module) {

var FileError = cordovaRequire('cordova/plugin/FileError'),
    FileSystem = cordovaRequire('cordova/plugin/FileSystem'),
    exec = cordovaRequire('cordova/exec');

/**
 * Request a file system in which to store application data.
 * @param type  local file system type
 * @param size  indicates how much storage space, in bytes, the application expects to need
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 */
var requestFileSystem = function(type, size, successCallback, errorCallback) {
    var fail = function(code) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(code));
        }
    };

    if (type < 0 || type > 3) {
        fail(FileError.SYNTAX_ERR);
    } else {
        // if successful, return a FileSystem object
        var success = function(file_system) {
            if (file_system) {
                if (typeof successCallback === 'function') {
                    // grab the name and root from the file system object
                    var result = new FileSystem(file_system.name, file_system.root);
                    successCallback(result);
                }
            }
            else {
                // no FileSystem object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };
        exec(success, fail, "File", "requestFileSystem", [type, size]);
    }
};

module.exports = requestFileSystem;

});

// file: lib/common/plugin/resolveLocalFileSystemURI.js
cordovaDefine("cordova/plugin/resolveLocalFileSystemURI", function(cordovaRequire, exports, module) {

var DirectoryEntry = cordovaRequire('cordova/plugin/DirectoryEntry'),
    FileEntry = cordovaRequire('cordova/plugin/FileEntry'),
    FileError = cordovaRequire('cordova/plugin/FileError'),
    exec = cordovaRequire('cordova/exec');

/**
 * Look up file system Entry referred to by local URI.
 * @param {DOMString} uri  URI referring to a local file or directory
 * @param successCallback  invoked with Entry object corresponding to URI
 * @param errorCallback    invoked if error occurs retrieving file system entry
 */
module.exports = function(uri, successCallback, errorCallback) {
    // error callback
    var fail = function(error) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(error));
        }
    };
    // sanity check for 'not:valid:filename'
    if(!uri || uri.split(":").length > 2) {
        setTimeout( function() {
            fail(FileError.ENCODING_ERR);
        },0);
        return;
    }
    // if successful, return either a file or directory entry
    var success = function(entry) {
        var result;
        if (entry) {
            if (typeof successCallback === 'function') {
                // create appropriate Entry object
                result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                try {
                    successCallback(result);
                }
                catch (e) {
                    console.log('Error invoking callback: ' + e);
                }
            }
        }
        else {
            // no Entry object returned
            fail(FileError.NOT_FOUND_ERR);
        }
    };

    exec(success, fail, "File", "resolveLocalFileSystemURI", [uri]);
};

});

// file: lib/common/plugin/splashscreen.js
cordovaDefine("cordova/plugin/splashscreen", function(cordovaRequire, exports, module) {

var exec = cordovaRequire('cordova/exec');

var splashscreen = {
    show:function() {
        exec(null, null, "SplashScreen", "show", []);
    },
    hide:function() {
        exec(null, null, "SplashScreen", "hide", []);
    }
};

module.exports = splashscreen;

});

// file: lib/webworks/common/plugin/webworks/accelerometer.js
cordovaDefine("cordova/plugin/webworks/accelerometer", function(cordovaRequire, exports, module) {

var cordova = cordovaRequire('cordova'),
    callback;

module.exports = {
    start: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        callback = function (motion) {
            win({
                x: motion.accelerationIncludingGravity.x,
                y: motion.accelerationIncludingGravity.y,
                z: motion.accelerationIncludingGravity.z,
                timestamp: motion.timestamp
            });
        };
        window.addEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/webworks/common/plugin/webworks/logger.js
cordovaDefine("cordova/plugin/webworks/logger", function(cordovaRequire, exports, module) {

var cordova = cordovaRequire('cordova');

module.exports = {
    log: function (args, win, fail) {
        console.log(args);
        return {"status" : cordova.callbackStatus.OK,
                "message" : 'Message logged to console: ' + args};
    }
};

});

// file: lib/webworks/common/plugin/webworks/media.js
cordovaDefine("cordova/plugin/webworks/media", function(cordovaRequire, exports, module) {

var cordova = cordovaRequire('cordova'),
    audioObjects = {};

module.exports = {
    create: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            src = args[1];

        audioObjects[id] = new Audio(src);
        return {"status" : 1, "message" : "Audio object created" };
    },
    startPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (args.length === 1) {
            return {"status" : 9, "message" : "Media source argument not found"};
        }

        if (audio) {
            audio.pause();
            audioObjects[id] = uncordovaDefined;
        }

        audio = audioObjects[id] = new Audio(args[1]);
        audio.play();

        return {"status" : 1, "message" : "Audio play started" };
    },
    stopPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();
        audioObjects[id] = uncordovaDefined;

        return {"status" : 1, "message" : "Audio play stopped" };
    },
    seekToAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            result = {"status" : 2, "message" : "Audio Object has not been initialized"};
        } else if (args.length === 1) {
            result = {"status" : 9, "message" : "Media seek time argument not found"};
        } else {
            try {
                audio.currentTime = args[1];
            } catch (e) {
                console.log('Error seeking audio: ' + e);
                return {"status" : 3, "message" : "Error seeking audio: " + e};
            }

            result = {"status" : 1, "message" : "Seek to audio succeeded" };
        }

        return result;
    },
    pausePlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();

        return {"status" : 1, "message" : "Audio paused" };
    },
    getCurrentPositionAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.currentTime };
    },
    getDuration: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.duration };
    },
    startRecordingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (args.length <= 1) {
            result = {"status" : 9, "message" : "Media start recording, insufficient arguments"};
        }

        blackberry.media.microphone.record(args[1], win, fail);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stopRecordingAudio: function (args, win, fail) {
    },
    release: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (audio) {
            audioObjects[id] = uncordovaDefined;
            audio.src = uncordovaDefined;
            //delete audio;
        }

        result = {"status" : 1, "message" : "Media resources released"};

        return result;
    }
};

});

// file: lib/webworks/common/plugin/webworks/notification.js
cordovaDefine("cordova/plugin/webworks/notification", function(cordovaRequire, exports, module) {

var cordova = cordovaRequire('cordova');

module.exports = {
    alert: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - alert arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2];

        blackberry.ui.dialog.customAskAsync.apply(this, [ msg, [ btnLabel ], win, { "title" : title } ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    confirm: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - confirm arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2],
            btnLabels = btnLabel.split(",");

        blackberry.ui.dialog.customAskAsync.apply(this, [msg, btnLabels, win, {"title" : title} ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/common/utils.js
cordovaDefine("cordova/utils", function(cordovaRequire, exports, module) {

var utils = exports;

/**
 * Defines a property getter for obj[key].
 */
utils.cordovaDefineGetter = function(obj, key, func) {
    if (Object.cordovaDefineProperty) {
        Object.cordovaDefineProperty(obj, key, { get: func });
    } else {
        obj.__cordovaDefineGetter__(key, func);
    }
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = function(a) {
    return Object.prototype.toString.call(a) == '[object Array]';
};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return Object.prototype.toString.call(d) == '[object Date]';
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    if (typeof params == 'uncordovaDefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
};

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};

/**
 * Formats a string and arguments following it ala sprintf()
 *
 * see utils.vformat() for more information
 */
utils.format = function(formatString /* ,... */) {
    var args = [].slice.call(arguments, 1);
    return utils.vformat(formatString, args);
};

/**
 * Formats a string and arguments following it ala vsprintf()
 *
 * format chars:
 *   %j - format arg as JSON
 *   %o - format arg as JSON
 *   %c - format arg as ''
 *   %% - replace with '%'
 * any other char following % will format it's
 * arg via toString().
 *
 * for rationale, see FireBug's Console API:
 *    http://getfirebug.com/wiki/index.php/Console_API
 */
utils.vformat = function(formatString, args) {
    if (formatString === null || formatString === uncordovaDefined) return "";
    if (arguments.length == 1) return formatString.toString();
    if (typeof formatString != "string") return formatString.toString();

    var pattern = /(.*?)%(.)(.*)/;
    var rest    = formatString;
    var result  = [];

    while (args.length) {
        var arg   = args.shift();
        var match = pattern.exec(rest);

        if (!match) break;

        rest = match[3];

        result.push(match[1]);

        if (match[2] == '%') {
            result.push('%');
            args.unshift(arg);
            continue;
        }

        result.push(formatted(arg, match[2]));
    }

    result.push(rest);

    return result.join('');
};

//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}

//------------------------------------------------------------------------------
function formatted(object, formatChar) {

    try {
        switch(formatChar) {
            case 'j':
            case 'o': return JSON.stringify(object);
            case 'c': return '';
        }
    }
    catch (e) {
        return "error JSON.stringify()ing argument: " + e;
    }

    if ((object === null) || (object === uncordovaDefined)) {
        return Object.prototype.toString.call(object);
    }

    return object.toString();
}

});


window.cordova = cordovaRequire('cordova');

// file: lib/scripts/bootstrap.js

(function (context) {
    // Replace navigator before any modules are cordovaRequired(), to ensure it happens as soon as possible.
    // We replace it so that properties that can't be clobbered can instead be overridden.
    if (typeof navigator != 'uncordovaDefined') {
        var CordovaNavigator = function () {};
        CordovaNavigator.prototype = navigator;
        navigator = new CordovaNavigator();
    }

    var channel = cordovaRequire("cordova/channel"),
        _self = {
            boot: function () {
                /**
                 * Create all cordova objects once page has fully loaded and native side is ready.
                 */
                channel.join(function() {
                    var builder = cordovaRequire('cordova/builder'),
                        base = cordovaRequire('cordova/common'),
                        platform = cordovaRequire('cordova/platform');

                    // Drop the common globals into the window object, but be nice and don't overwrite anything.
                    builder.build(base.objects).intoButDoNotClobber(window);

                    // Drop the platform-specific globals into the window object
                    // and clobber any existing object.
                    builder.build(platform.objects).intoAndClobber(window);

                    // Merge the platform-specific overrides/enhancements into
                    // the window object.
                    if (typeof platform.merges !== 'uncordovaDefined') {
                        builder.build(platform.merges).intoAndMerge(window);
                    }

                    // Call the platform-specific initialization
                    platform.initialize();

                    // Fire event to notify that all objects are created
                    channel.onCordovaReady.fire();

                    // Fire onDeviceReady event once all constructors have run and
                    // cordova info has been received from native side.
                    channel.join(function() {
                        cordovaRequire('cordova').fireDocumentEvent('deviceready');
                    }, channel.deviceReadyChannelsArray);

                }, [ channel.onDOMContentLoaded, channel.onNativeReady ]);
            }
        };

    // boot up once native side is ready
    channel.onNativeReady.subscribe(_self.boot);

    // _nativeReady is global variable that the native side can set
    // to signify that the native code is ready. It is a global since
    // it may be called before any cordova JS is ready.
    if (window._nativeReady) {
        channel.onNativeReady.fire();
    }

}(window));


})();var PhoneGap = cordova;
