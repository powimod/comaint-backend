/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * supplier-routes.js
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

module.exports = (app, SupplierModel, View) => {

	app.get('/api/v1/supplier/list', withAuth, async (request, response) => {
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
			const supplierList = await SupplierModel.findSupplierList(filters, params);
			View.sendJsonResult(response, { supplierList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/supplier/:supplierId', withAuth, async (request, response) => {
		let supplierId = request.params.supplierId;
		assert (supplierId !== undefined);
		if (isNaN(supplierId)) {
			View.sendJsonError(response, `Supplier ID <${ supplierId}> is not a number`);
			return;
		}
		supplierId = parseInt(supplierId);
		try {
			const supplier = await SupplierModel.getSupplierById(supplierId);
			if (supplier === null)
				throw new Error(`Supplier ID <${ supplierId }> not found`);
			// control root property 
			if (request.companyId !== supplier.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { supplier });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/supplier/:supplierId/children-count', withAuth, async (request, response) => {
		let supplierId = request.params.supplierId;
		assert (supplierId !== undefined);
		if (isNaN(supplierId)) {
			View.sendJsonError(response, `Offer ID <${ supplierId}> is not a number`);
			return;
		}
		supplierId = parseInt(supplierId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(supplierId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ supplierId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/supplier/create', withAuth, async (request, response) => {
		try {
			const supplier = request.body.supplier;
			if (supplier === undefined)
				throw new Error(`Can't find <supplier> object in request body`);
			// control root property 
			if (supplier.companyId === undefined) {
				supplier.companyId = request.companyId;
			}
			else {
				if (supplier.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newSupplier = await SupplierModel.createSupplier(supplier, request.t);
			if (newSupplier.id === undefined)
				throw new Error(`Can't find ID of newly created Supplier`);
			View.sendJsonResult(response, { supplier : newSupplier });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/supplier/:supplierId', withAuth, async (request, response) => {
		try {
			let supplierId = request.params.supplierId;
			assert (supplierId !== undefined);
			if (isNaN(supplierId)) {
				throw new Error(`Supplier ID <${ supplierId}> is not a number`);
			supplierId = parseInt(supplierId);

			const supplier = request.body.supplier
			if (supplier === undefined)
				throw new Error(`Can't find <supplier> object in request body`)

			if (supplier.id !== undefined && supplier.id != supplierId )
				throw new Error(`<Supplier> ID does not match`)

			// control root property 
			if (supplier.companyId === undefined) {
				supplier.companyId = request.companyId;
			}
			else {
				if (supplier.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedSupplier = await SupplierModel.editSupplier(supplier, request.t)
			if (editedSupplier.id !== supplier.id)
				throw new Error(`Edited Supplier ID does not match`)
			View.sendJsonResult(response, { supplier : editedSupplier })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/supplier/:supplierId', withAuth, async (request, response) => {
		let supplierId = request.params.supplierId;
		assert (supplierId !== undefined);
		if (isNaN(supplierId)) {
			View.sendJsonError(response, `Supplier ID <${ supplierId}> is not a number`);
			return;
		}
		supplierId = parseInt(supplierId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const supplier = await SupplierModel.getSupplierById(supplierId);
			if (supplier === null)
				throw new Error(`Supplier ID <${ supplierId }> not found`);
			// control root property 
			if (request.companyId !== supplier.companyId)
				throw new Error('Unauthorized access');
			const success = await SupplierModel.deleteById(supplierId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

