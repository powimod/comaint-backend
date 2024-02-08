/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * company-routes.js
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

module.exports = (app, CompanyModel, View) => {

	app.get('/api/v1/company/list', withAuth, async (request, response) => {
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
			const list = await CompanyModel.getList(filters, params);
			View.sendJsonResult(response, { companyList: list } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/company/:companyId', withAuth, async (request, response) => {
		let companyId = request.params.companyId;
		assert (companyId !== undefined);
		if (isNaN(companyId)) {
			View.sendJsonError(response, `Company ID <${ companyId}> is not a number`);
			return;
		}
		companyId = parseInt(companyId);
		try {
			const company = await CompanyModel.getCompanyById(companyId);
			if (company === null)
				throw new Error(`Company ID <${ companyId }> not found`);
			// control root property 
			if (request.companyId !== company.id)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { company: company} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/company/create', withAuth, async (request, response) => {
		try {
			const company = request.body.company;
			if (company === undefined)
				throw new Error(`Can't find <company> object in request body`);
			let newCompany = await CompanyModel.createCompany(company);
			if (newCompany.id === undefined)
				throw new Error(`Can't find ID of newly created Company`);
			response.json({ ok: true, company : newCompany });
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error;
			response.json({ ok : false, error: errorMessage  });
		}
	});

	app.post('/api/v1/company/edit', withAuth, async (request, response) => {
		try {
			const company = request.body.company
			if (company === undefined)
				throw new Error(`Can't find <company> object in request body`)
			let editedCompany = await CompanyModel.editCompany(company)
			if (editedCompany.id !== company.id)
				throw new Error(`Edited Company ID does not match`)
			response.json({ ok: true, company : editedCompany })
		}
		catch (error) {
			const errorMessage = (error.message !== undefined) ? error.message : error
			response.json({ ok : false, error: errorMessage  })
		}
	});


	app.post('/api/v1/company/:companyId/delete', withAuth, async (request, response) => {
		let companyId = request.params.companyId;
		assert (companyId !== undefined);
		if (isNaN(companyId)) {
			View.sendJsonError(response, `Company ID <${ companyId}> is not a number`);
			return;
		}
		companyId = parseInt(companyId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const company = await CompanyModel.getCompanyById(companyId);
			if (company === null)
				throw new Error(`Company ID <${ companyId }> not found`);
			// control root property 
			if (request.companyId !== company.id)
				throw new Error('Unauthorized access');
			const success = await CompanyModel.deleteById(companyId, recursive);
			View.sendJsonResult(response, {success} );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

