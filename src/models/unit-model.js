/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * unit-model.js
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'
const assert = require('assert');

const { unitObjectDef } = require('../objects/unit-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class UnitModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getUnitIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(unitObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM units ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findUnitCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(unitObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM units ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findUnitList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(unitObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let resultsPerPage = params.resultsPerPage; 
		if (resultsPerPage === undefined || isNaN(resultsPerPage)) 
			resultsPerPage = 25; // TODO hard coded value
		else
			resultsPerPage = parseInt(resultsPerPage);
		if (resultsPerPage < 1) resultsPerPage = 1;
		fieldValues.push(resultsPerPage);

		let offset = params.offset; 
		if (offset=== undefined || isNaN(resultsPerPage)) 
			offset = 0
		else
			offset = parseInt(offset);
		if (offset < 0) offset = 0;
		fieldValues.push(offset);

		let sql = `SELECT * FROM units ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const unitList = [];
		for (let unitRecord of result) 
			unitList.push( objectUtils.convertObjectFromDb(unitObjectDef, unitRecord, /*filter=*/true) )
		return unitList;
	}

	static async getUnitById(unitId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (unitId === undefined)
			throw new Error('Argument <unitId> required');
		if (isNaN(unitId) === undefined)
			throw new Error('Argument <unitId> is not a number');
		let sql = `SELECT * FROM units WHERE id = ?`;
		const result = await db.query(sql, [unitId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const unit = objectUtils.convertObjectFromDb(unitObjectDef, result[0], /*filter=*/false)
		return unit;
	}
	


	static async getChildrenCountList(unitId) {
		if (unitId === undefined)
			throw new Error('Argument <unitId> required');
		if (isNaN(unitId) === undefined)
			throw new Error('Argument <unitId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createUnit(unit, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(unitObjectDef, unit, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const unitDb = objectUtils.convertObjectToDb(unitObjectDef, unit)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(unitDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO units(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const unitId = result.insertId;
		unit = this.getUnitById(unitId)
		return unit;
	}

	static async editUnit(unit, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(unitObjectDef, unit, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const unitDb = objectUtils.convertObjectToDb(unitObjectDef, unit)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(unitDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE units
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(unit.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const unitId = unit.id
		unit = this.getUnitById(unitId)
		return unit;
	}

	
	static async deleteById(unitId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (unitId === undefined)
			throw new Error('Argument <unitId> required');
		if (isNaN(unitId) === undefined)
			throw new Error('Argument <unitId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(unitId))
				throw new Error(`Can not delete Unit ID <${ unitId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM units WHERE id = ?`;
		const result = await db.query(sql, [unitId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(unitId) {
		return false
	}
}

module.exports = () => {
	UnitModel.initialize();
	return UnitModel;
}

