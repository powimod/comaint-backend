/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * user-routes.js
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


'use script';
const assert = require('assert');
const {withAuth} = require('./auth-routes');

module.exports = (app, UserModel, View) => {

	app.get('/api/v1/user/list', withAuth, async (request, response) => {
		const filters = {};
		let companyId = request.query.companyId;
		if (companyId !== undefined) {
			if (isNaN(companyId))
				throw new Error('Query <companyId> is not a number');
			companyId = parseInt(companyId);
			filters.companyId = companyId;
		}
		assert(request.companyId !== undefined);
		try {
			if (filters.companyId === undefined) {
				filters.companyId = request.companyId;
			}
			else {
				if (filters.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let resultsPerPage = request.query.resultsPerPage;
			let offset = request.query.offset;
			const params = {
				resultsPerPage : resultsPerPage,
				offset : offset
			};
			const list = await UserModel.getList(filters, params);
			View.sendJsonResult(response, { userList: list } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/user/:userId', withAuth, async (request, response) => {
		let userId = request.params.userId;
		assert (userId !== undefined);
		if (isNaN(userId)) {
			View.sendJsonError(response, `User ID <${ userId}> is not a number`);
			return;
		}
		userId = parseInt(userId);
		try {
			const user = await UserModel.getUserById(userId);
			if (user === null)
				throw new Error(`User ID <${ userId }> not found`);
			// control root property 
			if (request.companyId !== user.companyId)
				throw new Error('Unauthorized access');
			delete user.password
			View.sendJsonResult(response, { user: user} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/user/create', withAuth, async (request, response) => {
		try {
			const companyId = request.companyId
			assert(companyId !== undefined)
			assert(companyId !== null)
			const user = request.body.user;
			if (user === undefined)
				throw new Error(`Can't find <user> object in request body`);
			user.companyId = companyId
			// TODO  encrypt password !!! (see auth-model.js function register)
			let newUser = await UserModel.createUser(user);
			if (newUser.id === undefined)
				throw new Error(`Can't find ID of newly created User`);
			delete newUser.password
			// TODO should use View.sendJsonResult
			response.json({ ok: true, user : newUser });
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error;
			// TODO should use View.sendJsonError
			response.json({ ok : false, error: errorMessage  });
		}
	});

	app.post('/api/v1/user/edit', withAuth, async (request, response) => {
		try {
			const user = request.body.user
			if (user === undefined)
				throw new Error(`Can't find <user> object in request body`)
			let editedUser = await UserModel.editUser(user)
			if (editedUser.id !== user.id)
				throw new Error(`Edited User ID does not match`)
			response.json({ ok: true, user : editedUser })
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error
			response.json({ ok : false, error: errorMessage  })
		}
	});


	app.post('/api/v1/user/:userId/delete', withAuth, async (request, response) => {
		let userId = request.params.userId;
		assert (userId !== undefined);
		if (isNaN(userId)) {
			View.sendJsonError(response, `User ID <${ userId}> is not a number`);
			return;
		}
		userId = parseInt(userId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const user = await UserModel.getUserById(userId);
			if (user === null)
				throw new Error(`User ID <${ userId }> not found`);
			// control root property 
			if (request.companyId !== user.companyId)
				throw new Error(`Unauthorized access : TokenCompanyId=${request.companyId} UserCompanyID=${user.companyId}`);
			const success = await UserModel.deleteById(userId, recursive);
			View.sendJsonResult(response, {success} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

