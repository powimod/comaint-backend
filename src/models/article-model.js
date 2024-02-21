/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-model.js
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

const { articleObjectDef } = require('../objects/article-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ArticleModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getArticleIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM articles ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findArticleCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM articles ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findArticleList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleObjectDef, filters)
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

		let sql = `SELECT * FROM articles ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const articleList = [];
		for (let articleRecord of result) 
			articleList.push( objectUtils.convertObjectFromDb(articleObjectDef, articleRecord, /*filter=*/true) )
		return articleList;
	}

	static async getArticleById(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleId === undefined)
			throw new Error('Argument <articleId> required');
		if (isNaN(articleId) === undefined)
			throw new Error('Argument <articleId> is not a number');
		let sql = `SELECT * FROM articles WHERE id = ?`;
		const result = await db.query(sql, [articleId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const article = objectUtils.convertObjectFromDb(articleObjectDef, result[0], /*filter=*/false)
		return article;
	}
	


	static async getChildrenCountList(articleId) {
		if (articleId === undefined)
			throw new Error('Argument <articleId> required');
		if (isNaN(articleId) === undefined)
			throw new Error('Argument <articleId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM nomenclatures
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Nomenclature'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM inventories
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Inventory'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles_to_change
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ArticleToChange'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM changed_articles
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['ChangedArticle'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM catalog
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Catalog'] = result[0].counter
		sql = `
			SELECT COUNT(id) AS counter 
			FROM order_lines
			WHERE id_article = ?
			`
		result = await db.query(sql, [ articleId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['OrderLine'] = result[0].counter

		return childrenCounterList;
	}


	static async createArticle(article, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(articleObjectDef, article, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleDb = objectUtils.convertObjectToDb(articleObjectDef, article)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO articles(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleId = result.insertId;
		article = this.getArticleById(articleId)
		return article;
	}

	static async editArticle(article, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(articleObjectDef, article, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleDb = objectUtils.convertObjectToDb(articleObjectDef, article)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE articles
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(article.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleId = article.id
		article = this.getArticleById(articleId)
		return article;
	}

	
	static async deleteById(articleId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleId === undefined)
			throw new Error('Argument <articleId> required');
		if (isNaN(articleId) === undefined)
			throw new Error('Argument <articleId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(articleId))
				throw new Error(`Can not delete Article ID <${ articleId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM articles WHERE id = ?`;
		const result = await db.query(sql, [articleId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getNomenclatureCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM nomenclatures
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getInventoryCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM inventories
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getArticleToChangeCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles_to_change
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getChangedArticleCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM changed_articles
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getCatalogCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM catalog
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	
	static async getOrderLineCount(articleId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM order_lines
			WHERE id_article = ?
			`
		const result = await db.query(sql, [articleId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(articleId) {
		if (await this.getNomenclatureCount(articleId) > 0) 
			return true
		if (await this.getInventoryCount(articleId) > 0) 
			return true
		if (await this.getArticleToChangeCount(articleId) > 0) 
			return true
		if (await this.getChangedArticleCount(articleId) > 0) 
			return true
		if (await this.getCatalogCount(articleId) > 0) 
			return true
		if (await this.getOrderLineCount(articleId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	ArticleModel.initialize();
	return ArticleModel;
}

