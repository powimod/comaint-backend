/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * subscription-routes.js
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

module.exports = (app, SubscriptionModel, View) => {

	app.get('/api/v1/subscription/list', withAuth, async (request, response) => {
		const filters = {};
		let offerId = request.query.offerId;
		if (offerId !== undefined) {
			if (isNaN(offerId))
				throw new Error('Query <offerId> is not a number');
			offerId = parseInt(offerId);
			filters.offerId = offerId;
		}
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
			const subscriptionList = await SubscriptionModel.findSubscriptionList(filters, params);
			View.sendJsonResult(response, { subscriptionList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/subscription/:subscriptionId', withAuth, async (request, response) => {
		let subscriptionId = request.params.subscriptionId;
		assert (subscriptionId !== undefined);
		if (isNaN(subscriptionId)) {
			View.sendJsonError(response, `Subscription ID <${ subscriptionId}> is not a number`);
			return;
		}
		subscriptionId = parseInt(subscriptionId);
		try {
			const subscription = await SubscriptionModel.getSubscriptionById(subscriptionId);
			if (subscription === null)
				throw new Error(`Subscription ID <${ subscriptionId }> not found`);
			// control root property 
			if (request.companyId !== subscription.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { subscription });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/subscription/:subscriptionId/children-count', withAuth, async (request, response) => {
		let subscriptionId = request.params.subscriptionId;
		assert (subscriptionId !== undefined);
		if (isNaN(subscriptionId)) {
			View.sendJsonError(response, `Offer ID <${ subscriptionId}> is not a number`);
			return;
		}
		subscriptionId = parseInt(subscriptionId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(subscriptionId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ subscriptionId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/subscription/create', withAuth, async (request, response) => {
		try {
			const subscription = request.body.subscription;
			if (subscription === undefined)
				throw new Error(`Can't find <subscription> object in request body`);
			let newSubscription = await SubscriptionModel.createSubscription(subscription, request.t);
			if (newSubscription.id === undefined)
				throw new Error(`Can't find ID of newly created Subscription`);
			View.sendJsonResult(response, { subscription : newSubscription });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/subscription/edit', withAuth, async (request, response) => {
		try {
			const subscription = request.body.subscription
			if (subscription === undefined)
				throw new Error(`Can't find <subscription> object in request body`)
			let editedSubscription = await SubscriptionModel.editSubscription(subscription, request.t)
			if (editedSubscription.id !== subscription.id)
				throw new Error(`Edited Subscription ID does not match`)
			View.sendJsonResult(response, { subscription : editedSubscription })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/subscription/:subscriptionId/delete', withAuth, async (request, response) => {
		let subscriptionId = request.params.subscriptionId;
		assert (subscriptionId !== undefined);
		if (isNaN(subscriptionId)) {
			View.sendJsonError(response, `Subscription ID <${ subscriptionId}> is not a number`);
			return;
		}
		subscriptionId = parseInt(subscriptionId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const subscription = await SubscriptionModel.getSubscriptionById(subscriptionId);
			if (subscription === null)
				throw new Error(`Subscription ID <${ subscriptionId }> not found`);
			// control root property 
			if (request.companyId !== subscription.companyId)
				throw new Error('Unauthorized access');
			const success = await SubscriptionModel.deleteById(subscriptionId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

