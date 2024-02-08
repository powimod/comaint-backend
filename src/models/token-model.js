/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * token-model.js
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

const tokenObjectHelper = require('../objects/token-object-helper.cjs')

class TokenModel {

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
		if (filters.userId !== undefined) {
			sqlFilters.push('id_user = ?')
			sqlValues.push(filters.userId)
		}
		const whereClause = sqlFilters.length === 0 ? '' : 'WHERE ' + sqlFilters.join(' AND ')

		let sql = `SELECT id FROM tokens ${whereClause}`
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
		if (filters.userId !== undefined) {
			sqlFilters.push('id_user = ?')
			sqlValues.push(filters.userId);
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

		let sql = `SELECT * FROM tokens ${whereClause} LIMIT ? OFFSET ?`;
		// TODO select with column names and not jocker
		// TODO order by
		// TODO field selection 

		const result = await db.query(sql, sqlValues);
		if (result.code) 
			throw new Error(result.code);
		const tokenList = [];
		for (let tokenRecord of result) 
			tokenList.push( tokenObjectHelper.convertTokenFromDb(tokenRecord) );
		return tokenList;
	}

	static async getTokenById(idToken) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (idToken === undefined)
			throw new Error('Argument <idToken> required');
		if (isNaN(idToken) === undefined)
			throw new Error('Argument <idToken> is not a number');
		let sql = `SELECT * FROM tokens WHERE id = ?`;
		const result = await db.query(sql, [idToken]);
		if (result.code) 
			throw new Error(result.code);
		if (result.length === 0) 
			return null;
		const token = tokenObjectHelper.convertTokenFromDb(result[0]);
		return token;
	}

	static async createToken(token) {
		assert(this.#model !== null);
		const db = this.#model.db;

		const error = tokenObjectHelper.controlObjectToken(token, /*fullCheck=*/true, /*checkId=*/false)
		if ( error)
			throw new Error(error)

		const tokenDb = tokenObjectHelper.convertTokenToDb(token)

		const fieldNames = []
		const markArray = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(tokenDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(propName)
			sqlParams.push(propValue)
			markArray.push('?')
		}

		const sqlRequest = `
			INSERT INTO tokens(${fieldNames.join(', ')}) 
			       VALUES (${markArray.join(', ')});
		`;
		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);
		
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const tokenId = result.insertId;
		token = this.getTokenById(tokenId)
		return token;
	}

	static async editToken(token) {
		assert(this.#model !== null)
		const db = this.#model.db

		const error = tokenObjectHelper.controlObjectToken(token, /*fullCheck=*/false, /*checkId=*/true)
		if ( error)
			throw new Error(error)

		const tokenDb = tokenObjectHelper.convertTokenToDb(token)
		const fieldNames = []
		const sqlParams = []
		for (let [propName, propValue] of Object.entries(userDb)) {
			if (propValue === undefined)
				continue
			fieldNames.push(`${propName} = ?`)
			sqlParams.push(propValue)
		}

		const sqlRequest = `
			UPDATE tokens
				SET ${fieldNames.join(', ')}
			WHERE id = ?
		`
		sqlParams.push(token.id) // WHERE clause

		//console.log("SQL request", sqlRequest);
		//console.log("SQL params ", sqlParams);

		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const tokenId = token.id
		token = this.getTokenById(tokenId)
		return token;
	}

	static async deleteById(tokenId, recursive = false) {
		assert(this.#model !== null);
		const db = this.#model.db;
		if (tokenId === undefined)
			throw new Error('Argument <tokenId> required');
		if (isNaN(tokenId) === undefined)
			throw new Error('Argument <tokenId> is not a number');

		if (! recursive) {
		       	if (await this.hasChildren(tokenId))
				throw new Error(`Can not delete Token ID <${ tokenId }> because it has children`);
		}
		// children will be removed since Database constraint has "ON DELETE CASCADE" 
		let sql = `DELETE FROM tokens WHERE id = ?`;
		const result = await db.query(sql, [tokenId]);
		if (result.code) 
			throw new Error(result.code);
		return (result.affectedRows !== 0) 
	}

	static async hasChildren(tokenId) {
		return false
	}

}

module.exports = () => {
	TokenModel.initialize();
	return TokenModel;
}

