/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * auth-routes.js
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

let _config = null;
let _authModel = null;

exports.initialize = (app, authModel, View, config) => {
	assert(config !== undefined);
	_config = config;
	_authModel = authModel;

	app.use( async (request, response, next) => {
		console.log(`Cookie middleware : load access token for request ${request.url} ...`)
		assert(_authModel !== null);
		let userId = null;
		let companyId = null;
		const token = request.headers['x-access-token'];
		if (token === undefined) {
			console.log(`Cookie middleware -> access token absent (anonymous request)`)
		}
		else {
			try {
				[userId, companyId] = await _authModel.checkAccessToken(token);
				console.log(`Cookie middleware -> cookie userId = ${ userId }`);
				console.log(`Cookie middleware -> cookie companyId = ${ companyId }`);
			}
			catch (error) {
				console.log(`Cookie middleware -> cookie error : ${ error.message ? error.message : error }`)
				View.sendJsonError(response, error);
				return;
			}
		}
		request.userId = userId;
		request.companyId = companyId;
		next();
	});

	app.post('/api/v1/auth/register', async (request, response) => {
		try {
			const email = request.body.email;
			if (email === undefined)
				throw new Error(`Can't find <email> in request body`);
			// TODO control password complexity
			const password = request.body.password;
			if (password === undefined)
				throw new Error(`Can't find <password> in request body`);
			if (password.length < 8)
				throw new Error(request.t('error.too_short_data', {'object': 'password'}));
			if (password.length > 70)
				throw new Error(request.t('error.too_long_data', {'object': 'password'}));

			
			const firstname = request.body.firstname
			if (firstname === undefined)
				throw new Error('firstname not found in request body'); 
			if (firstname.length === 0)
				throw new Error(request.t('error.empty_data', {'object': 'firstname'}));
			
			const lastname = request.body.lastname
			if (lastname === undefined)
				throw new Error('lastname not found in request body'); 
			if (lastname.length === 0)
				throw new Error(request.t('error.empty_data', {'object': 'lastname'}));
			
		
			// make a random validation code which will be sent by email to unlock account
			const validationCode = _authModel.generateValidationCode();
			console.log(`Validation code is ${ validationCode }`); // TODO remove this

			const result = await _authModel.register(email, password, firstname, lastname, validationCode, request.t);

			const userId = result.userId; 
			if (userId === undefined)
				throw new Error('userId not found'); 


			const companyId = result.companyId
			if (companyId === undefined)
				throw new Error('companyId not found')
			if (companyId === null)
				throw new Error('companyId is null')


			await _authModel.sendRegisterValidationCode(validationCode, email, request.t);

			// generate access and refresh tokens
			const newAccessToken  = await _authModel.generateAccessToken(userId, companyId);
			const newRefreshToken = await _authModel.generateRefreshToken(userId, companyId);

			View.sendJsonResult(response, {
				userId: userId,
				/* TODO  issue-19
				companyId: companyId,
				firstname : firstname,
				lastname : lastname,
				administrator : administrator,
				parkRole : parkRole,
				stockRole : stockRole,
				active : active,
				accountLocked : accountLocked,
				email: email,
				*/
				'access-token': newAccessToken,
				'refresh-token': newRefreshToken
			});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/auth/validateRegistration', exports.withAuth, async (request, response) => {
		assert(request.userId !== undefined);
		// FIXME userId is already defined with token (request.userId)
		const userId = request.userId;
		try {
			let validationCode = request.body.validationCode;
			if (validationCode === undefined)
				throw new Error(`Can't find <validationCode> in request body`);
			if (isNaN(validationCode))
				throw new Error(request.t('error.invalid_data', {'object': 'validationCode'}));
			validationCode = parseInt(validationCode);
			if (validationCode < 10000 || validationCode > 99999)
				throw new Error(request.t('error.invalid_data', {'object': 'validationCode'}));

			await _authModel.validateRegistration(userId, validationCode, request.t);
			View.sendJsonResult(response, {
				userId // send userId to make API-Lib detect context change and to reload context
			});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/auth/login', async (request, response) => {
		try {
			const email = request.body.email;
			if (email === undefined)
				throw new Error(`Can't find <email> in request body`);
			const password = request.body.password;
			if (password === undefined)
				throw new Error(`Can't find <password> in request body`);

			const result = await _authModel.login(email, password, request.t);
			console.log(result)

			const userId = result.userId; 
			if (userId === undefined)
				throw new Error('userId not found'); 

			const companyId = result.companyId;
			if (companyId === undefined)
				throw new Error('companyId not found');

			// FIXME issue-19 - should not return all informations
			/* 
			if (result.email === undefined)
				throw new Error('email not found'); 
			if (result.email !== email)
				throw new Error('email is not valid'); 

			const firstname = result.firstname
			if (firstname === undefined) 
				throw new Error('firstname not found'); 
			
			const lastname = result.lastname
			if (lastname === undefined) 
				throw new Error('lastname not found'); 
			
			const administrator = result.administrator
			if (administrator === undefined) 
				throw new Error('administrator not found'); 
			
			const parkRole = result.parkRole
			if (parkRole === undefined) 
				throw new Error('parkRole not found'); 
			
			const stockRole = result.stockRole
			if (stockRole === undefined) 
				throw new Error('stockRole not found'); 
			
			const active = result.active
			if (active === undefined) 
				throw new Error('active not found'); 
			
			const accountLocked = result.accountLocked
			if (accountLocked === undefined) 
				throw new Error('accountLocked not found'); 
				*/
			

			const newAccessToken  = await _authModel.generateAccessToken(userId, companyId);

			const newRefreshToken = await _authModel.generateRefreshToken(userId, companyId);

			View.sendJsonResult(response, {
				userId : result.userId,
				/* TODO issue-19
				companyId: result.companyId,
				firstname : firstname,
				lastname : lastname,
				administrator : administrator,
				parkRole : parkRole,
				stockRole : stockRole,
				active : active,
				accountLocked : accountLocked,
				email: result.email,
				*/
				'access-token': newAccessToken,
				'refresh-token': newRefreshToken
			});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/auth/logout', async (request, response) => {
		try {
			const refreshToken = request.body.refreshToken;
			if (refreshToken === undefined)
				throw new Error(`Can't find <refreshToken> in request body`);
			await _authModel.logout(refreshToken, request.t);
			// send userId to null to make API-Lib detect context change
			View.sendJsonResult(response, {userId:null});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/auth/refresh', async (request, response) => {
		try {
			const refreshToken = request.body.token;
			if (refreshToken === undefined)
				throw new Error(`Can't find <token> in request body`);
			if (refreshToken === null)
				throw new Error(`Token in request body is null`);
			const [tokenFound, tokenId, userId, companyId] = await _authModel.checkRefreshToken(refreshToken, request.t);
			if (! tokenFound) {
				// if a token is not found, it should be an attempt to usurp cookie :
				// since a refresh token is deleted when used, it will not be found with a second attempt to use it.
				console.log(`auth/refresh - detect an attempt to reuse a token : lock account userId = ${userId}`)
				await _authModel.lockAccount(userId);
				throw new Error('Attempt to reuse a token');
			}

			await _authModel.deleteRefreshToken(tokenId);

			if (await _authModel.checkAccountLocked(userId)) {
				console.log(`auth/refresh - account locked userId = ${userId}`)
				throw new Error('Account locked')
			}

			const newAccessToken  = await _authModel.generateAccessToken(userId, companyId)
			const newRefreshToken = await _authModel.generateRefreshToken(userId, companyId)

			console.log(`auth/refresh - send new tokens to userId ${userId}`)
			View.sendJsonResult(response, {
				'userId' : userId,
				/* TODO issue-19 : 'companyId': companyId, */
				'access-token': newAccessToken,
				'refresh-token': newRefreshToken
			})
		}
		catch (error) {
			console.error("auth/refresh - error:", (error.message) ? error.message : error)
			View.sendJsonError(response, error);
		}
	});

	app.get('/api/v1/auth/get-context', async (request, response) => {
		try {
			let context = null
			if (request.userId !== null) {
				context = await _authModel.getContext(request.userId);
			}
			View.sendJsonResult(response, { context })
		}
		catch (error) {
			console.error("auth/refresh - error:", (error.message) ? error.message : error)
			View.sendJsonError(response, error);
		}
	});

}

exports.withAuth = async (request, response, next) => {
	if (request.userId === null) {
		response.json({ ok: false, error: 'Unauthorized access (not logged in)'});
		return;
	}
	next();
}

// FIXME duplicated code with previous middleware (withAuth)
exports.withUserAuth = async (request, response, next) => {
	if (request.userId === null) {
		View.sendJsonError(response, 'Unautorized access');
		return;
	}
	next();
}
