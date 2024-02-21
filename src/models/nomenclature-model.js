/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * nomenclature-model.js
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

const { nomenclatureObjectDef } = require('../objects/nomenclature-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class NomenclatureModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getNomenclatureIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(nomenclatureObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM nomenclatures ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findNomenclatureCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(nomenclatureObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM nomenclatures ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findNomenclatureList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(nomenclatureObjectDef, filters)
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

		let sql = `SELECT * FROM nomenclatures ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const nomenclatureList = [];
		for (let nomenclatureRecord of result) 
			nomenclatureList.push( objectUtils.convertObjectFromDb(nomenclatureObjectDef, nomenclatureRecord, /*filter=*/true) )
		return nomenclatureList;
	}

	static async getNomenclatureById(nomenclatureId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (nomenclatureId === undefined)
			throw new Error('Argument <nomenclatureId> required');
		if (isNaN(nomenclatureId) === undefined)
			throw new Error('Argument <nomenclatureId> is not a number');
		let sql = `SELECT * FROM nomenclatures WHERE id = ?`;
		const result = await db.query(sql, [nomenclatureId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const nomenclature = objectUtils.convertObjectFromDb(nomenclatureObjectDef, result[0], /*filter=*/false)
		return nomenclature;
	}
	


	static async getChildrenCountList(nomenclatureId) {
		if (nomenclatureId === undefined)
			throw new Error('Argument <nomenclatureId> required');
		if (isNaN(nomenclatureId) === undefined)
			throw new Error('Argument <nomenclatureId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createNomenclature(nomenclature, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(nomenclatureObjectDef, nomenclature, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const nomenclatureDb = objectUtils.convertObjectToDb(nomenclatureObjectDef, nomenclature)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(nomenclatureDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO nomenclatures(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const nomenclatureId = result.insertId;
		nomenclature = this.getNomenclatureById(nomenclatureId)
		return nomenclature;
	}

	static async editNomenclature(nomenclature, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(nomenclatureObjectDef, nomenclature, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const nomenclatureDb = objectUtils.convertObjectToDb(nomenclatureObjectDef, nomenclature)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(nomenclatureDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE nomenclatures
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(nomenclature.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const nomenclatureId = nomenclature.id
		nomenclature = this.getNomenclatureById(nomenclatureId)
		return nomenclature;
	}

	
	static async deleteById(nomenclatureId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (nomenclatureId === undefined)
			throw new Error('Argument <nomenclatureId> required');
		if (isNaN(nomenclatureId) === undefined)
			throw new Error('Argument <nomenclatureId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(nomenclatureId))
				throw new Error(`Can not delete Nomenclature ID <${ nomenclatureId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM nomenclatures WHERE id = ?`;
		const result = await db.query(sql, [nomenclatureId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(nomenclatureId) {
		return false
	}
}

module.exports = () => {
	NomenclatureModel.initialize();
	return NomenclatureModel;
}

