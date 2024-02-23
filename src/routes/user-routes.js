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
			const userList = await UserModel.findUserList(filters, params);
			for (const user of userList) {
				// remove secret property [password]
				delete user['password']
			}
			View.sendJsonResult(response, { userList });
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
			// remove secret property [password]
			delete user['password']
			View.sendJsonResult(response, { user });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/user/:userId/children-count', withAuth, async (request, response) => {
		let userId = request.params.userId;
		assert (userId !== undefined);
		if (isNaN(userId)) {
			View.sendJsonError(response, `Offer ID <${ userId}> is not a number`);
			return;
		}
		userId = parseInt(userId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(userId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ userId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/user/create', withAuth, async (request, response) => {
		try {
			const user = request.body.user;
			if (user === undefined)
				throw new Error(`Can't find <user> object in request body`);
			// control root property 
			if (user.companyId === undefined) {
				user.companyId = request.companyId;
			}
			else {
				if (user.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newUser = await UserModel.createUser(user, request.t);
			if (newUser.id === undefined)
				throw new Error(`Can't find ID of newly created User`);
			// remove secret property [password]
			delete newUser['password']
			View.sendJsonResult(response, { user : newUser });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/user/:userId', withAuth, async (request, response) => {
		try {
			let userId = request.params.userId;
			assert (userId !== undefined);
			if (isNaN(userId))
				throw new Error(`User ID <${ userId}> is not a number`);
			userId = parseInt(userId);

			const user = request.body.user
			if (user === undefined)
				throw new Error(`Can't find <user> object in request body`)

			if (user.id !== undefined && user.id != userId )
				throw new Error(`<User> ID does not match`)

			// control root property 
			if (user.companyId === undefined) {
				user.companyId = request.companyId;
			}
			else {
				if (user.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedUser = await UserModel.editUser(user, request.t)
			if (editedUser.id !== user.id)
				throw new Error(`Edited User ID does not match`)
			// remove secret property [password]
			delete editedUser['password']
			View.sendJsonResult(response, { user : editedUser })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/user/:userId', withAuth, async (request, response) => {
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
				throw new Error('Unauthorized access');
			const success = await UserModel.deleteById(userId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

