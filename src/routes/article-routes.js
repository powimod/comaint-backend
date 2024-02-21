/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-routes.js
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

module.exports = (app, ArticleModel, View) => {

	app.get('/api/v1/article/list', withAuth, async (request, response) => {
		const filters = {};
		let articleSubCategoryId = request.query.articleSubCategoryId;
		if (articleSubCategoryId !== undefined) {
			if (isNaN(articleSubCategoryId))
				throw new Error('Query <articleSubCategoryId> is not a number');
			articleSubCategoryId = parseInt(articleSubCategoryId);
			filters.articleSubCategoryId = articleSubCategoryId;
		}
		let sectionId = request.query.sectionId;
		if (sectionId !== undefined) {
			if (isNaN(sectionId))
				throw new Error('Query <sectionId> is not a number');
			sectionId = parseInt(sectionId);
			filters.sectionId = sectionId;
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
			const articleList = await ArticleModel.findArticleList(filters, params);
			View.sendJsonResult(response, { articleList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article/:articleId', withAuth, async (request, response) => {
		let articleId = request.params.articleId;
		assert (articleId !== undefined);
		if (isNaN(articleId)) {
			View.sendJsonError(response, `Article ID <${ articleId}> is not a number`);
			return;
		}
		articleId = parseInt(articleId);
		try {
			const article = await ArticleModel.getArticleById(articleId);
			if (article === null)
				throw new Error(`Article ID <${ articleId }> not found`);
			// control root property 
			if (request.companyId !== article.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { article });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article/:articleId/children-count', withAuth, async (request, response) => {
		let articleId = request.params.articleId;
		assert (articleId !== undefined);
		if (isNaN(articleId)) {
			View.sendJsonError(response, `Offer ID <${ articleId}> is not a number`);
			return;
		}
		articleId = parseInt(articleId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(articleId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ articleId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/article/create', withAuth, async (request, response) => {
		try {
			const article = request.body.article;
			if (article === undefined)
				throw new Error(`Can't find <article> object in request body`);
			// control root property 
			if (article.companyId === undefined) {
				article.companyId = request.companyId;
			}
			else {
				if (article.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newArticle = await ArticleModel.createArticle(article, request.t);
			if (newArticle.id === undefined)
				throw new Error(`Can't find ID of newly created Article`);
			View.sendJsonResult(response, { article : newArticle });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.post('/api/v1/article/edit', withAuth, async (request, response) => {
		try {
			const article = request.body.article
			if (article === undefined)
				throw new Error(`Can't find <article> object in request body`)
			// control root property 
			if (article.companyId === undefined) {
				article.companyId = request.companyId;
			}
			else {
				if (article.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedArticle = await ArticleModel.editArticle(article, request.t)
			if (editedArticle.id !== article.id)
				throw new Error(`Edited Article ID does not match`)
			View.sendJsonResult(response, { article : editedArticle })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.post('/api/v1/article/:articleId/delete', withAuth, async (request, response) => {
		let articleId = request.params.articleId;
		assert (articleId !== undefined);
		if (isNaN(articleId)) {
			View.sendJsonError(response, `Article ID <${ articleId}> is not a number`);
			return;
		}
		articleId = parseInt(articleId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const article = await ArticleModel.getArticleById(articleId);
			if (article === null)
				throw new Error(`Article ID <${ articleId }> not found`);
			// control root property 
			if (request.companyId !== article.companyId)
				throw new Error('Unauthorized access');
			const success = await ArticleModel.deleteById(articleId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

