/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * order-line-routes.js
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

module.exports = (app, OrderLineModel, View) => {

	app.get('/api/v1/order-line/list', withAuth, async (request, response) => {
		const filters = {};
		let orderId = request.query.orderId;
		if (orderId !== undefined) {
			if (isNaN(orderId))
				throw new Error('Query <orderId> is not a number');
			orderId = parseInt(orderId);
			filters.orderId = orderId;
		}
		let articleId = request.query.articleId;
		if (articleId !== undefined) {
			if (isNaN(articleId))
				throw new Error('Query <articleId> is not a number');
			articleId = parseInt(articleId);
			filters.articleId = articleId;
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
			const orderLineList = await OrderLineModel.findOrderLineList(filters, params);
			View.sendJsonResult(response, { orderLineList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/order-line/:orderLineId', withAuth, async (request, response) => {
		let orderLineId = request.params.orderLineId;
		assert (orderLineId !== undefined);
		if (isNaN(orderLineId)) {
			View.sendJsonError(response, `OrderLine ID <${ orderLineId}> is not a number`);
			return;
		}
		orderLineId = parseInt(orderLineId);
		try {
			const orderLine = await OrderLineModel.getOrderLineById(orderLineId);
			if (orderLine === null)
				throw new Error(`OrderLine ID <${ orderLineId }> not found`);
			// control root property 
			if (request.companyId !== orderLine.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { orderLine });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/order-line/:orderLineId/children-count', withAuth, async (request, response) => {
		let orderLineId = request.params.orderLineId;
		assert (orderLineId !== undefined);
		if (isNaN(orderLineId)) {
			View.sendJsonError(response, `Offer ID <${ orderLineId}> is not a number`);
			return;
		}
		orderLineId = parseInt(orderLineId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(orderLineId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ orderLineId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/order_line/create', withAuth, async (request, response) => {
		try {
			const orderLine = request.body.orderLine;
			if (orderLine === undefined)
				throw new Error(`Can't find <orderLine> object in request body`);
			// control root property 
			if (orderLine.companyId === undefined) {
				orderLine.companyId = request.companyId;
			}
			else {
				if (orderLine.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newOrderLine = await OrderLineModel.createOrderLine(orderLine, request.t);
			if (newOrderLine.id === undefined)
				throw new Error(`Can't find ID of newly created OrderLine`);
			View.sendJsonResult(response, { orderLine : newOrderLine });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/order_line/edit', withAuth, async (request, response) => {
		try {
			const orderLine = request.body.orderLine
			if (orderLine === undefined)
				throw new Error(`Can't find <orderLine> object in request body`)
			// control root property 
			if (orderLine.companyId === undefined) {
				orderLine.companyId = request.companyId;
			}
			else {
				if (orderLine.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedOrderLine = await OrderLineModel.editOrderLine(orderLine, request.t)
			if (editedOrderLine.id !== orderLine.id)
				throw new Error(`Edited OrderLine ID does not match`)
			View.sendJsonResult(response, { orderLine : editedOrderLine })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/order-line/:orderLineId/delete', withAuth, async (request, response) => {
		let orderLineId = request.params.orderLineId;
		assert (orderLineId !== undefined);
		if (isNaN(orderLineId)) {
			View.sendJsonError(response, `OrderLine ID <${ orderLineId}> is not a number`);
			return;
		}
		orderLineId = parseInt(orderLineId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const orderLine = await OrderLineModel.getOrderLineById(orderLineId);
			if (orderLine === null)
				throw new Error(`OrderLine ID <${ orderLineId }> not found`);
			// control root property 
			if (request.companyId !== orderLine.companyId)
				throw new Error('Unauthorized access');
			const success = await OrderLineModel.deleteById(orderLineId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

