/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-family-model.js
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

const { equipmentFamilyObjectDef } = require('../objects/equipment-family-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class EquipmentFamilyModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getEquipmentFamilyIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentFamilyObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM equipment_families ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findEquipmentFamilyCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentFamilyObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM equipment_families ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findEquipmentFamilyList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentFamilyObjectDef, filters)
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

		let sql = `SELECT * FROM equipment_families ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const equipmentFamilyList = [];
		for (let equipmentFamilyRecord of result) 
			equipmentFamilyList.push( objectUtils.convertObjectFromDb(equipmentFamilyObjectDef, equipmentFamilyRecord, /*filter=*/true) )
		return equipmentFamilyList;
	}

	static async getEquipmentFamilyById(equipmentFamilyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentFamilyId === undefined)
			throw new Error('Argument <equipmentFamilyId> required');
		if (isNaN(equipmentFamilyId) === undefined)
			throw new Error('Argument <equipmentFamilyId> is not a number');
		let sql = `SELECT * FROM equipment_families WHERE id = ?`;
		const result = await db.query(sql, [equipmentFamilyId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const equipmentFamily = objectUtils.convertObjectFromDb(equipmentFamilyObjectDef, result[0], /*filter=*/false)
		return equipmentFamily;
	}
	


	static async getChildrenCountList(equipmentFamilyId) {
		if (equipmentFamilyId === undefined)
			throw new Error('Argument <equipmentFamilyId> required');
		if (isNaN(equipmentFamilyId) === undefined)
			throw new Error('Argument <equipmentFamilyId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipment_types
			WHERE id_equipment_family = ?
			`
		result = await db.query(sql, [ equipmentFamilyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['EquipmentType'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM components
			WHERE id_equipment_family = ?
			`
		result = await db.query(sql, [ equipmentFamilyId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Component'] = result[0].counter

		return childrenCounterList;
	}


	static async createEquipmentFamily(equipmentFamily, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(equipmentFamilyObjectDef, equipmentFamily, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentFamilyDb = objectUtils.convertObjectToDb(equipmentFamilyObjectDef, equipmentFamily)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentFamilyDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO equipment_families(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentFamilyId = result.insertId;
		equipmentFamily = this.getEquipmentFamilyById(equipmentFamilyId)
		return equipmentFamily;
	}

	static async editEquipmentFamily(equipmentFamily, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(equipmentFamilyObjectDef, equipmentFamily, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentFamilyDb = objectUtils.convertObjectToDb(equipmentFamilyObjectDef, equipmentFamily)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentFamilyDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE equipment_families
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(equipmentFamily.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentFamilyId = equipmentFamily.id
		equipmentFamily = this.getEquipmentFamilyById(equipmentFamilyId)
		return equipmentFamily;
	}

	
	static async deleteById(equipmentFamilyId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentFamilyId === undefined)
			throw new Error('Argument <equipmentFamilyId> required');
		if (isNaN(equipmentFamilyId) === undefined)
			throw new Error('Argument <equipmentFamilyId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(equipmentFamilyId))
				throw new Error(`Can not delete EquipmentFamily ID <${ equipmentFamilyId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM equipment_families WHERE id = ?`;
		const result = await db.query(sql, [equipmentFamilyId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getEquipmentTypeCount(equipmentFamilyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipment_types
			WHERE id_equipmentFamily = ?
			`
		const result = await db.query(sql, [equipmentFamilyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getComponentCount(equipmentFamilyId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM components
			WHERE id_equipmentFamily = ?
			`
		const result = await db.query(sql, [equipmentFamilyId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(equipmentFamilyId) {
		if (await this.getEquipmentTypeCount(equipmentFamilyId) > 0) 
			return true
		if (await this.getComponentCount(equipmentFamilyId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	EquipmentFamilyModel.initialize();
	return EquipmentFamilyModel;
}

