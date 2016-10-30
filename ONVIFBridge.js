/*
 *  ONVIFBridge.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-10-30
 *
 *  Copyright [2013-2016] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;

const onvif = require('onvif');

const logger = iotdb.logger({
    name: 'homestar-onvif',
    module: 'ONVIFBridge',
});

/**
 *  See {iotdb.bridge.Bridge#Bridge} for documentation.
 *  <p>
 *  @param {object|undefined} native
 *  only used for instances, should be 
 */
const ONVIFBridge = function (initd, native) {
    const self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("bridges/ONVIFBridge/initd"), {
            poll: 30
        }
    );
    self.native = native;   // the thing that does the work - keep this name

    if (self.native) {
        self.queue = _.queue("ONVIFBridge");
    }
};

ONVIFBridge.prototype = new iotdb.Bridge();

/* --- lifecycle --- */

/**
 *  See {iotdb.bridge.Bridge#discover} for documentation.
 */
ONVIFBridge.prototype.discover = function () {
    const self = this;

    logger.info({
        method: "discover"
    }, "called");

    /*
     *  This is the core bit of discovery. As you find new
     *  thimgs, make a new ONVIFBridge and call 'discovered'.
     *  The first argument should be self.initd, the second
     *  the thing that you do work with
     */
    const s = self._onvif();
    s.on('something', function (native) {
        self.discovered(new ONVIFBridge(self.initd, native));
    });
};

/**
 *  See {iotdb.bridge.Bridge#connect} for documentation.
 */
ONVIFBridge.prototype.connect = function (connectd) {
    const self = this;
    if (!self.native) {
        return;
    }

    self._validate_connect(connectd);

    self._setup_polling();
    self.pull();
};

ONVIFBridge.prototype._setup_polling = function () {
    const self = this;
    if (!self.initd.poll) {
        return;
    }

    const timer = setInterval(function () {
        if (!self.native) {
            clearInterval(timer);
            return;
        }

        self.pull();
    }, self.initd.poll * 1000);
};

ONVIFBridge.prototype._forget = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    self.native = null;
    self.pulled();
};

/**
 *  See {iotdb.bridge.Bridge#disconnect} for documentation.
 */
ONVIFBridge.prototype.disconnect = function () {
    const self = this;
    if (!self.native || !self.native) {
        return;
    }

    self._forget();
};

/* --- data --- */

/**
 *  See {iotdb.bridge.Bridge#push} for documentation.
 */
ONVIFBridge.prototype.push = function (pushd, done) {
    const self = this;
    if (!self.native) {
        done(new Error("not connected"));
        return;
    }

    self._validate_push(pushd, done);

    logger.info({
        method: "push",
        pushd: pushd
    }, "push");

    const qitem = {
        // if you set "id", new pushes will unqueue old pushes with the same id
        // id: self.number, 
        run: function () {
            self._pushd(pushd);
            self.queue.finished(qitem);
        },
        coda: function() {
            done();
        },
    };
    self.queue.add(qitem);
};

/**
 *  Do the work of pushing. If you don't need queueing
 *  consider just moving this up into push
 */
ONVIFBridge.prototype._push = function (pushd) {
    if (pushd.on !== undefined) {
    }
};

/**
 *  See {iotdb.bridge.Bridge#pull} for documentation.
 */
ONVIFBridge.prototype.pull = function () {
    const self = this;
    if (!self.native) {
        return;
    }
};

/* --- state --- */

/**
 *  See {iotdb.bridge.Bridge#meta} for documentation.
 */
ONVIFBridge.prototype.meta = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    return {
        "iot:thing-id": _.id.thing_urn.unique("ONVIF", self.native.uuid, self.initd.number),
        "schema:name": self.native.name || "ONVIF",

        // "iot:thing-number": self.initd.number,
        // "iot:device-id": _.id.thing_urn.unique("ONVIF", self.native.uuid),
        // "schema:manufacturer": "",
        // "schema:model": "",
    };
};

/**
 *  See {iotdb.bridge.Bridge#reachable} for documentation.
 */
ONVIFBridge.prototype.reachable = function () {
    return this.native !== null;
};

/**
 *  See {iotdb.bridge.Bridge#configure} for documentation.
 */
ONVIFBridge.prototype.configure = function (app) {};

/* -- internals -- */
let __singleton;

/**
 *  If you need a singleton to access the library
 */
ONVIFBridge.prototype._onvif = function () {
    const self = this;

    if (!__singleton) {
        __singleton = onvif.init();
    }

    return __singleton;
};

/*
 *  API
 */
exports.Bridge = ONVIFBridge;
