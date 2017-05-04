/**
 *  @license
 *    Copyright 2017 Brigham Young University
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
const expect            = require('chai').expect;
const OneOf             = require('../bin/one-of');
const Schema            = require('../index');
const util              = require('../bin/util');

describe('one of schemas', () => {

    it('must have oneOf property', () => {
        expect(() => Schema({ type: 'one-of' })).to.throw(/Missing required one-of property/);
    });

    it('oneOf property must be an array of objects', () => {
        expect(() => Schema({ type: 'one-of', oneOf: ['foo'] })).to.throw(/Must be an array of schema configurations/);
    });

    describe('string or number', () => {
        let schema;

        before(() => schema = Schema({
            type: 'one-of',
            oneOf: [
                {
                    type: String
                },
                {
                    type: Number
                }
            ]
        }));

        it('can be a string', () => {
            const err = schema.error('foo');
            expect(err).to.be.null;
        });

        it('can be a number', () => {
            const err = schema.error('foo');
            expect(err).to.be.null;
        });

        it('cannot be a boolean', () => {
            const err = schema.error(true);
            expect(err.code).to.equal(OneOf.errors.oneOf.code);
        });

        it('cannot be an object', () => {
            const err = util.extractError(() => schema.validate({}) );
            expect(err.code).to.equal(OneOf.errors.oneOf.code);
        });

        it('normalize error', () => {
            const err = util.extractError(() => schema.normalize({}) );
            expect(err.code).to.equal(OneOf.errors.oneOf.code);
        });

    });

});