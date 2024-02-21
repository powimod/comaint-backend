/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * selector-routes.js
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



'use script'
const assert = require('assert')
const {withAuth} = require('./auth-routes')

module.exports = (app, OfferModel, View) => {

	app.get('/api/v1/selector/request', withAuth, async (request, response) => {
		/*
		const filters = {}
		assert(request.companyId !== undefined)
		try {
			if (filters.companyId === undefined) {
				filters.companyId = request.companyId
			}
			else {
				if (filters.companyId !== request.companyId)
					throw new Error('Unauthorized access')
			}
			let resultsPerPage = request.query.resultsPerPage
			let offset = request.query.offset
			const params = {
				resultsPerPage : resultsPerPage,
				offset : offset
			}
			const selectorList = await OfferModel.findOfferList(filters, params)
			View.sendJsonResult(response, { selectorList })
		}
		catch (error) {
			View.sendJsonError(response, error)
		}
		*/
	})
}
