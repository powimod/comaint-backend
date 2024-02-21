/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-sub-category-model.js
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

const { articleSubCategoryObjectDef } = require('../objects/article-sub-category-object-def.cjs')
const objectUtils = require('../objects/object-util.cjs')

class ArticleSubCategoryModel {
	static #model = null;

	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)
	}

	static async getArticleSubCategoryIdList(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleSubCategoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')
 
		let sql = `SELECT id FROM article_subcategories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code) 
			throw new Error(result.code)
		const idList = []
		for (let record of result) 
			idList.push( record.Id)
		return idList;
	}

	static async findArticleSubCategoryCount(filters = []) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleSubCategoryObjectDef, filters)
		const whereClause = fieldNames.length === 0 ? '' :
			'WHERE ' + fieldNames.map(f => `${f} = ?`).join(' AND ')

		let sql = `SELECT COUNT(id) as counter FROM article_subcategories ${whereClause}`
		const result = await db.query(sql, fieldValues)
		if (result.code)
			throw new Error(result.code)
		return result[0].counter;
	}


	static async findArticleSubCategoryList(filters, params) {
		assert(filters !== undefined);
		assert(params !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		const [ fieldNames, fieldValues ] = objectUtils.buildFieldArrays(articleSubCategoryObjectDef, filters)
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

		let sql = `SELECT * FROM article_subcategories ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker

		const result = await db.query(sql, fieldValues);
		if (result.code) 
			throw new Error(result.code);
		const articleSubCategoryList = [];
		for (let articleSubCategoryRecord of result) 
			articleSubCategoryList.push( objectUtils.convertObjectFromDb(articleSubCategoryObjectDef, articleSubCategoryRecord, /*filter=*/true) )
		return articleSubCategoryList;
	}

	static async getArticleSubCategoryById(articleSubCategoryId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleSubCategoryId === undefined)
			throw new Error('Argument <articleSubCategoryId> required');
		if (isNaN(articleSubCategoryId) === undefined)
			throw new Error('Argument <articleSubCategoryId> is not a number');
		let sql = `SELECT * FROM article_subcategories WHERE id = ?`;
		const result = await db.query(sql, [articleSubCategoryId]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const articleSubCategory = objectUtils.convertObjectFromDb(articleSubCategoryObjectDef, result[0], /*filter=*/false)
		return articleSubCategory;
	}
	


	static async getChildrenCountList(articleSubCategoryId) {
		if (articleSubCategoryId === undefined)
			throw new Error('Argument <articleSubCategoryId> required');
		if (isNaN(articleSubCategoryId) === undefined)
			throw new Error('Argument <articleSubCategoryId> is not a number');
		assert(this.#model !== null);
		const db = this.#model.db;
		let sql, result;
		const childrenCounterList = {}

		
		sql = `
			SELECT COUNT(id) AS counter 
			FROM articles
			WHERE id_article_sub_category = ?
			`
		result = await db.query(sql, [ articleSubCategoryId ]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		childrenCounterList['Article'] = result[0].counter

		return childrenCounterList;
	}


	static async createArticleSubCategory(articleSubCategory, i18n_t = null) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = objectUtils.controlObject(articleSubCategoryObjectDef, articleSubCategory, /*fullCheck=*/true, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleSubCategoryDb = objectUtils.convertObjectToDb(articleSubCategoryObjectDef, articleSubCategory)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleSubCategoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO article_subcategories(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleSubCategoryId = result.insertId;
		articleSubCategory = this.getArticleSubCategoryById(articleSubCategoryId)
		return articleSubCategory;
	}

	static async editArticleSubCategory(articleSubCategory, i18n_t = null) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = objectUtils.controlObject(articleSubCategoryObjectDef, articleSubCategory, /*fullCheck=*/false, /*checkId=*/false, i18n_t)
		if ( error)
			throw new Error(error)

		const articleSubCategoryDb = objectUtils.convertObjectToDb(articleSubCategoryObjectDef, articleSubCategory)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(articleSubCategoryDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE article_subcategories
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(articleSubCategory.id) // WHERE clause

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const articleSubCategoryId = articleSubCategory.id
		articleSubCategory = this.getArticleSubCategoryById(articleSubCategoryId)
		return articleSubCategory;
	}

	
	static async deleteById(articleSubCategoryId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (articleSubCategoryId === undefined)
			throw new Error('Argument <articleSubCategoryId> required');
		if (isNaN(articleSubCategoryId) === undefined)
			throw new Error('Argument <articleSubCategoryId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(articleSubCategoryId))
				throw new Error(`Can not delete ArticleSubCategory ID <${ articleSubCategoryId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM article_subcategories WHERE id = ?`;
		const result = await db.query(sql, [articleSubCategoryId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	
	static async getArticleCount(articleSubCategoryId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sql = `
			SELECT COUNT(id) as count
			FROM articles
			WHERE id_articleSubCategory = ?
			`
		const result = await db.query(sql, [articleSubCategoryId])
		if (result.code) 
			throw new Error(result.code)
		return result[0].count 
	}
	

	static async hasChildren(articleSubCategoryId) {
		if (await this.getArticleCount(articleSubCategoryId) > 0) 
			return true
		return false
	}
}

module.exports = () => {
	ArticleSubCategoryModel.initialize();
	return ArticleSubCategoryModel;
}

