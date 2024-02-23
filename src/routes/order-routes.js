/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * order-routes.js
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

module.exports = (app, OrderModel, View) => {

	app.get('/api/v1/order/list', withAuth, async (request, response) => {
		const filters = {};
		let supplierId = request.query.supplierId;
		if (supplierId !== undefined) {
			if (isNaN(supplierId))
				throw new Error('Query <supplierId> is not a number');
			supplierId = parseInt(supplierId);
			filters.supplierId = supplierId;
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
			const orderList = await OrderModel.findOrderList(filters, params);
			View.sendJsonResult(response, { orderList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/order/:orderId', withAuth, async (request, response) => {
		let orderId = request.params.orderId;
		assert (orderId !== undefined);
		if (isNaN(orderId)) {
			View.sendJsonError(response, `Order ID <${ orderId}> is not a number`);
			return;
		}
		orderId = parseInt(orderId);
		try {
			const order = await OrderModel.getOrderById(orderId);
			if (order === null)
				throw new Error(`Order ID <${ orderId }> not found`);
			// control root property 
			if (request.companyId !== order.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { order });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/order/:orderId/children-count', withAuth, async (request, response) => {
		let orderId = request.params.orderId;
		assert (orderId !== undefined);
		if (isNaN(orderId)) {
			View.sendJsonError(response, `Offer ID <${ orderId}> is not a number`);
			return;
		}
		orderId = parseInt(orderId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(orderId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ orderId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/order/create', withAuth, async (request, response) => {
		try {
			const order = request.body.order;
			if (order === undefined)
				throw new Error(`Can't find <order> object in request body`);
			// control root property 
			if (order.companyId === undefined) {
				order.companyId = request.companyId;
			}
			else {
				if (order.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newOrder = await OrderModel.createOrder(order, request.t);
			if (newOrder.id === undefined)
				throw new Error(`Can't find ID of newly created Order`);
			View.sendJsonResult(response, { order : newOrder });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/order/:orderId', withAuth, async (request, response) => {
		try {
			let orderId = request.params.orderId;
			assert (orderId !== undefined);
			if (isNaN(orderId))
				throw new Error(`Order ID <${ orderId}> is not a number`);
			orderId = parseInt(orderId);

			const order = request.body.order
			if (order === undefined)
				throw new Error(`Can't find <order> object in request body`)

			if (order.id !== undefined && order.id != orderId )
				throw new Error(`<Order> ID does not match`)

			// control root property 
			if (order.companyId === undefined) {
				order.companyId = request.companyId;
			}
			else {
				if (order.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedOrder = await OrderModel.editOrder(order, request.t)
			if (editedOrder.id !== order.id)
				throw new Error(`Edited Order ID does not match`)
			View.sendJsonResult(response, { order : editedOrder })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/order/:orderId', withAuth, async (request, response) => {
		let orderId = request.params.orderId;
		assert (orderId !== undefined);
		if (isNaN(orderId)) {
			View.sendJsonError(response, `Order ID <${ orderId}> is not a number`);
			return;
		}
		orderId = parseInt(orderId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const order = await OrderModel.getOrderById(orderId);
			if (order === null)
				throw new Error(`Order ID <${ orderId }> not found`);
			// control root property 
			if (request.companyId !== order.companyId)
				throw new Error('Unauthorized access');
			const success = await OrderModel.deleteById(orderId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

