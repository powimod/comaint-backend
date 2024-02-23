/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * section-routes.js
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

module.exports = (app, SectionModel, View) => {

	app.get('/api/v1/section/list', withAuth, async (request, response) => {
		const filters = {};
		let unitId = request.query.unitId;
		if (unitId !== undefined) {
			if (isNaN(unitId))
				throw new Error('Query <unitId> is not a number');
			unitId = parseInt(unitId);
			filters.unitId = unitId;
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
			const sectionList = await SectionModel.findSectionList(filters, params);
			View.sendJsonResult(response, { sectionList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/section/:sectionId', withAuth, async (request, response) => {
		let sectionId = request.params.sectionId;
		assert (sectionId !== undefined);
		if (isNaN(sectionId)) {
			View.sendJsonError(response, `Section ID <${ sectionId}> is not a number`);
			return;
		}
		sectionId = parseInt(sectionId);
		try {
			const section = await SectionModel.getSectionById(sectionId);
			if (section === null)
				throw new Error(`Section ID <${ sectionId }> not found`);
			// control root property 
			if (request.companyId !== section.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { section });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/section/:sectionId/children-count', withAuth, async (request, response) => {
		let sectionId = request.params.sectionId;
		assert (sectionId !== undefined);
		if (isNaN(sectionId)) {
			View.sendJsonError(response, `Offer ID <${ sectionId}> is not a number`);
			return;
		}
		sectionId = parseInt(sectionId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(sectionId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ sectionId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/section/create', withAuth, async (request, response) => {
		try {
			const section = request.body.section;
			if (section === undefined)
				throw new Error(`Can't find <section> object in request body`);
			// control root property 
			if (section.companyId === undefined) {
				section.companyId = request.companyId;
			}
			else {
				if (section.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newSection = await SectionModel.createSection(section, request.t);
			if (newSection.id === undefined)
				throw new Error(`Can't find ID of newly created Section`);
			View.sendJsonResult(response, { section : newSection });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/section/:sectionId', withAuth, async (request, response) => {
		try {
			let sectionId = request.params.sectionId;
			assert (sectionId !== undefined);
			if (isNaN(sectionId)) {
				throw new Error(`Section ID <${ sectionId}> is not a number`);
			sectionId = parseInt(sectionId);

			const section = request.body.section
			if (section === undefined)
				throw new Error(`Can't find <section> object in request body`)

			if (section.id !== undefined && section.id != sectionId )
				throw new Error(`<Section> ID does not match`)

			// control root property 
			if (section.companyId === undefined) {
				section.companyId = request.companyId;
			}
			else {
				if (section.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedSection = await SectionModel.editSection(section, request.t)
			if (editedSection.id !== section.id)
				throw new Error(`Edited Section ID does not match`)
			View.sendJsonResult(response, { section : editedSection })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/section/:sectionId', withAuth, async (request, response) => {
		let sectionId = request.params.sectionId;
		assert (sectionId !== undefined);
		if (isNaN(sectionId)) {
			View.sendJsonError(response, `Section ID <${ sectionId}> is not a number`);
			return;
		}
		sectionId = parseInt(sectionId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const section = await SectionModel.getSectionById(sectionId);
			if (section === null)
				throw new Error(`Section ID <${ sectionId }> not found`);
			// control root property 
			if (request.companyId !== section.companyId)
				throw new Error('Unauthorized access');
			const success = await SectionModel.deleteById(sectionId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

