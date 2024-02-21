/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * token-routes.js
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

module.exports = (app, TokenModel, View) => {

	app.get('/api/v1/token/list', withAuth, async (request, response) => {
		const filters = {};
		let userId = request.query.userId;
		if (userId !== undefined) {
			if (isNaN(userId))
				throw new Error('Query <userId> is not a number');
			userId = parseInt(userId);
			filters.userId = userId;
		}
		assert(request.companyId !== undefined);
		try {
			let resultsPerPage = request.query.resultsPerPage;
			let offset = request.query.offset;
			const params = {
				resultsPerPage : resultsPerPage,
				offset : offset
			};
			const tokenList = await TokenModel.findTokenList(filters, params);
			View.sendJsonResult(response, { tokenList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/token/:tokenId', withAuth, async (request, response) => {
		let tokenId = request.params.tokenId;
		assert (tokenId !== undefined);
		if (isNaN(tokenId)) {
			View.sendJsonError(response, `Token ID <${ tokenId}> is not a number`);
			return;
		}
		tokenId = parseInt(tokenId);
		try {
			const token = await TokenModel.getTokenById(tokenId);
			if (token === null)
				throw new Error(`Token ID <${ tokenId }> not found`);

			// No root property to control
			View.sendJsonResult(response, { token });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/token/:tokenId/children-count', withAuth, async (request, response) => {
		let tokenId = request.params.tokenId;
		assert (tokenId !== undefined);
		if (isNaN(tokenId)) {
			View.sendJsonError(response, `Offer ID <${ tokenId}> is not a number`);
			return;
		}
		tokenId = parseInt(tokenId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(tokenId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ tokenId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/token/create', withAuth, async (request, response) => {
		try {
			const token = request.body.token;
			if (token === undefined)
				throw new Error(`Can't find <token> object in request body`);
			// No root property to control
			let newToken = await TokenModel.createToken(token, request.t);
			if (newToken.id === undefined)
				throw new Error(`Can't find ID of newly created Token`);
			View.sendJsonResult(response, { token : newToken });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/token/edit', withAuth, async (request, response) => {
		try {
			const token = request.body.token
			if (token === undefined)
				throw new Error(`Can't find <token> object in request body`)

			// No root property to control
			let editedToken = await TokenModel.editToken(token, request.t)
			if (editedToken.id !== token.id)
				throw new Error(`Edited Token ID does not match`)
			View.sendJsonResult(response, { token : editedToken })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/token/:tokenId/delete', withAuth, async (request, response) => {
		let tokenId = request.params.tokenId;
		assert (tokenId !== undefined);
		if (isNaN(tokenId)) {
			View.sendJsonError(response, `Token ID <${ tokenId}> is not a number`);
			return;
		}
		tokenId = parseInt(tokenId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const token = await TokenModel.getTokenById(tokenId);
			if (token === null)
				throw new Error(`Token ID <${ tokenId }> not found`);

			// No root property to control
			const success = await TokenModel.deleteById(tokenId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

