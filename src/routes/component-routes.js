/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * component-routes.js
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

module.exports = (app, ComponentModel, View) => {

	app.get('/api/v1/component/list', withAuth, async (request, response) => {
		const filters = {};
		let equipmentFamilyId = request.query.equipmentFamilyId;
		if (equipmentFamilyId !== undefined) {
			if (isNaN(equipmentFamilyId))
				throw new Error('Query <equipmentFamilyId> is not a number');
			equipmentFamilyId = parseInt(equipmentFamilyId);
			filters.equipmentFamilyId = equipmentFamilyId;
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
			const componentList = await ComponentModel.findComponentList(filters, params);
			View.sendJsonResult(response, { componentList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/component/:componentId', withAuth, async (request, response) => {
		let componentId = request.params.componentId;
		assert (componentId !== undefined);
		if (isNaN(componentId)) {
			View.sendJsonError(response, `Component ID <${ componentId}> is not a number`);
			return;
		}
		componentId = parseInt(componentId);
		try {
			const component = await ComponentModel.getComponentById(componentId);
			if (component === null)
				throw new Error(`Component ID <${ componentId }> not found`);
			// control root property 
			if (request.companyId !== component.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { component });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/component/:componentId/children-count', withAuth, async (request, response) => {
		let componentId = request.params.componentId;
		assert (componentId !== undefined);
		if (isNaN(componentId)) {
			View.sendJsonError(response, `Offer ID <${ componentId}> is not a number`);
			return;
		}
		componentId = parseInt(componentId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(componentId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ componentId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/component/create', withAuth, async (request, response) => {
		try {
			const component = request.body.component;
			if (component === undefined)
				throw new Error(`Can't find <component> object in request body`);
			// control root property 
			if (component.companyId === undefined) {
				component.companyId = request.companyId;
			}
			else {
				if (component.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newComponent = await ComponentModel.createComponent(component, request.t);
			if (newComponent.id === undefined)
				throw new Error(`Can't find ID of newly created Component`);
			View.sendJsonResult(response, { component : newComponent });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/component/edit', withAuth, async (request, response) => {
		try {
			const component = request.body.component
			if (component === undefined)
				throw new Error(`Can't find <component> object in request body`)
			// control root property 
			if (component.companyId === undefined) {
				component.companyId = request.companyId;
			}
			else {
				if (component.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedComponent = await ComponentModel.editComponent(component, request.t)
			if (editedComponent.id !== component.id)
				throw new Error(`Edited Component ID does not match`)
			View.sendJsonResult(response, { component : editedComponent })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/component/:componentId/delete', withAuth, async (request, response) => {
		let componentId = request.params.componentId;
		assert (componentId !== undefined);
		if (isNaN(componentId)) {
			View.sendJsonError(response, `Component ID <${ componentId}> is not a number`);
			return;
		}
		componentId = parseInt(componentId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const component = await ComponentModel.getComponentById(componentId);
			if (component === null)
				throw new Error(`Component ID <${ componentId }> not found`);
			// control root property 
			if (request.companyId !== component.companyId)
				throw new Error('Unauthorized access');
			const success = await ComponentModel.deleteById(componentId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

