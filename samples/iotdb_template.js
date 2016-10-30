/*
 *  How to use this module in IOTDB / HomeStar
 *  This is the best way to do this
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;

iotdb.use("homestar-onvif");

const things = iotdb.connect('ONVIFSomething');
things.on("istate", thing => {
    console.log("+", "istate", thing.thing_id(), "\n ", thing.state("istate"));
});
things.on("meta", thing => {
    console.log("+", "meta", thing.thing_id(), "\n ", thing.state("meta"));
});
things.on("thing", thing => {
    console.log("+", "discovered", thing.thing_id(), "\n ", thing.state("meta"));
});


