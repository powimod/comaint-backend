/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * changed-article-routes.js
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

module.exports = (app, ChangedArticleModel, View) => {

	app.get('/api/v1/changed-article/list', withAuth, async (request, response) => {
		const filters = {};
		let interventionId = request.query.interventionId;
		if (interventionId !== undefined) {
			if (isNaN(interventionId))
				throw new Error('Query <interventionId> is not a number');
			interventionId = parseInt(interventionId);
			filters.interventionId = interventionId;
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
			const changedArticleList = await ChangedArticleModel.findChangedArticleList(filters, params);
			View.sendJsonResult(response, { changedArticleList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/changed-article/:changedArticleId', withAuth, async (request, response) => {
		let changedArticleId = request.params.changedArticleId;
		assert (changedArticleId !== undefined);
		if (isNaN(changedArticleId)) {
			View.sendJsonError(response, `ChangedArticle ID <${ changedArticleId}> is not a number`);
			return;
		}
		changedArticleId = parseInt(changedArticleId);
		try {
			const changedArticle = await ChangedArticleModel.getChangedArticleById(changedArticleId);
			if (changedArticle === null)
				throw new Error(`ChangedArticle ID <${ changedArticleId }> not found`);
			// control root property 
			if (request.companyId !== changedArticle.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { changedArticle });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/changed-article/:changedArticleId/children-count', withAuth, async (request, response) => {
		let changedArticleId = request.params.changedArticleId;
		assert (changedArticleId !== undefined);
		if (isNaN(changedArticleId)) {
			View.sendJsonError(response, `Offer ID <${ changedArticleId}> is not a number`);
			return;
		}
		changedArticleId = parseInt(changedArticleId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(changedArticleId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ changedArticleId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/changed_article/create', withAuth, async (request, response) => {
		try {
			const changedArticle = request.body.changedArticle;
			if (changedArticle === undefined)
				throw new Error(`Can't find <changedArticle> object in request body`);
			// control root property 
			if (changedArticle.companyId === undefined) {
				changedArticle.companyId = request.companyId;
			}
			else {
				if (changedArticle.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newChangedArticle = await ChangedArticleModel.createChangedArticle(changedArticle, request.t);
			if (newChangedArticle.id === undefined)
				throw new Error(`Can't find ID of newly created ChangedArticle`);
			View.sendJsonResult(response, { changedArticle : newChangedArticle });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/changed_article/edit', withAuth, async (request, response) => {
		try {
			const changedArticle = request.body.changedArticle
			if (changedArticle === undefined)
				throw new Error(`Can't find <changedArticle> object in request body`)
			// control root property 
			if (changedArticle.companyId === undefined) {
				changedArticle.companyId = request.companyId;
			}
			else {
				if (changedArticle.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedChangedArticle = await ChangedArticleModel.editChangedArticle(changedArticle, request.t)
			if (editedChangedArticle.id !== changedArticle.id)
				throw new Error(`Edited ChangedArticle ID does not match`)
			View.sendJsonResult(response, { changedArticle : editedChangedArticle })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/changed-article/:changedArticleId/delete', withAuth, async (request, response) => {
		let changedArticleId = request.params.changedArticleId;
		assert (changedArticleId !== undefined);
		if (isNaN(changedArticleId)) {
			View.sendJsonError(response, `ChangedArticle ID <${ changedArticleId}> is not a number`);
			return;
		}
		changedArticleId = parseInt(changedArticleId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const changedArticle = await ChangedArticleModel.getChangedArticleById(changedArticleId);
			if (changedArticle === null)
				throw new Error(`ChangedArticle ID <${ changedArticleId }> not found`);
			// control root property 
			if (request.companyId !== changedArticle.companyId)
				throw new Error('Unauthorized access');
			const success = await ChangedArticleModel.deleteById(changedArticleId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

