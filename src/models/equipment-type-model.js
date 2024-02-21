/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * equipment-type-model.js
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

const { equipmentTypeObjectDef } = require('../objects/equipment-type-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class EquipmentTypeModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getEquipmentTypeIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentTypeObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM equipment_types ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findEquipmentTypeCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentTypeObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM equipment_types ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findEquipmentTypeList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(equipmentTypeObjectDef, filters)
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

		let sql = `SELECT * FROM equipment_types ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const equipmentTypeList = [];
		for (let equipmentTypeRecord of result) 
			equipmentTypeList.push( objectUtils.convertObjectFromDb(equipmentTypeObjectDef, equipmentTypeRecord, /*filter=*/true) )
		return equipmentTypeList;
	}

	static async getEquipmentTypeById(equipmentTypeId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentTypeId === undefined)
			throw new Error('Argument <equipmentTypeId> required');
		if (isNaN(equipmentTypeId) === undefined)
			throw new Error('Argument <equipmentTypeId> is not a number');
		let sql = `SELECT * FROM equipment_types WHERE id = ?`;
		const result = await db.query(sql, [equipmentTypeId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const equipmentType = objectUtils.convertObjectFromDb(equipmentTypeObjectDef, result[0], /*filter=*/false)
		return equipmentType;
	}
	


	static async getChildrenCountList(equipmentTypeId) {
		if (equipmentTypeId === undefined)
			throw new Error('Argument <equipmentTypeId> required');
		if (isNaN(equipmentTypeId) === undefined)
			throw new Error('Argument <equipmentTypeId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM equipments
			WHERE id_equipment_type = ?
			`
		result = await db.query(sql, [ equipmentTypeId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Equipment'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM nomenclatures
			WHERE id_equipment_type = ?
			`
		result = await db.query(sql, [ equipmentTypeId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Nomenclature'] = result[0].counter

		return childrenCounterList;
	}


	static async createEquipmentType(equipmentType, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(equipmentTypeObjectDef, equipmentType, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentTypeDb = objectUtils.convertObjectToDb(equipmentTypeObjectDef, equipmentType)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentTypeDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO equipment_types(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentTypeId = result.insertId;
		equipmentType = this.getEquipmentTypeById(equipmentTypeId)
		return equipmentType;
	}

	static async editEquipmentType(equipmentType, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(equipmentTypeObjectDef, equipmentType, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const equipmentTypeDb = objectUtils.convertObjectToDb(equipmentTypeObjectDef, equipmentType)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(equipmentTypeDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE equipment_types
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(equipmentType.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const equipmentTypeId = equipmentType.id
		equipmentType = this.getEquipmentTypeById(equipmentTypeId)
		return equipmentType;
	}

	
	static async deleteById(equipmentTypeId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (equipmentTypeId === undefined)
			throw new Error('Argument <equipmentTypeId> required');
		if (isNaN(equipmentTypeId) === undefined)
			throw new Error('Argument <equipmentTypeId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(equipmentTypeId))
				throw new Error(`Can not delete EquipmentType ID <${ equipmentTypeId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM equipment_types WHERE id = ?`;
		const result = await db.query(sql, [equipmentTypeId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getEquipmentCount(equipmentTypeId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM equipments
			WHERE id_equipmentType = ?
			`
		const result = await db.query(sql, [equipmentTypeId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getNomenclatureCount(equipmentTypeId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM nomenclatures
			WHERE id_equipmentType = ?
			`
		const result = await db.query(sql, [equipmentTypeId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(equipmentTypeId) {
		if (await this.getEquipmentCount(equipmentTypeId) > 0) 
			return true
		if (await this.getNomenclatureCount(equipmentTypeId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	EquipmentTypeModel.initialize();
	return EquipmentTypeModel;
}

