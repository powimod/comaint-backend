/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-sub-category-routes.js
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

module.exports = (app, ArticleSubCategoryModel, View) => {

	app.get('/api/v1/article-sub-category/list', withAuth, async (request, response) => {
		const filters = {};
		let articleCategoryId = request.query.articleCategoryId;
		if (articleCategoryId !== undefined) {
			if (isNaN(articleCategoryId))
				throw new Error('Query <articleCategoryId> is not a number');
			articleCategoryId = parseInt(articleCategoryId);
			filters.articleCategoryId = articleCategoryId;
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
			const articleSubCategoryList = await ArticleSubCategoryModel.findArticleSubCategoryList(filters, params);
			View.sendJsonResult(response, { articleSubCategoryList });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-sub-category/:articleSubCategoryId', withAuth, async (request, response) => {
		let articleSubCategoryId = request.params.articleSubCategoryId;
		assert (articleSubCategoryId !== undefined);
		if (isNaN(articleSubCategoryId)) {
			View.sendJsonError(response, `ArticleSubCategory ID <${ articleSubCategoryId}> is not a number`);
			return;
		}
		articleSubCategoryId = parseInt(articleSubCategoryId);
		try {
			const articleSubCategory = await ArticleSubCategoryModel.getArticleSubCategoryById(articleSubCategoryId);
			if (articleSubCategory === null)
				throw new Error(`ArticleSubCategory ID <${ articleSubCategoryId }> not found`);
			// control root property 
			if (request.companyId !== articleSubCategory.companyId)
				throw new Error('Unauthorized access');
			View.sendJsonResult(response, { articleSubCategory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.get('/api/v1/article-sub-category/:articleSubCategoryId/children-count', withAuth, async (request, response) => {
		let articleSubCategoryId = request.params.articleSubCategoryId;
		assert (articleSubCategoryId !== undefined);
		if (isNaN(articleSubCategoryId)) {
			View.sendJsonError(response, `Offer ID <${ articleSubCategoryId}> is not a number`);
			return;
		}
		articleSubCategoryId = parseInt(articleSubCategoryId);
		try {
			const childrenCountList = await OfferModel.getChildrenCountList(articleSubCategoryId);
			if (childrenCountList === null)
				throw new Error(`Offer ID <${ articleSubCategoryId }> not found`);
			View.sendJsonResult(response, { childrenCountList } );
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	})



	app.post('/api/v1/article_sub_category/create', withAuth, async (request, response) => {
		try {
			const articleSubCategory = request.body.articleSubCategory;
			if (articleSubCategory === undefined)
				throw new Error(`Can't find <articleSubCategory> object in request body`);
			// control root property 
			if (articleSubCategory.companyId === undefined) {
				articleSubCategory.companyId = request.companyId;
			}
			else {
				if (articleSubCategory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let newArticleSubCategory = await ArticleSubCategoryModel.createArticleSubCategory(articleSubCategory, request.t);
			if (newArticleSubCategory.id === undefined)
				throw new Error(`Can't find ID of newly created ArticleSubCategory`);
			View.sendJsonResult(response, { articleSubCategory : newArticleSubCategory });
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});

	app.put('/api/v1/article-sub-category/:articleSubCategoryId', withAuth, async (request, response) => {
		try {
			let articleSubCategoryId = request.params.articleSubCategoryId;
			assert (articleSubCategoryId !== undefined);
			if (isNaN(articleSubCategoryId))
				throw new Error(`ArticleSubCategory ID <${ articleSubCategoryId}> is not a number`);
			articleSubCategoryId = parseInt(articleSubCategoryId);

			const articleSubCategory = request.body.articleSubCategory
			if (articleSubCategory === undefined)
				throw new Error(`Can't find <articleSubCategory> object in request body`)

			if (articleSubCategory.id !== undefined && articleSubCategory.id != articleSubCategoryId )
				throw new Error(`<ArticleSubCategory> ID does not match`)

			// control root property 
			if (articleSubCategory.companyId === undefined) {
				articleSubCategory.companyId = request.companyId;
			}
			else {
				if (articleSubCategory.companyId !== request.companyId)
					throw new Error('Unauthorized access');
			}
			let editedArticleSubCategory = await ArticleSubCategoryModel.editArticleSubCategory(articleSubCategory, request.t)
			if (editedArticleSubCategory.id !== articleSubCategory.id)
				throw new Error(`Edited ArticleSubCategory ID does not match`)
			View.sendJsonResult(response, { articleSubCategory : editedArticleSubCategory })
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


	app.delete('/api/v1/article-sub-category/:articleSubCategoryId', withAuth, async (request, response) => {
		let articleSubCategoryId = request.params.articleSubCategoryId;
		assert (articleSubCategoryId !== undefined);
		if (isNaN(articleSubCategoryId)) {
			View.sendJsonError(response, `ArticleSubCategory ID <${ articleSubCategoryId}> is not a number`);
			return;
		}
		articleSubCategoryId = parseInt(articleSubCategoryId);
		let recursive = request.body.recursive
		if (recursive  === undefined)
			recursive = false
		if (typeof(recursive) !== 'boolean') {
			View.sendJsonError(response, `recursive parameter is not a boolean`);
			return;
		}
		try {
			const articleSubCategory = await ArticleSubCategoryModel.getArticleSubCategoryById(articleSubCategoryId);
			if (articleSubCategory === null)
				throw new Error(`ArticleSubCategory ID <${ articleSubCategoryId }> not found`);
			// control root property 
			if (request.companyId !== articleSubCategory.companyId)
				throw new Error('Unauthorized access');
			const success = await ArticleSubCategoryModel.deleteById(articleSubCategoryId, recursive);
			View.sendJsonResult(response, {success});
		}
		catch (error) {
			View.sendJsonError(response, error);
		}
	});


}

