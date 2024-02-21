/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * changed-article-model.js
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

const { changedArticleObjectDef } = require('../objects/changed-article-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ChangedArticleModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getChangedArticleIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(changedArticleObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM changed_articles ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findChangedArticleCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(changedArticleObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM changed_articles ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findChangedArticleList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(changedArticleObjectDef, filters)
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

		let sql = `SELECT * FROM changed_articles ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const changedArticleList = [];
		for (let changedArticleRecord of result) 
			changedArticleList.push( objectUtils.convertObjectFromDb(changedArticleObjectDef, changedArticleRecord, /*filter=*/true) )
		return changedArticleList;
	}

	static async getChangedArticleById(changedArticleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (changedArticleId === undefined)
			throw new Error('Argument <changedArticleId> required');
		if (isNaN(changedArticleId) === undefined)
			throw new Error('Argument <changedArticleId> is not a number');
		let sql = `SELECT * FROM changed_articles WHERE id = ?`;
		const result = await db.query(sql, [changedArticleId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const changedArticle = objectUtils.convertObjectFromDb(changedArticleObjectDef, result[0], /*filter=*/false)
		return changedArticle;
	}
	


	static async getChildrenCountList(changedArticleId) {
		if (changedArticleId === undefined)
			throw new Error('Argument <changedArticleId> required');
		if (isNaN(changedArticleId) === undefined)
			throw new Error('Argument <changedArticleId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createChangedArticle(changedArticle, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(changedArticleObjectDef, changedArticle, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const changedArticleDb = objectUtils.convertObjectToDb(changedArticleObjectDef, changedArticle)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(changedArticleDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO changed_articles(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const changedArticleId = result.insertId;
		changedArticle = this.getChangedArticleById(changedArticleId)
		return changedArticle;
	}

	static async editChangedArticle(changedArticle, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(changedArticleObjectDef, changedArticle, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const changedArticleDb = objectUtils.convertObjectToDb(changedArticleObjectDef, changedArticle)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(changedArticleDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE changed_articles
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(changedArticle.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const changedArticleId = changedArticle.id
		changedArticle = this.getChangedArticleById(changedArticleId)
		return changedArticle;
	}

	
	static async deleteById(changedArticleId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (changedArticleId === undefined)
			throw new Error('Argument <changedArticleId> required');
		if (isNaN(changedArticleId) === undefined)
			throw new Error('Argument <changedArticleId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(changedArticleId))
				throw new Error(`Can not delete ChangedArticle ID <${ changedArticleId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM changed_articles WHERE id = ?`;
		const result = await db.query(sql, [changedArticleId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(changedArticleId) {
		return false
	}
}

module.exports = () => {
	ChangedArticleModel.initialize();
	return ChangedArticleModel;
}

