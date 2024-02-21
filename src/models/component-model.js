/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * component-model.js
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

const { componentObjectDef } = require('../objects/component-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ComponentModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getComponentIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(componentObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM components ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findComponentCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(componentObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM components ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findComponentList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(componentObjectDef, filters)
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

		let sql = `SELECT * FROM components ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const componentList = [];
		for (let componentRecord of result) 
			componentList.push( objectUtils.convertObjectFromDb(componentObjectDef, componentRecord, /*filter=*/true) )
		return componentList;
	}

	static async getComponentById(componentId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (componentId === undefined)
			throw new Error('Argument <componentId> required');
		if (isNaN(componentId) === undefined)
			throw new Error('Argument <componentId> is not a number');
		let sql = `SELECT * FROM components WHERE id = ?`;
		const result = await db.query(sql, [componentId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const component = objectUtils.convertObjectFromDb(componentObjectDef, result[0], /*filter=*/false)
		return component;
	}
	


	static async getChildrenCountList(componentId) {
		if (componentId === undefined)
			throw new Error('Argument <componentId> required');
		if (isNaN(componentId) === undefined)
			throw new Error('Argument <componentId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM nomenclatures
			WHERE id_component = ?
			`
		result = await db.query(sql, [ componentId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Nomenclature'] = result[0].counter

		return childrenCounterList;
	}


	static async createComponent(component, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(componentObjectDef, component, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const componentDb = objectUtils.convertObjectToDb(componentObjectDef, component)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(componentDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO components(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const componentId = result.insertId;
		component = this.getComponentById(componentId)
		return component;
	}

	static async editComponent(component, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(componentObjectDef, component, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const componentDb = objectUtils.convertObjectToDb(componentObjectDef, component)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(componentDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE components
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(component.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const componentId = component.id
		component = this.getComponentById(componentId)
		return component;
	}

	
	static async deleteById(componentId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (componentId === undefined)
			throw new Error('Argument <componentId> required');
		if (isNaN(componentId) === undefined)
			throw new Error('Argument <componentId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(componentId))
				throw new Error(`Can not delete Component ID <${ componentId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM components WHERE id = ?`;
		const result = await db.query(sql, [componentId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getNomenclatureCount(componentId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM nomenclatures
			WHERE id_component = ?
			`
		const result = await db.query(sql, [componentId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(componentId) {
		if (await this.getNomenclatureCount(componentId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	ComponentModel.initialize();
	return ComponentModel;
}

