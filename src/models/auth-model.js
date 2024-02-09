/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * auth-model.js
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


'use strict';
const assert = require('assert');
const jwt = require('jsonwebtoken');
const util = require('../util.js');

class AuthModel {
	static #model = null;
	static #config = null;
	static #secret = null;

	static initialize = (config) => {
		assert(this.#model === null);
		assert(config !== undefined);
		this.#config = config;
		this.#secret = config.security.tokenSecret;
		assert(this.#secret !== undefined);

		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
	}

	static generateValidationCode() {
		const minimum = 10000;
		const maximum = 99999;
		return parseInt(Math.random() * (maximum - minimum) + minimum);
	}

	static async sendValidationCode(code, email, i18n_t) {
		const subject = i18n_t('register.mail_title')
		const textBody = i18n_t('register.mail_body', { 'code' : code })
		const htmlBody = i18n_t('register.mail_body', { 'code' : `<b>${code}</b>code` })
		return await util.sendMail(
				email,
				subject,
				textBody,
				htmlBody,
				this.#config.mail
		); 
	}

	static async register(email, password,firstname,lastname,validationCode, i18n_t) {
		assert(email !== undefined);
		assert(password !== undefined);
		assert(validationCode !== undefined);
		assert(this.#model !== null);
		// check an account with same email does not already exist
		const db = this.#model.db;
		let sql = 'SELECT email FROM users WHERE email = ?';
		let result = await db.query(sql, [ email ]);
		if (result.code)
			throw new Error(result.code);
		if (result.length > 0) 
			throw new Error(i18n_t('register.account_already_exists'));

		// make a hash of the password
		assert(this.#config.security.hashSalt !== undefined);
		const saltRounds = this.#config.security.hashSalt;
		const bcrypt = require('bcrypt');
		const passwordHash = await bcrypt.hash(password, saltRounds)

		const administrator = false
		const parkRole = 0
		const stockRole = 0
		const active = true
		const accountLocked = true // account locked

		const sqlRequest = `
			INSERT INTO users
				(email, password, firstname, lastname, administrator, park_role, stock_role, active, validation_code, account_locked)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
		const sqlParams = [
			email,
			passwordHash,
			firstname,
			lastname,
			administrator,
			parkRole,
			stockRole,
			active,
			validationCode,
			accountLocked
		];
		result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);

		return {
			userId : result.insertId
		}
	}

	static async validateRegistration(userId, validationCode, i18n_t) {
		assert(this.#model !== null);
		const db = this.#model.db;
		let sqlRequest = `
			SELECT validation_code, account_locked
			FROM users
			WHERE id = ?;`;
		let sqlParams = [
			userId,
		];
		let result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0) 
			throw new Error('Unknown User Id');
		if (validationCode !== result[0].validation_code)
			throw new Error('Invalid code');
		if (! result[0].account_locked)
			throw new Error(i18n_t('error.account_not_locked'));

		// unlock User account and reset validation code
		sqlRequest = `UPDATE users 
			SET account_locked = ?, validation_code = ?
			WHERE id= ?`;
		sqlParams = [ false, null, userId ];
		result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.affectedRows=== 0) 
			throw new Error(i18n_t('error.account_not_found'));
	}

	static async login(email, password, i18n_t) {
		assert(this.#model !== null);
		const db = this.#model.db;
		
		// TODO  cleanup
		// let sql = `SELECT id, email, password, account_locked, id_company, firstname, lastname, administrator, park_role, stock_role, active, accountLocked FROM users WHERE email = ?`;
		let sql = `SELECT id, email, password, account_locked, id_company, firstname, lastname, administrator, active, account_locked FROM users WHERE email = ?`;
		const result = await db.query(sql, [ email ]);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0) 
			throw new Error(i18n_t('error.invalid_account_ident'));
		const bcrypt = require('bcrypt');
		const passwordValid = await bcrypt.compare(password, result[0].password);
		if (! passwordValid)
			throw new Error(i18n_t('error.invalid_account_ident'));
		if (result[0].accountLocked)
			throw new Error('User account is locked');
		return {
			companyId: result[0].id_company,
			userId: result[0].id,
			email : result[0].email,
			firstname: result[0].firstname,
			lastname: result[0].lastname,
			/* TODO cleanup 
			administrator: result[0].administrator,
			parkRole: result[0].parkRole,
			stockRole: result[0].stockRole,
			active: result[0].active,
			accountLocked: result[0].accountLocked,
			*/
		}
	}

	static async logout(token) {
		// FIXME function decodeToken is duplicated 
		const decodeToken = new Promise( (resolve, reject) => {
			const options = {
				ignoreExpiration: true // accept expired tokens
			}
			jwt.verify(token, this.#secret, options, (err, decoded) => {
				if (err !== null) {
					reject('Invalid token');
					return;
				}
				if (decoded.type !== 'refresh') {
					reject('Not a refresh token');
					return;
				}
				if (isNaN(decoded.user_id)) {
					reject(`Invalid token content`);
					return;
				}
				if (isNaN(decoded.token_id)) {
					reject(`Invalid token content`);
					return;
				}
				if (isNaN(decoded.company_id)) {
					reject(`Invalid token content`);
					return;
				}
				resolve([decoded.token_id, decoded.user_id, decoded.company_id]);
			});
		});
		const [tokenId, userId, companyId] = await decodeToken;
		assert(tokenId !== undefined);
		assert(userId !== undefined);
		assert(companyId !== undefined);


		let sql = 'DELETE FROM tokens WHERE id = ?';
		assert(this.#model !== null);
		const db = this.#model.db;
		const result = await db.query(sql, [ tokenId ]);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0) 
			throw new Error('Unknown token ID');
	}

	static async generateAccessToken(userId, companyId) {
		assert (this.#config.security.accessTokenLifespan !== undefined);
		const accessTokenLifespan = this.#config.security.accessTokenLifespan;
		const payload = {
			company_id: companyId,
			type: 'access',
			user_id: userId
		};
		return jwt.sign(payload, this.#secret, { expiresIn: `${accessTokenLifespan}s`});
	}

	static async generateRefreshToken(userId, companyId) {
		const db = this.#model.db;
		assert (this.#config.security.refreshTokenLifespan !== undefined);
		const refreshTokenLifespan = this.#config.security.refreshTokenLifespan;
		const expirationDate = new Date (Date.now() + refreshTokenLifespan * 86400000); // 24 hours in ms
		const sqlRequest = 'INSERT INTO tokens(id_user, expires_at) VALUES (?, ?)';
		const sqlParams = [
			userId,
			expirationDate
		];
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0)
			throw new Error('Can not store refresh token');
		const tokenId = result.insertId;
		const payload = {
			company_id: companyId,
			type: 'refresh',
			user_id: userId,
			token_id: tokenId
		};
		return jwt.sign(payload, this.#secret, { expiresIn: `${refreshTokenLifespan}days` });
	}

	static checkAccessToken(token) {
		return new Promise( (resolve, reject) => {
			jwt.verify(token, this.#secret, (err, decoded) => {
				if (err !== null)  {
					if (err.constructor.name === 'TokenExpiredError')
						reject('Expired token') // DO NOT translate (used by API lib)
					else
						reject('Invalid token')
					return
				}
				if (decoded.type !== 'access') {
					reject('Not an access token')
					return
				}
				if (isNaN(decoded.user_id)) {
					reject(`Invalid token content`)
					return
				}
				if (isNaN(decoded.company_id)) {
					reject(`Invalid token content`)
					return
				}
				resolve([decoded.user_id, decoded.company_id])
			})
		})
	}

	static async checkRefreshToken(token) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const decodeToken = new Promise( (resolve, reject) => {
			jwt.verify(token, this.#secret, (err, decoded) => {
				if (err !== null)  {
					if (err.constructor.name === 'TokenExpiredError')
						reject('Expired token') // DO NOT translate (used by API lib)
					else
						reject('Invalid token')
					return
				}
				if (decoded.type !== 'refresh') {
					reject('Not an refresh token')
					return
				}
				if (isNaN(decoded.token_id) || isNaN(decoded.user_id)) {
					reject(`Invalid token content`)
					return
				}
				resolve([decoded.token_id, decoded.user_id, decoded.company_id])
			})
		})
		const [tokenId, userId, companyId] = await decodeToken;

		assert(tokenId !== undefined);
		assert(userId !== undefined);
		assert(companyId !== undefined);

		const sqlRequest = 'SELECT id FROM tokens WHERE id = ?';
		const sqlParams = [ tokenId ];
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		const tokenFound = (result.length === 0) ? false : true
		
		//TODO return extra field
		return [tokenFound, tokenId, userId, companyId];
	}


	static async deleteRefreshToken(tokenId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sqlRequest = 'DELETE FROM tokens WHERE id = ?';
		const sqlParams = [ tokenId ];
		const result = await db.query(sqlRequest, sqlParams);
		return (result.affectedRows === 0) ? false : true;
	}

	static async checkAccountLocked(userId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		const sqlRequest = 'SELECT account_locked FROM users WHERE id= ?';
		const sqlParams = [ userId ];
		const result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0) 
			throw new Error('User not found');
		const locked = result[0].accountLocked;
		return locked;
	}

	static async lockAccount(userId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		// lock account
		let sqlRequest = 'UPDATE users SET account_locked = ? WHERE id= ?';
		let sqlParams = [ true, userId ];
		let result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.affectedRows=== 0) 
			throw new Error('User not found');
		// remove existing User tokens
		sqlRequest = 'DELETE FROM tokens WHERE id_user = ?';
		sqlParams = [ userId ];
		result = await db.query(sqlRequest, sqlParams);
	}

	static async getContext(userId) {
		assert(userId !== undefined)
		assert(userId !== null)
		assert(this.#model !== null);
		const db = this.#model.db;
		let sqlRequest = `
			SELECT id,  email,firstname, lastname, administrator, park_role, stock_role, active, account_locked, id_company
			FROM users 
			WHERE id = ?;`;
		let sqlParams = [
			userId
		];
		let result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.length === 0) 
			throw new Error('Unknown User Id');
		result[0].administrator = (result[0].administrator === 1)
		result[0].active= (result[0].active === 1)
		result[0].account_locked = (result[0].account_locked === 1)
		const context = {
			userId: result[0].id,
			email: result[0].email,
			firstname: result[0].firstname,
			lastname: result[0].lastname,
			administrator: result[0].administrator,
			parkRole: result[0].park_role,
			stockRole: result[0].stock_role,
			active: result[0].active,
			accountLocked: result[0].account_locked,
			companyId: result[0].id_company
		}
		return context
	}

}

module.exports = (config) => {
	AuthModel.initialize(config);
	return AuthModel;
}

