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

const unitObjectHelper = require('../objects/unit-object-helper.cjs')

class UnitModel {

	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
	}

	static async getIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM units ${whereClause}`
		const result = await db.query(sql, sqlValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}


	static async getList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const sqlValues = [];
		const sqlFilters = [];
		if (filters.companyId !== undefined) {
			sqlFilters.push('id_company = ?')
			sqlValues.push(filters.companyId);
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ');

		let resultsPerPage = params.resultsPerPage; 
		if (resultsPerPage === undefined || isNaN(resultsPerPage)) 
			resultsPerPage = 25; // TODO hard coded value
		else
			resultsPerPage = parseInt(resultsPerPage);
		if (resultsPerPage < 1) resultsPerPage = 1;
		sqlValues.push(resultsPerPage);

		let offset = params.offset; 
		if (offset=== undefined || isNaN(resultsPerPage)) 
			offset = 0
		else
			offset = parseInt(offset);
		if (offset < 0) offset = 0;
		sqlValues.push(offset);

		let sql = `SELECT * FROM units ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const unitList = [];
		for (let unitRecord of result) 
			unitList.push( unitObjectHelper.convertUnitFromDb(unitRecord) );
		return unitList;
	}

	static async getUnitById(idUnit) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idUnit === undefined)
			throw new Error('Argument <idUnit> required');
		if (isNaN(idUnit) === undefined)
			throw new Error('Argument <idUnit> is not a number');
		let sql = `SELECT * FROM units WHERE id = ?`;
		const result = await db.query(sql, [idUnit]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const unit = unitObjectHelper.convertUnitFromDb(result[0]);
		return unit;
	}

	static async createUnit(unit) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = unitObjectHelper.controlObjectUnit(unit, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		const unitDb = unitObjectHelper.convertUnitToDb(unit)

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
		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const unitId = result.insertId;
		unit = this.getUnitById(unitId)
		return unit;
	}

	static async editUnit(unit) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = unitObjectHelper.controlObjectUnit(unit, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		const unitDb = unitObjectHelper.convertUnitToDb(unit)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(userDb)) {
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

		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);

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

