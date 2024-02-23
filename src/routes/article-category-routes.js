/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-category-routes.js
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

module.exports = (app, ArticleCategoryModel, View) => {

	app.get('/api/v1/article-category/list', withAuth, async (request, response) => {
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
			const articleCategoryList = await ArticleCategoryModel.findArticleCategoryList(filters, params);
			View.sendJsonResult(response, { articleCategoryList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-category/:articleCategoryId', withAuth, async (request, response) => {
		let articleCategoryId = request.params.articleCategoryId;
		assert (articleCategoryId !== undefined);
		if (isNaN(articleCategoryId)) {
			View.sendJsonError(response, `ArticleCategory ID <${ articleCategoryId}> is not a number`);
			return;
		}
		articleCategoryId = parseInt(articleCategoryId);
		try {
			const articleCategory = await ArticleCategoryModel.getArticleCategoryById(articleCategoryId);
			if (articleCategory === null)
				throw new Error(`ArticleCategory ID <${ articleCategoryId }> not found`);
			// control root property 
			if (request.companyId !== articleCategory.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { articleCategory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-category/:articleCategoryId/children-count', withAuth, async (request, response) => {
		let articleCategoryId = request.params.articleCategoryId;
		assert (articleCategoryId !== undefined);
		if (isNaN(articleCategoryId)) {
			View.sendJsonError(response, `Offer ID <${ articleCategoryId}> is not a number`);
			return;
		}
		articleCategoryId = parseInt(articleCategoryId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(articleCategoryId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ articleCategoryId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/article_category/create', withAuth, async (request, response) => {
		try {
			const articleCategory = request.body.articleCategory;
			if (articleCategory === undefined)
				throw new Error(`Can't find <articleCategory> object in request body`);
			// control root property 
			if (articleCategory.companyId === undefined) {
				articleCategory.companyId = request.companyId;
			}
			else {
				if (articleCategory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newArticleCategory = await ArticleCategoryModel.createArticleCategory(articleCategory, request.t);
			if (newArticleCategory.id === undefined)
				throw new Error(`Can't find ID of newly created ArticleCategory`);
			View.sendJsonResult(response, { articleCategory : newArticleCategory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/article-category/:articleCategoryId', withAuth, async (request, response) => {
		try {
			let articleCategoryId = request.params.articleCategoryId;
			assert (articleCategoryId !== undefined);
			if (isNaN(articleCategoryId))
				throw new Error(`ArticleCategory ID <${ articleCategoryId}> is not a number`);
			articleCategoryId = parseInt(articleCategoryId);

			const articleCategory = request.body.articleCategory
			if (articleCategory === undefined)
				throw new Error(`Can't find <articleCategory> object in request body`)

			if (articleCategory.id !== undefined && articleCategory.id != articleCategoryId )
				throw new Error(`<ArticleCategory> ID does not match`)

			// control root property 
			if (articleCategory.companyId === undefined) {
				articleCategory.companyId = request.companyId;
			}
			else {
				if (articleCategory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedArticleCategory = await ArticleCategoryModel.editArticleCategory(articleCategory, request.t)
			if (editedArticleCategory.id !== articleCategory.id)
				throw new Error(`Edited ArticleCategory ID does not match`)
			View.sendJsonResult(response, { articleCategory : editedArticleCategory })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/article-category/:articleCategoryId', withAuth, async (request, response) => {
		let articleCategoryId = request.params.articleCategoryId;
		assert (articleCategoryId !== undefined);
		if (isNaN(articleCategoryId)) {
			View.sendJsonError(response, `ArticleCategory ID <${ articleCategoryId}> is not a number`);
			return;
		}
		articleCategoryId = parseInt(articleCategoryId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const articleCategory = await ArticleCategoryModel.getArticleCategoryById(articleCategoryId);
			if (articleCategory === null)
				throw new Error(`ArticleCategory ID <${ articleCategoryId }> not found`);
			// control root property 
			if (request.companyId !== articleCategory.companyId)
				throw new Error('Unauthorized access');
			const success = await ArticleCategoryModel.deleteById(articleCategoryId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

