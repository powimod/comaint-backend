/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * inventory-routes.js
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

module.exports = (app, InventoryModel, View) => {

	app.get('/api/v1/inventory/list', withAuth, async (request, response) => {
		const filters = {};
		let articleId = request.query.articleId;
		if (articleId !== undefined) {
			if (isNaN(articleId))
				throw new Error('Query <articleId> is not a number');
			articleId = parseInt(articleId);
			filters.articleId = articleId;
		}
		let userId = request.query.userId;
		if (userId !== undefined) {
			if (isNaN(userId))
				throw new Error('Query <userId> is not a number');
			userId = parseInt(userId);
			filters.userId = userId;
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
			const inventoryList = await InventoryModel.findInventoryList(filters, params);
			View.sendJsonResult(response, { inventoryList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/inventory/:inventoryId', withAuth, async (request, response) => {
		let inventoryId = request.params.inventoryId;
		assert (inventoryId !== undefined);
		if (isNaN(inventoryId)) {
			View.sendJsonError(response, `Inventory ID <${ inventoryId}> is not a number`);
			return;
		}
		inventoryId = parseInt(inventoryId);
		try {
			const inventory = await InventoryModel.getInventoryById(inventoryId);
			if (inventory === null)
				throw new Error(`Inventory ID <${ inventoryId }> not found`);
			// control root property 
			if (request.companyId !== inventory.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { inventory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/inventory/:inventoryId/children-count', withAuth, async (request, response) => {
		let inventoryId = request.params.inventoryId;
		assert (inventoryId !== undefined);
		if (isNaN(inventoryId)) {
			View.sendJsonError(response, `Offer ID <${ inventoryId}> is not a number`);
			return;
		}
		inventoryId = parseInt(inventoryId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(inventoryId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ inventoryId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/inventory/create', withAuth, async (request, response) => {
		try {
			const inventory = request.body.inventory;
			if (inventory === undefined)
				throw new Error(`Can't find <inventory> object in request body`);
			// control root property 
			if (inventory.companyId === undefined) {
				inventory.companyId = request.companyId;
			}
			else {
				if (inventory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newInventory = await InventoryModel.createInventory(inventory, request.t);
			if (newInventory.id === undefined)
				throw new Error(`Can't find ID of newly created Inventory`);
			View.sendJsonResult(response, { inventory : newInventory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/inventory/edit', withAuth, async (request, response) => {
		try {
			const inventory = request.body.inventory
			if (inventory === undefined)
				throw new Error(`Can't find <inventory> object in request body`)
			// control root property 
			if (inventory.companyId === undefined) {
				inventory.companyId = request.companyId;
			}
			else {
				if (inventory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedInventory = await InventoryModel.editInventory(inventory, request.t)
			if (editedInventory.id !== inventory.id)
				throw new Error(`Edited Inventory ID does not match`)
			View.sendJsonResult(response, { inventory : editedInventory })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/inventory/:inventoryId/delete', withAuth, async (request, response) => {
		let inventoryId = request.params.inventoryId;
		assert (inventoryId !== undefined);
		if (isNaN(inventoryId)) {
			View.sendJsonError(response, `Inventory ID <${ inventoryId}> is not a number`);
			return;
		}
		inventoryId = parseInt(inventoryId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const inventory = await InventoryModel.getInventoryById(inventoryId);
			if (inventory === null)
				throw new Error(`Inventory ID <${ inventoryId }> not found`);
			// control root property 
			if (request.companyId !== inventory.companyId)
				throw new Error('Unauthorized access');
			const success = await InventoryModel.deleteById(inventoryId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

