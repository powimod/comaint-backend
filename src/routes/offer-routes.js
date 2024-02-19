/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * offer-routes.js
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

module.exports = (app, OfferModel, View) => {

	app.get('/api/v1/offer/list', withAuth, async (request, response) => {
		const filters = {};
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
			const offerList = await OfferModel.findOfferList(filters, params);
			View.sendJsonResult(response, { offerList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/offer/:offerId', withAuth, async (request, response) => {
		let offerId = request.params.offerId;
		assert (offerId !== undefined);
		if (isNaN(offerId)) {
			View.sendJsonError(response, `Offer ID <${ offerId}> is not a number`);
			return;
		}
		offerId = parseInt(offerId);
		try {
			const offer = await OfferModel.getOfferById(offerId);
			if (offer === null)
				throw new Error(`Offer ID <${ offerId }> not found`);
			// No root property to control
			View.sendJsonResult(response, { offer: offer});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/offer/:offerId/children-count', withAuth, async (request, response) => {
		let offerId = request.params.offerId;
		assert (offerId !== undefined);
		if (isNaN(offerId)) {
			View.sendJsonError(response, `Offer ID <${ offerId }> is not a number`);
			return;
		}
		offerId = parseInt(offerId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(offerId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ offerId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/offer/create', withAuth, async (request, response) => {
		try {
			const offer = request.body.offer;
			if (offer === undefined)
				throw new Error(`Can't find <offer> object in request body`);
			let newOffer = await OfferModel.createOffer(offer, request.t);
			if (newOffer.id === undefined)
				throw new Error(`Can't find ID of newly created Offer`);
			View.sendJsonResult(response, { offer : newOffer });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/offer/edit', withAuth, async (request, response) => {
		try {
			const offer = request.body.offer
			if (offer === undefined)
				throw new Error(`Can't find <offer> object in request body`)
			let editedOffer = await OfferModel.editOffer(offer, request.t)
			if (editedOffer.id !== offer.id)
				throw new Error(`Edited Offer ID does not match`)
			View.sendJsonResult(response, { offer : editedOffer })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/offer/:offerId/delete', withAuth, async (request, response) => {
		let offerId = request.params.offerId;
		assert (offerId !== undefined);
		if (isNaN(offerId)) {
			View.sendJsonError(response, `Offer ID <${ offerId}> is not a number`);
			return;
		}
		offerId = parseInt(offerId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const offer = await OfferModel.getOfferById(offerId);
			if (offer === null)
				throw new Error(`Offer ID <${ offerId }> not found`);
			// No root property to control
			const success = await OfferModel.deleteById(offerId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

