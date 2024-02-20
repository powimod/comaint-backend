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
	static #config = null;
	static #secret = null;
	static #model = null;

	static initialize = (config) => {
		assert(this.#model === null);
		assert(config !== undefined);
		this.#config = config;
		this.#secret = config.security.tokenSecret;
		assert(this.#secret !== undefined);

		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)

	}

	static generateValidationCode() {
		const minimum = 10000;
		const maximum = 99999;
		return parseInt(Math.random() * (maximum - minimum) + minimum);
	}

	static async sendRegisterValidationCode(code, email, i18n_t) {
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

	static async sendUnlockAccountValidationCode(code, email, i18n_t) {
		const subject = i18n_t('unlock_account.mail_title')
		const textBody = i18n_t('unlock_account.mail_body', { 'code' : code })
		const htmlBody = i18n_t('unlock_account.mail_body', { 'code' : `<b>${code}</b>code` })
		return await util.sendMail(
				email,
				subject,
				textBody,
				htmlBody,
				this.#config.mail
		); 
	}

	static async sendForgottenPasswordValidationCode(code, email, i18n_t) {
		const subject = i18n_t('forgotten_password.mail_title')
		const textBody = i18n_t('forgotten_password.mail_body', { 'code' : code })
		const htmlBody = i18n_t('forgotten_password.mail_body', { 'code' : `<b>${code}</b>code` })
		return await util.sendMail(
				email,
				subject,
				textBody,
				htmlBody,
				this.#config.mail
		); 
	}



	static async register(email, password, firstname, lastname, validationCode, i18n_t) {
		assert(email !== undefined);
		assert(password !== undefined);
		assert(validationCode !== undefined);
		assert(this.#model !== null);

		// check an account with same email does not already exist
		let user = await this.#model.getUserModel().getUserByEmail(email)
		if (user != null)
			throw new Error(i18n_t('register.account_already_exists'));

		let company = await this.#model.getCompanyModel().createCompany({
			name: `company of ${firstname} ${lastname}`, // TODO translation
			locked: false,
			logoUid: '' // FIXME should not be mandatory
		})

		const administrator = false
		const parkRole = 0 // FIXME should not be 0
		const stockRole = 0
		const active = true
		const accountLocked = true // account locked
		const companyId = company.id

		try {
			user = await this.#model.getUserModel().createUser({
				email,
				password,
				firstname,
				lastname,
				administrator,
				parkRole,
				stockRole,
				active,
				validationCode,
				accountLocked,
				companyId
			})
		}
		catch (error) {
			await this.#model.getCompanyModel().deleteById(company.id, false)
			throw error
		}

		company.managerId = user.id 
		company = await this.#model.getCompanyModel().editCompany(company)

		return {
			userId : user.id,
			companyId: user.companyId
		}

	}

	static async validateRegistration(userId, validationCode, i18n_t) {
		assert(this.#model !== null);

		let user = await this.#model.getUserModel().getUserById(userId)
		if (user === null)
			throw new Error('Unknown User Id');
		if (validationCode !== user.validationCode)
			throw new Error('Invalid code');
		if (! user.accountLocked)
			throw new Error(i18n_t('error.account_not_locked'));

		// unlock User account and reset validation code
		user.accountLocked = false
		user.validationCode = 0
		delete user.password // do not re-encrypt already encrypted password !
		await this.#model.getUserModel().editUser(user)
	
	}

	static async login(email, password, i18n_t) {
		assert(this.#model !== null);
		const db = this.#model.db;
		
		let user = await this.#model.getUserModel().getUserByEmail(email)
		if (user === null)
			throw new Error(i18n_t('error.invalid_account_ident'));

		const passwordValid = await this.#model.getUserModel().checkPassword(user, password)
		if (! passwordValid)
			throw new Error(i18n_t('error.invalid_account_ident'));

		if (user.accountLocked)
			throw new Error('User account is locked');

		return {
			userId: user.id,
			companyId: user.companyId,
			email : user.email,
			firstname: user.firstname,
			lastname: user.lastname,
			administrator: user.administrator,
			parkRole: user.parkRole,
			stockRole: user.stockRole,
			active: user.active,
			accountLocked: user.accountLocked
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


		// TODO use tokenModel
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
		// TODO use tokenModel
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

		// TODO use tokenModel
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
		// TODO use tokenModel
		const sqlRequest = 'DELETE FROM tokens WHERE id = ?';
		const sqlParams = [ tokenId ];
		const result = await db.query(sqlRequest, sqlParams);
		return (result.affectedRows === 0) ? false : true;
	}

	static async checkAccountLocked(userId) {
		assert(this.#model !== null);
		const db = this.#model.db;
		// TODO use UserModel
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
		// TODO use UserModel
		let sqlRequest = 'UPDATE users SET account_locked = ? WHERE id= ?';
		let sqlParams = [ true, userId ];
		let result = await db.query(sqlRequest, sqlParams);
		if (result.code)
			throw new Error(result.code);
		if (result.affectedRows=== 0) 
			throw new Error('User not found');
		// remove existing User tokens
		// TODO use tokenModel
		sqlRequest = 'DELETE FROM tokens WHERE id_user = ?';
		sqlParams = [ userId ];
		result = await db.query(sqlRequest, sqlParams);
	}

	static async storeUnlockAccountCode(userId, validationCode, i18n_t) {
		assert(userId !== undefined)
		assert(validationCode !== undefined)
		assert(i18n_t !== undefined)
		assert(this.#model !== null);
		let user = await this.#model.getUserModel().getUserById(userId)
		if (user === null)
			throw new Error(i18n_t('error.invalid_account_id'));
		if (! user.accountLocked)
			throw new Error(i18n_t('error.account_not_locked'));
		user.validationCode= validationCode
		await this.#model.getUserModel().editUser(user)
		return user
	}

	static async unlockAccount(userId, validationCode, i18n_t) {
		assert(userId !== undefined)
		assert(validationCode !== undefined)
		assert(i18n_t !== undefined)
		assert(this.#model !== null);
		let user = await this.#model.getUserModel().getUserById(userId)
		if (user === null)
			throw new Error(i18n_t('error.invalid_account_id'));
		if (! user.accountLocked)
			throw new Error(i18n_t('error.account_not_locked'));
		assert(user.validationCode !== undefined)
		const isValid = (validationCode === user.validationCode)
		if (isValid) {
			user.accountLocked = false
			user.validationCode = 0
			await this.#model.getUserModel().editUser(user)
		}
		return isValid
	}


	static async storeForgottenPasswordCode(email, validationCode, i18n_t) {
		assert(email!== undefined)
		assert(validationCode !== undefined)
		assert(i18n_t !== undefined)
		assert(this.#model !== null);
		let user = await this.#model.getUserModel().getUserByEmail(email)
		if (user === null)
			throw new Error(i18n_t('error.invalid_account_id'));
		user.validationCode = validationCode
		await this.#model.getUserModel().editUser(user)
		return user
	}

	static async changePassword(email, validationCode, newPassword, i18n_t) {
		assert(email !== undefined)
		assert(validationCode !== undefined)
		assert(newPassword !== undefined)
		assert(i18n_t !== undefined)
		assert(this.#model !== null);
		let user = await this.#model.getUserModel().getUserByEmail(email)
		if (user === null)
			throw new Error(i18n_t('error.invalid_account_id'));
		assert(user.validationCode !== undefined)
		const isValid = (validationCode === user.validationCode)
		if (isValid) {
			console.log('Validation code is OK')
			user.validationCode = 0
			user.password = newPassword // editUser function will encrypt password
			await this.#model.getUserModel().editUser(user)
			console.log('Password changed')
		}
		return isValid
	}


	static async getContext(userId) {
		assert(userId !== undefined)
		assert(userId !== null)
		assert(this.#model !== null);
		const db = this.#model.db;
		// TODO use UserModel
		let sqlRequest = `
			SELECT id, email, firstname, lastname, administrator, park_role, stock_role, active, account_locked, id_company
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


	static async findAdministratorCount() {
		const userModel = await this.#model.getUserModel()
		return userModel.findUserCount( {
			'administrator': true
		})
	}

	static async createAdministratorAccount(email, password) {
		assert(email !== undefined)
		assert(password!== undefined)
		const administrator = true
		const userModel = await this.#model.getUserModel()
		return userModel.createUser({ 
			email: email, 
			password: password, 
			administrator : true,
			firstname: 'Comaint',
			lastname: 'Administrator',
			accountLocked: false,
			active: true,
			phone: '', // FIXME
		})
	}

}

module.exports = (config) => {
	AuthModel.initialize(config);
	return AuthModel;
}

