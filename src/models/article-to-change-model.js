/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-to-change-model.js
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

const { articleToChangeObjectDef } = require('../objects/article-to-change-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ArticleToChangeModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getArticleToChangeIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleToChangeObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM articles_to_change ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findArticleToChangeCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleToChangeObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM articles_to_change ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findArticleToChangeList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleToChangeObjectDef, filters)
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

		let sql = `SELECT * FROM articles_to_change ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const articleToChangeList = [];
		for (let articleToChangeRecord of result) 
			articleToChangeList.push( objectUtils.convertObjectFromDb(articleToChangeObjectDef, articleToChangeRecord, /*filter=*/true) )
		return articleToChangeList;
	}

	static async getArticleToChangeById(articleToChangeId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleToChangeId === undefined)
			throw new Error('Argument <articleToChangeId> required');
		if (isNaN(articleToChangeId) === undefined)
			throw new Error('Argument <articleToChangeId> is not a number');
		let sql = `SELECT * FROM articles_to_change WHERE id = ?`;
		const result = await db.query(sql, [articleToChangeId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const articleToChange = objectUtils.convertObjectFromDb(articleToChangeObjectDef, result[0], /*filter=*/false)
		return articleToChange;
	}
	


	static async getChildrenCountList(articleToChangeId) {
		if (articleToChangeId === undefined)
			throw new Error('Argument <articleToChangeId> required');
		if (isNaN(articleToChangeId) === undefined)
			throw new Error('Argument <articleToChangeId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		

		return childrenCounterList;
	}


	static async createArticleToChange(articleToChange, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(articleToChangeObjectDef, articleToChange, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleToChangeDb = objectUtils.convertObjectToDb(articleToChangeObjectDef, articleToChange)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleToChangeDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO articles_to_change(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleToChangeId = result.insertId;
		articleToChange = this.getArticleToChangeById(articleToChangeId)
		return articleToChange;
	}

	static async editArticleToChange(articleToChange, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(articleToChangeObjectDef, articleToChange, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleToChangeDb = objectUtils.convertObjectToDb(articleToChangeObjectDef, articleToChange)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleToChangeDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE articles_to_change
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(articleToChange.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleToChangeId = articleToChange.id
		articleToChange = this.getArticleToChangeById(articleToChangeId)
		return articleToChange;
	}

	
	static async deleteById(articleToChangeId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleToChangeId === undefined)
			throw new Error('Argument <articleToChangeId> required');
		if (isNaN(articleToChangeId) === undefined)
			throw new Error('Argument <articleToChangeId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(articleToChangeId))
				throw new Error(`Can not delete ArticleToChange ID <${ articleToChangeId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM articles_to_change WHERE id = ?`;
		const result = await db.query(sql, [articleToChangeId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	

	static async hasChildren(articleToChangeId) {
		return false
	}
}

module.exports = () => {
	ArticleToChangeModel.initialize();
	return ArticleToChangeModel;
}

