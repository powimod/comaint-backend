/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * assignation-model.js
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

const { assignationObjectDef } = require('../objects/assignation-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class AssignationModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getAssignationIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(assignationObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM assignation ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findAssignationCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(assignationObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM assignation ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findAssignationList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(assignationObjectDef, filters)
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

		let sql = `SELECT * FROM assignation ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const assignationList = [];
		for (let assignationRecord of result) 
			assignationList.push( objectUtils.convertObjectFromDb(assignationObjectDef, assignationRecord, /*filter=*/true) )
		return assignationList;
	}

	static async getAssignationById(assignationId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (assignationId === undefined)
			throw new Error('Argument <assignationId> required');
		if (isNaN(assignationId) === undefined)
			throw new Error('Argument <assignationId> is not a number');
		let sql = `SELECT * FROM assignation WHERE id = ?`;
		const result = await db.query(sql, [assignationId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const assignation = objectUtils.convertObjectFromDb(assignationObjectDef, result[0], /*filter=*/false)
		return assignation;
	}
	


	static async getChildrenCountList(assignationId) {
		if (assignationId === undefined)
			throw new Error('Argument <assignationId> required');
		if (isNaN(assignationId) === undefined)
			throw new Error('Argument <assignationId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createAssignation(assignation, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(assignationObjectDef, assignation, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const assignationDb = objectUtils.convertObjectToDb(assignationObjectDef, assignation)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(assignationDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO assignation(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const assignationId = result.insertId;
		assignation = this.getAssignationById(assignationId)
		return assignation;
	}

	static async editAssignation(assignation, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(assignationObjectDef, assignation, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const assignationDb = objectUtils.convertObjectToDb(assignationObjectDef, assignation)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(assignationDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE assignation
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(assignation.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const assignationId = assignation.id
		assignation = this.getAssignationById(assignationId)
		return assignation;
	}

	
	static async deleteById(assignationId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (assignationId === undefined)
			throw new Error('Argument <assignationId> required');
		if (isNaN(assignationId) === undefined)
			throw new Error('Argument <assignationId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(assignationId))
				throw new Error(`Can not delete Assignation ID <${ assignationId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM assignation WHERE id = ?`;
		const result = await db.query(sql, [assignationId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(assignationId) {
		return false
	}
}

module.exports = () => {
	AssignationModel.initialize();
	return AssignationModel;
}

