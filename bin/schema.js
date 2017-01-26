/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';
const util              = require('./util');

module.exports = Schema;

/**
 * Get a typed schema.
 * @param {object} [configuration={}]
 * @returns {{ error: Function, normalize: Function, validate: Function }}
 */
function Schema (configuration) {
    if (arguments.length === 0 || configuration === null) configuration = {};

    // single configuration leads to single schema
    if (!Array.isArray(configuration)) return createSchema(configuration);

    // multiple configuration tries all schemas
    const schemas = configuration.map(createSchema);

    return {
        error: function(value, prefix) {
            const data = getPassingSchema(schemas, value);
            return data.passing ? null : getMultiError(data.errors, prefix);
        },

        normalize: function(value) {
            const data = getPassingSchema(schemas, value, '');
            if (data.passing) return data.schema.normalize(value);
            const meta = getMultiError(data.errors, '');
            const err = Error(meta.message);
            util.throwWithMeta(err, meta);
        },

        validate: function(value, prefix) {
            const o = this.error(value, prefix);
            if (o) {
                const err = Error(o.message);
                util.throwWithMeta(err, o);
            }
        }
    }
}

Schema.controllers = require('./controllers')();

/**
 * Create a schema for the provided configuration.
 * @param {object} configuration
 * @returns {{ error: Function, normalize: Function, validate: Function }}
 */
function createSchema(configuration) {

    // validate input parameter
    if (!util.isPlainObject(configuration)) {
        const err = Error('If provided, the schema configuration must be a plain object. Received: ' + configuration);
        util.throwWithMeta(err, exports.errors.config);
    }

    // get a copy of the configuration
    const config = util.copy(configuration || {});

    // if type is not specified then use the default
    if (!config.type) config.type = 'typed';

    // get the controller item
    const item = Schema.controllers.get(config.type);

    // type is invalid
    if (!item) {
        const err = Error('Unknown type: ' + config.type);
        util.throwWithMeta(err, util.errors.config);
    }

    // return a schema object
    return new item.Schema(config, Schema);
}

function getPassingSchema(schemas, value) {
    const len = schemas.length;
    const errors = [];
    for (let i = 0; i < len; i++) {
        const err = schemas[i].error(value, '');
        if (!err) return {
            passing: true,
            schema: schemas[i]
        };
        errors.push(err);
    }
    return {
        passing: false,
        errors: errors
    };
}

function getMultiError(errors, prefix) {
    const message = 'All possible schemas have errors:\n  ' +
        errors.map(err => err.message).join('\n  ');
    const err = util.errish((prefix || '') + message, util.errors.multi);
    err.errors = errors;
    return err;
}