/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-to-change-routes.js
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

module.exports = (app, ArticleToChangeModel, View) => {

	app.get('/api/v1/article-to-change/list', withAuth, async (request, response) => {
		const filters = {};
		let workOrderId = request.query.workOrderId;
		if (workOrderId !== undefined) {
			if (isNaN(workOrderId))
				throw new Error('Query <workOrderId> is not a number');
			workOrderId = parseInt(workOrderId);
			filters.workOrderId = workOrderId;
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
			const articleToChangeList = await ArticleToChangeModel.findArticleToChangeList(filters, params);
			View.sendJsonResult(response, { articleToChangeList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-to-change/:articleToChangeId', withAuth, async (request, response) => {
		let articleToChangeId = request.params.articleToChangeId;
		assert (articleToChangeId !== undefined);
		if (isNaN(articleToChangeId)) {
			View.sendJsonError(response, `ArticleToChange ID <${ articleToChangeId}> is not a number`);
			return;
		}
		articleToChangeId = parseInt(articleToChangeId);
		try {
			const articleToChange = await ArticleToChangeModel.getArticleToChangeById(articleToChangeId);
			if (articleToChange === null)
				throw new Error(`ArticleToChange ID <${ articleToChangeId }> not found`);
			// control root property 
			if (request.companyId !== articleToChange.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { articleToChange });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-to-change/:articleToChangeId/children-count', withAuth, async (request, response) => {
		let articleToChangeId = request.params.articleToChangeId;
		assert (articleToChangeId !== undefined);
		if (isNaN(articleToChangeId)) {
			View.sendJsonError(response, `Offer ID <${ articleToChangeId}> is not a number`);
			return;
		}
		articleToChangeId = parseInt(articleToChangeId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(articleToChangeId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ articleToChangeId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/article_to_change/create', withAuth, async (request, response) => {
		try {
			const articleToChange = request.body.articleToChange;
			if (articleToChange === undefined)
				throw new Error(`Can't find <articleToChange> object in request body`);
			// control root property 
			if (articleToChange.companyId === undefined) {
				articleToChange.companyId = request.companyId;
			}
			else {
				if (articleToChange.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newArticleToChange = await ArticleToChangeModel.createArticleToChange(articleToChange, request.t);
			if (newArticleToChange.id === undefined)
				throw new Error(`Can't find ID of newly created ArticleToChange`);
			View.sendJsonResult(response, { articleToChange : newArticleToChange });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/article-to-change/:articleToChangeId', withAuth, async (request, response) => {
		try {
			let articleToChangeId = request.params.articleToChangeId;
			assert (articleToChangeId !== undefined);
			if (isNaN(articleToChangeId))
				throw new Error(`ArticleToChange ID <${ articleToChangeId}> is not a number`);
			articleToChangeId = parseInt(articleToChangeId);

			const articleToChange = request.body.articleToChange
			if (articleToChange === undefined)
				throw new Error(`Can't find <articleToChange> object in request body`)

			if (articleToChange.id !== undefined && articleToChange.id != articleToChangeId )
				throw new Error(`<ArticleToChange> ID does not match`)

			// control root property 
			if (articleToChange.companyId === undefined) {
				articleToChange.companyId = request.companyId;
			}
			else {
				if (articleToChange.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedArticleToChange = await ArticleToChangeModel.editArticleToChange(articleToChange, request.t)
			if (editedArticleToChange.id !== articleToChange.id)
				throw new Error(`Edited ArticleToChange ID does not match`)
			View.sendJsonResult(response, { articleToChange : editedArticleToChange })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/article-to-change/:articleToChangeId', withAuth, async (request, response) => {
		let articleToChangeId = request.params.articleToChangeId;
		assert (articleToChangeId !== undefined);
		if (isNaN(articleToChangeId)) {
			View.sendJsonError(response, `ArticleToChange ID <${ articleToChangeId}> is not a number`);
			return;
		}
		articleToChangeId = parseInt(articleToChangeId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const articleToChange = await ArticleToChangeModel.getArticleToChangeById(articleToChangeId);
			if (articleToChange === null)
				throw new Error(`ArticleToChange ID <${ articleToChangeId }> not found`);
			// control root property 
			if (request.companyId !== articleToChange.companyId)
				throw new Error('Unauthorized access');
			const success = await ArticleToChangeModel.deleteById(articleToChangeId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

